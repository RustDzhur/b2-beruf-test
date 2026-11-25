// Monthly subscriptions and trials. The main administrator confirms a payment by hand in /admin; that starts a term
// of exactly one calendar month ("basic" = trainer, 5 €; "ai" = trainer + AI, 10 €). A trial gives 2 or 3 days once
// per account. When a term is over, the server closes the trainer and the AI for that student by itself (see
// _verify.js), and the daily check (Vercel Cron -> /api/cron/subs) e-mails a reminder 3 days before the end of a paid
// month and a notice when a month or a trial has ended.
// Firestore `subs/{uid}`: plan, until (ms; 0 = unlimited), warned / ended (the `until` a letter was sent for),
// trial (the current term is a trial), trialUsed (a trial was given once).
// No document = no term (unlimited): old students and everybody admitted before this feature keep their access.
const admin = require("./_admin.js");

const UID_RE = /^[A-Za-z0-9_-]{6,128}$/;
const DAY = 24 * 3600 * 1000, WARN_DAYS = 3;
const PRICE = { basic: 5, ai: 10 };
const fail = (status, code, message) => Object.assign(new Error(message), { status, code });
const mem = new Map(); // local preview / tests (fixtures, no Firestore)
const cache = new Map();
const useMem = () => { try { return !admin.serviceAccount() && !!admin.fixtureUsers(); } catch { return false; } };

// the same day of the next month (31 Jan -> 28/29 Feb)
function addMonth(ms) {
  const d = new Date(ms), day = d.getUTCDate();
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + 1);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.getTime();
}
const expired = (sub, now = Date.now()) => !!sub && sub.until > 0 && sub.until <= now;
const daysLeft = (sub, now = Date.now()) => sub && sub.until > 0 ? Math.max(0, Math.ceil((sub.until - now) / DAY)) : null;

function col() {
  const s = admin.serviceAccount();
  if (!s) throw fail(501, "no_service_account", "Не настроен ключ Firebase.");
  return "https://firestore.googleapis.com/v1/projects/" + encodeURIComponent(s.project_id) + "/databases/(default)/documents/subs";
}
async function req(url, opt) {
  try { return await fetch(url, Object.assign({}, opt, { headers: Object.assign({ authorization: "Bearer " + await admin.accessToken(), "content-type": "application/json" }, (opt && opt.headers) || {}) })); }
  catch (e) { if (e && e.code) throw e; throw fail(502, "firestore_unreachable", "Нет связи с Firestore."); }
}
const num = f => f ? Number(f.integerValue || f.doubleValue || 0) : 0;
const bool = f => !!(f && f.booleanValue);
function fromDoc(d) {
  const f = (d && d.fields) || {};
  return { plan: f.plan && f.plan.stringValue === "ai" ? "ai" : "basic", until: num(f.until), warned: num(f.warned), ended: num(f.ended),
    trial: bool(f.trial), trialUsed: bool(f.trialUsed), updateTime: (d && d.updateTime) || "" };
}
const clean = s => ({ plan: s.plan === "ai" ? "ai" : "basic", until: s.until || 0, warned: s.warned || 0, ended: s.ended || 0, trial: !!s.trial, trialUsed: !!s.trialUsed });
const toFields = s => ({ plan: { stringValue: s.plan }, until: { integerValue: String(s.until) }, warned: { integerValue: String(s.warned) },
  ended: { integerValue: String(s.ended) }, trial: { booleanValue: s.trial }, trialUsed: { booleanValue: s.trialUsed } });

async function get(uid) {
  uid = String(uid || "");
  if (!UID_RE.test(uid)) return null;
  if (useMem()) return mem.has(uid) ? Object.assign({}, mem.get(uid)) : null;
  const hit = cache.get(uid);
  if (hit && hit.exp > Date.now()) return hit.v;
  const r = await req(col() + "/" + uid);
  if (r.status !== 200 && r.status !== 404) throw fail(502, "verify_unavailable", "Firestore: HTTP " + r.status);
  const v = r.status === 200 ? fromDoc(await r.json().catch(() => ({}))) : null;
  if (cache.size > 5000) cache.clear();
  cache.set(uid, { v, exp: Date.now() + 60000 });
  return v;
}

async function put(uid, s) {
  s = clean(s);
  if (useMem()) { mem.set(uid, s); return s; }
  const r = await req(col() + "/" + uid, { method: "PATCH", body: JSON.stringify({ fields: toFields(s) }) });
  if (!r.ok) throw fail(502, "firestore_failed", "Firestore: HTTP " + r.status);
  cache.delete(uid);
  return s;
}

function checkUid(uid) {
  uid = String(uid || "");
  if (!UID_RE.test(uid)) throw fail(400, "bad_uid", "Некорректный UID.");
  return uid;
}

// "Допустить" / "Открыть ИИ" after payment. A running paid month is kept as it is, except that opening the AI on a
// "basic" month starts a new month on the AI plan. A trial or an ended term is replaced by a new month from today.
async function start(uid, plan, now = Date.now()) {
  uid = checkUid(uid);
  plan = plan === "ai" ? "ai" : "basic";
  const cur = await get(uid);
  if (cur && cur.until > 0 && !cur.trial && !expired(cur, now) && (cur.plan === plan || plan === "basic")) return cur;
  return put(uid, { plan, until: addMonth(now), trialUsed: cur ? cur.trialUsed : false });
}
// one more paid month: from the end of the running paid month, else from today (after a trial or an ended term)
async function extend(uid, plan, now = Date.now()) {
  uid = checkUid(uid);
  const cur = await get(uid);
  const from = cur && cur.until > now && !cur.trial ? cur.until : now;
  return put(uid, { plan: plan === "ai" || plan === "basic" ? plan : (cur ? cur.plan : "basic"), until: addMonth(from), trialUsed: cur ? cur.trialUsed : false });
}
// a free trial of 2 or 3 days, once per account
async function trial(uid, days, plan, now = Date.now()) {
  uid = checkUid(uid);
  days = Number(days);
  if (days !== 2 && days !== 3) throw fail(400, "bad_days", "Пробный период: 2 или 3 дня.");
  const cur = await get(uid);
  if (cur && cur.trialUsed) throw fail(409, "trial_used", "Пробный период этому ученику уже давали.");
  return put(uid, { plan, until: now + days * DAY, trial: true, trialUsed: true });
}
// the AI was closed by hand: the rest of the term continues on the trainer plan
async function downgrade(uid) {
  uid = checkUid(uid);
  const cur = await get(uid);
  if (cur && cur.plan === "ai") await put(uid, Object.assign({}, cur, { plan: "basic" }));
}
// no term any more (unlimited access); a used trial stays remembered
async function clear(uid) {
  uid = checkUid(uid);
  const cur = await get(uid);
  if (!cur) return null;
  return put(uid, { plan: cur.plan, until: 0, trialUsed: cur.trialUsed });
}

// every term: Map uid -> {plan, until, warned, ended, trial, trialUsed, updateTime}
async function list() {
  if (useMem()) return new Map([...mem].map(([k, v]) => [k, Object.assign({}, v)]));
  const out = new Map();
  let page = "", n = 0;
  do {
    const url = new URL(col());
    url.searchParams.set("pageSize", "300");
    if (page) url.searchParams.set("pageToken", page);
    const r = await req(url);
    if (r.status === 404) break;
    if (!r.ok) throw fail(502, "firestore_failed", "Firestore: HTTP " + r.status);
    const j = await r.json().catch(() => ({}));
    for (const d of (j.documents || [])) out.set(String(d.name || "").split("/").pop(), fromDoc(d));
    page = j.nextPageToken || "";
  } while (page && ++n < 50);
  return out;
}

// remember that a letter went out. With Firestore the write only succeeds if nobody changed the document since we
// read it, so two deployments running the same check never send the same letter twice.
async function mark(uid, sub, field) {
  if (useMem()) { const cur = mem.get(uid); if (!cur || cur[field] === sub.until) return false; mem.set(uid, Object.assign({}, cur, { [field]: sub.until })); return true; }
  const url = new URL(col() + "/" + uid);
  url.searchParams.append("updateMask.fieldPaths", field);
  if (sub.updateTime) url.searchParams.set("currentDocument.updateTime", sub.updateTime);
  const r = await req(url, { method: "PATCH", body: JSON.stringify({ fields: { [field]: { integerValue: String(sub.until) } } }) });
  if (r.status === 400 || r.status === 409 || r.status === 412) return false; // changed meanwhile: the next run decides again
  if (!r.ok) throw fail(502, "firestore_failed", "Firestore: HTTP " + r.status);
  cache.delete(uid);
  return true;
}

/* ------------------------------------------------------------------ letters */

const fmtDate = ms => { const d = new Date(ms); return String(d.getUTCDate()).padStart(2, "0") + "." + String(d.getUTCMonth() + 1).padStart(2, "0") + "." + d.getUTCFullYear(); };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function waLink() {
  const c = require("./_verify.js").contact();
  const m = c.match(/\+?\d[\d\s().\/-]{5,}\d/);
  return m ? "https://wa.me/" + m[0].replace(/\D/g, "") : "";
}

// kind: "warn" (3 days before the end of a paid month), "ended" (a paid month is over), "trial" (the trial is over).
// Russian + German in one letter.
function letter(kind, sub, name) {
  const price = PRICE[sub.plan] || 5, date = fmtDate(sub.until), wa = waLink();
  const planRu = sub.plan === "ai" ? "«Тренажёр + ИИ»" : "«Тренажёр»", planDe = sub.plan === "ai" ? "„Trainer + KI“" : "„Trainer“";
  const hiRu = "Здравствуйте" + (name ? ", " + name : "") + "!", hiDe = "Hallo" + (name ? " " + name : "") + ",";
  const payRu = "оплатите 5 € в месяц (без ИИ) или 10 € в месяц (с ИИ) и напишите администратору в WhatsApp. Пожалуйста, не звоните, только сообщение.";
  const payDe = "zahlen Sie 5 € pro Monat (ohne KI) oder 10 € pro Monat (mit KI) und schreiben Sie dem Administrator auf WhatsApp. Bitte nicht anrufen, nur eine Nachricht.";
  const T = {
    warn: {
      subject: "Подписка заканчивается " + date + " · Ihr Abo endet am " + date,
      ru: [hiRu, "Ваша подписка " + planRu + " на тренажёр DTB B2 Beruf заканчивается " + date + ".", "Чтобы продлить её ещё на месяц, оплатите " + price + " € и напишите администратору в WhatsApp. Пожалуйста, не звоните, только сообщение."],
      de: [hiDe, "Ihr Abo " + planDe + " für den Trainer DTB B2 Beruf endet am " + date + ".", "Um es um einen Monat zu verlängern, zahlen Sie " + price + " € und schreiben Sie dem Administrator auf WhatsApp. Bitte nicht anrufen, nur eine Nachricht."] },
    ended: {
      subject: "Подписка закончилась · Ihr Abo ist abgelaufen",
      ru: [hiRu, "Ваша подписка " + planRu + " на тренажёр DTB B2 Beruf закончилась " + date + ". Доступ закрыт, ваш прогресс сохранён.", "Для продления " + payRu],
      de: [hiDe, "Ihr Abo " + planDe + " für den Trainer DTB B2 Beruf ist am " + date + " abgelaufen. Der Zugang ist gesperrt, Ihr Fortschritt bleibt gespeichert.", "Zur Verlängerung " + payDe] },
    trial: {
      subject: "Пробный период закончился · Ihre Testphase ist vorbei",
      ru: [hiRu, "Пробный период тренажёра DTB B2 Beruf закончился. Доступ закрыт, ваш прогресс сохранён.", "Чтобы продолжить, " + payRu],
      de: [hiDe, "Ihre Testphase für den Trainer DTB B2 Beruf ist vorbei. Der Zugang ist gesperrt, Ihr Fortschritt bleibt gespeichert.", "Um weiterzumachen, " + payDe] },
  }[kind];
  const tail = wa ? "\n\nWhatsApp: " + wa : "";
  const text = T.ru.join("\n\n") + tail + "\n\n———\n\n" + T.de.join("\n\n") + tail + "\n";
  const para = lines => lines.map(l => "<p>" + esc(l) + "</p>").join("") + (wa ? '<p><a href="' + esc(wa) + '">WhatsApp</a></p>' : "");
  const html = '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1f2937">' + para(T.ru) + '<hr style="border:0;border-top:1px solid #ddd;margin:20px 0">' + para(T.de) + "</div>";
  return { subject: T.subject, text, html };
}

// e-mail through Resend (https://resend.com): RESEND_API_KEY + MAIL_FROM in the Vercel settings. Tests replace `mailer`.
const mailer = {
  ready: () => !!process.env.RESEND_API_KEY && !!process.env.MAIL_FROM,
  async send(to, m) {
    const r = await fetch("https://api.resend.com/emails", { method: "POST",
      headers: { authorization: "Bearer " + process.env.RESEND_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], subject: m.subject, text: m.text, html: m.html }) });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw fail(502, "mail_failed", "Resend: " + (j.message || "HTTP " + r.status)); }
  },
};

// the daily check: each letter once per term
async function runDaily(now = Date.now()) {
  const res = { checked: 0, warned: 0, ended: 0, noEmail: 0, failed: 0, mail: mailer.ready() ? "on" : "off" };
  if (!mailer.ready()) return res; // nothing is marked, so the letters still go out once the key is set
  const subs = await list();
  res.checked = subs.size;
  if (!subs.size) return res;
  const { users } = await admin.loadUsers();
  const byUid = new Map(users.map(u => [u.uid, (u.data && u.data.cand) || {}]));
  for (const [uid, sub] of subs) {
    if (!(sub.until > 0)) continue;
    let field = "";
    if (expired(sub, now)) { if (sub.ended !== sub.until) field = "ended"; }
    else if (!sub.trial && sub.until - now <= WARN_DAYS * DAY && sub.warned !== sub.until) field = "warned";
    if (!field) continue;
    const c = byUid.get(uid) || {};
    const email = String(c.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /@dtb-trainer\.app$/.test(email)) { res.noEmail++; continue; }
    if (!(await mark(uid, sub, field))) continue;
    const kind = field === "warned" ? "warn" : sub.trial ? "trial" : "ended";
    try { await mailer.send(email, letter(kind, sub, String(c.vor || "").trim())); res[field]++; }
    catch { res.failed++; }
  }
  return res;
}

module.exports = { PRICE, DAY, addMonth, expired, daysLeft, get, start, extend, trial, downgrade, clear, list, mark, letter, mailer, runDaily, _mem: mem };
