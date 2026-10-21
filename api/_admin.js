// Teacher cabinet backend: password session + Firestore reader + progress metrics.
// Shared by server.js (local) and the Vercel functions in api/admin/*.js.
// No npm dependencies: Node's crypto/fetch are enough for Firebase's REST APIs.
//
// Required environment (Vercel): ADMIN_PASSWORD, FIREBASE_SERVICE_ACCOUNT (JSON or base64).
// Optional: ADMIN_SECRET (cookie signing key; defaults to a hash of ADMIN_PASSWORD),
//           FIREBASE_PROJECT_ID, ADMIN_FIXTURES (local preview/tests only, ignored on Vercel).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const COOKIE = "dtb_admin";
const SESSION_MS = 8 * 3600 * 1000;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX = 8;
const DEFAULT_PROJECT = "prufung-6e9b1";
const MAX_LIST_PAGES = 20;

const SECTION_ORDER = ["lesen", "hoeren", "schreiben", "sprechen"];
const SECTION_NAME = { lesen: "Lesen", hoeren: "Hören", schreiben: "Schreiben", sprechen: "Sprechen" };

// vid prefix -> [section, human label]
const PART_META = {
  L1: ["lesen", "Lesen 1"], L2: ["lesen", "Lesen 2"], L3: ["lesen", "Lesen 3"], L4: ["lesen", "Lesen 4"],
  B: ["lesen", "Lesen 19–20"], S1: ["schreiben", "Sprachbausteine 1"], S2: ["schreiben", "Sprachbausteine 2"],
  H1: ["hoeren", "Hören 1"], H2: ["hoeren", "Hören 2"], H3: ["hoeren", "Hören 3"], H4: ["hoeren", "Hören 4"],
  N: ["hoeren", "Telefonnotiz"], F: ["schreiben", "Forumsbeitrag"],
  SP1: ["sprechen", "Sprechen 1"], SP2: ["sprechen", "Sprechen 2"], SP3: ["sprechen", "Sprechen 3"],
};

const PART_ORDER = { L1: 0, L2: 1, L3: 2, L4: 3, B: 4, H1: 5, H2: 6, H3: 7, H4: 8, N: 9, S1: 10, S2: 11, BW: 12, F: 13, SP1: 14, SP2: 15, SP3: 16 };

const ACHIEVEMENTS = [
  { id: "first", label: "Первый шаг", icon: "🚀", hint: "решить первое задание" },
  { id: "ten", label: "10 заданий", icon: "⚡", hint: "10 разных заданий" },
  { id: "fifty", label: "50 заданий", icon: "🎯", hint: "50 разных заданий" },
  { id: "hundred", label: "100 попыток", icon: "💯", hint: "100 попыток решения" },
  { id: "week", label: "7 дней подряд", icon: "🔥", hint: "неделя без пропусков" },
  { id: "month", label: "30 дней занятий", icon: "📅", hint: "30 активных дней" },
  { id: "perfect", label: "Без ошибок", icon: "✅", hint: "100% за задание" },
  { id: "ace", label: "Отличник", icon: "🏅", hint: "85%+ на 10 заданиях" },
  { id: "hoeren", label: "Hören-Profi", icon: "🎧", hint: "80%+ в Hören" },
  { id: "schreiben", label: "Schreiben-Profi", icon: "✍️", hint: "80%+ в Schreiben" },
];

/* ---------------------------------------------------------------- envelope */

function adminError(code, status, message) {
  const e = new Error(message || code);
  e.code = code;
  e.status = status || 500;
  return e;
}

function env(name) { return String(process.env[name] || ""); }
function adminPassword() { return env("ADMIN_PASSWORD"); }
function isVercel() { return !!process.env.VERCEL; }

/* -------------------------------------------------------------------- auth */

function sha256(s) { return crypto.createHash("sha256").update(String(s)).digest(); }

function passwordMatches(input) {
  const pw = adminPassword();
  if (!pw) return false;
  const a = sha256(input);
  const b = sha256(pw);
  return crypto.timingSafeEqual(a, b);
}

function sessionSecret() {
  const explicit = env("ADMIN_SECRET");
  if (explicit) return explicit;
  return crypto.createHash("sha256").update("dtb-admin|" + adminPassword()).digest("hex");
}

function signExp(exp) {
  return crypto.createHmac("sha256", sessionSecret()).update("v1|" + exp).digest("base64url");
}

function createSession(now = Date.now()) {
  const exp = now + SESSION_MS;
  return exp + "." + signExp(exp);
}

function parseCookies(header) {
  const out = {};
  String(header || "").split(";").forEach(part => {
    const i = part.indexOf("=");
    if (i < 0) return;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) { try { out[k] = decodeURIComponent(v); } catch { out[k] = v; } }
  });
  return out;
}

function verifySession(cookieHeader, now = Date.now()) {
  const raw = parseCookies(cookieHeader)[COOKIE];
  if (!raw) return false;
  const dot = raw.indexOf(".");
  if (dot < 0) return false;
  const exp = Number(raw.slice(0, dot));
  const sig = raw.slice(dot + 1);
  if (!Number.isFinite(exp) || exp < now || !sig) return false;
  const want = signExp(exp);
  const a = Buffer.from(sig);
  const b = Buffer.from(want);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sessionCookie(secure) {
  return COOKIE + "=" + createSession() + "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" + Math.floor(SESSION_MS / 1000) + (secure ? "; Secure" : "");
}

function clearCookie(secure) {
  return COOKIE + "=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0" + (secure ? "; Secure" : "");
}

const loginHits = new Map();
function loginRateLimited(ip, now = Date.now()) {
  const key = String(ip || "x");
  const arr = (loginHits.get(key) || []).filter(t => now - t < LOGIN_WINDOW_MS);
  arr.push(now);
  loginHits.set(key, arr);
  if (loginHits.size > 3000) loginHits.clear();
  return arr.length > LOGIN_MAX;
}
function clearLoginHits(ip) { loginHits.delete(String(ip || "x")); }

/* ---------------------------------------------------------- service account */

let saCache = { raw: "", value: null };

// Vercel/dashboard copy-paste often turns real line breaks into literal \n, and some tools
// wrap the key in an extra JSON string. Repair only the structural escapes, never escapes
// inside quoted values (private_key must keep its \n escapes until JSON.parse).
function repairJsonText(text) {
  let out = "", inString = false, escaped = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      out += c;
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; out += c; continue; }
    if (c === "\\" && i + 1 < text.length) {
      const n = text[i + 1];
      if (n === "n" || n === "r") { out += "\n"; i++; continue; }
      if (n === "t") { out += "\t"; i++; continue; }
      if (n === '"') { out += '"'; i++; continue; }
      if (n === "\\") { out += "\\"; i++; continue; }
    }
    out += c;
  }
  return out;
}

function parseServiceAccount(text) {
  let t = String(text || "").trim();
  if (t.startsWith('"') && t.endsWith('"') && t.slice(1, -1).trimStart().startsWith("{")) {
    t = t.slice(1, -1);
  }
  if (!t.startsWith("{")) {
    try { t = Buffer.from(t, "base64").toString("utf8").trim(); }
    catch { throw adminError("service_account_invalid", 500, "FIREBASE_SERVICE_ACCOUNT не читается как base64."); }
  }
  try { return JSON.parse(t); }
  catch {
    try { return JSON.parse(repairJsonText(t)); }
    catch { throw adminError("service_account_invalid", 500, "FIREBASE_SERVICE_ACCOUNT не читается как JSON. Скопируйте файл ключа целиком."); }
  }
}

function serviceAccount() {
  const raw = env("FIREBASE_SERVICE_ACCOUNT") || env("FIREBASE_SERVICE_ACCOUNT_B64");
  if (!raw) return null;
  if (saCache.raw === raw) return saCache.value;
  const json = parseServiceAccount(raw);
  if (!json.client_email || !json.private_key) {
    throw adminError("service_account_invalid", 500, "В ключе нет client_email/private_key.");
  }
  json.private_key = String(json.private_key).replace(/\\n/g, "\n");
  json.project_id = json.project_id || env("FIREBASE_PROJECT_ID") || DEFAULT_PROJECT;
  saCache = { raw, value: json };
  return json;
}

let tokenCache = { token: "", exp: 0 };

async function accessToken() {
  const sa = serviceAccount();
  if (!sa) throw adminError("no_service_account", 501, "Не настроен ключ Firebase.");
  if (tokenCache.token && Date.now() < tokenCache.exp - 60000) return tokenCache.token;
  const now = Math.floor(Date.now() / 1000);
  const b64 = o => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
  const unsigned = b64({ alg: "RS256", typ: "JWT" }) + "." + b64({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  });
  let signature;
  try {
    signature = crypto.sign("RSA-SHA256", Buffer.from(unsigned), sa.private_key).toString("base64url");
  } catch {
    throw adminError("service_account_invalid", 500, "Приватный ключ service account не подходит (RS256).");
  }
  const body = new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: unsigned + "." + signature });
  let r, j;
  try {
    r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
    j = await r.json().catch(() => ({}));
  } catch {
    throw adminError("google_unreachable", 502, "Нет связи с Google OAuth. Попробуйте ещё раз.");
  }
  if (!r.ok || !j.access_token) {
    throw adminError("service_account_rejected", 502, (j.error_description || j.error || "Google отклонил ключ."));
  }
  tokenCache = { token: j.access_token, exp: Date.now() + (+j.expires_in || 3600) * 1000 };
  return tokenCache.token;
}

/* --------------------------------------------------------------- firestore */

function parseRawDoc(doc) {
  const f = doc.fields || {};
  const uid = String(doc.name || "").split("/").pop();
  let snapshot = {};
  try { snapshot = JSON.parse((f.data && f.data.stringValue) || "{}"); } catch { snapshot = {}; }
  return { uid, updated: Number((f.updated && f.updated.integerValue) || 0), data: snapshot };
}

async function fetchFirestore(projectId) {
  const token = await accessToken();
  const base = "https://firestore.googleapis.com/v1/projects/" + encodeURIComponent(projectId) + "/databases/(default)/documents/users";
  const docs = [];
  let pageToken = "", pages = 0;
  do {
    const url = new URL(base);
    url.searchParams.set("pageSize", "300");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    let r, j;
    try {
      r = await fetch(url, { headers: { authorization: "Bearer " + token } });
      j = await r.json().catch(() => ({}));
    } catch {
      throw adminError("firestore_unreachable", 502, "Нет связи с Firestore.");
    }
    if (!r.ok) {
      const msg = (j.error && j.error.message) || ("HTTP " + r.status);
      throw adminError("firestore_failed", 502, "Firestore: " + msg);
    }
    for (const doc of (j.documents || [])) docs.push(parseRawDoc(doc));
    pageToken = j.nextPageToken || "";
  } while (pageToken && ++pages < MAX_LIST_PAGES);
  return docs;
}

function fixtureUsers() {
  if (isVercel()) return null;
  const file = env("ADMIN_FIXTURES");
  if (!file) return null;
  const abs = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
  const json = JSON.parse(fs.readFileSync(abs, "utf8"));
  const arr = Array.isArray(json) ? json : (json.users || []);
  return arr.map((x, i) => ({
    uid: String(x.uid || "fixture-" + i),
    updated: Number(x.updated || Date.now()),
    data: x.data || x,
  }));
}

async function loadUsers() {
  const fixtures = fixtureUsers();
  if (fixtures) return { source: "fixtures", users: fixtures };
  const sa = serviceAccount();
  if (!sa) throw adminError("no_service_account", 501, "Не настроен ключ Firebase.");
  return { source: "firestore", users: await fetchFirestore(sa.project_id) };
}

/* ------------------------------------------------------------------ metrics */

const DAY = 86400000;
const isoDay = ts => new Date(ts).toISOString().slice(0, 10);
const todayKey = () => isoDay(Date.now());
const dayStart = iso => Date.parse(iso + "T00:00:00Z");
const dayKey = n => isoDay(dayStart(todayKey()) + n * DAY);
const isDay = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const num = v => (Number.isFinite(+v) ? +v : 0);
const clampPct = v => Math.max(0, Math.min(100, v));
const mean = arr => { const a = arr.filter(v => Number.isFinite(v)); return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null; };
const round1 = v => (v == null ? null : Math.round(v * 10) / 10);

function partOf(vid) {
  const raw = String(vid || "");
  const write = raw.startsWith("w-");
  const v = write ? raw.slice(2) : raw;
  let key = null;
  if (/^F\d*$/.test(v)) key = "F";
  else {
    const m = /^(SP[123]|L[1-4]|B|S[12]|H[1-4]|N)/.exec(v);
    if (m) key = m[1];
  }
  if (!key) return { key: "?", section: "other", label: "Другое" };
  if (key === "B" && write) return { key: "BW", section: "schreiben", label: "Письмо · Beschwerde" };
  const meta = PART_META[key];
  return { key, section: meta[0], label: meta[1] };
}

function cleanName(s) {
  return String(s || "").replace(/\s+/g, " ").trim().slice(0, 60);
}

function streakOf(days) {
  const set = new Set(days);
  let longest = 0, run = 0, prev = null;
  for (const d of days) {
    if (!isDay(d)) continue;
    if (prev && dayStart(d) - dayStart(prev) === DAY) run++;
    else run = 1;
    prev = d;
    if (run > longest) longest = run;
  }
  let current = 0, cursor = todayKey();
  if (!set.has(cursor)) cursor = isoDay(dayStart(cursor) - DAY);
  while (set.has(cursor)) { current++; cursor = isoDay(dayStart(cursor) - DAY); }
  return { current, longest };
}

function lastDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(-i));
  return out;
}

function emptySection() {
  const o = {};
  for (const id of SECTION_ORDER) o[id] = { pct: null, tasks: 0, attempts: 0 };
  return o;
}

function computeStudent(raw, now = Date.now()) {
  const d = (raw && raw.data) || {};
  const cand = d.cand || {};
  const fam = cleanName(cand.fam), vor = cleanName(cand.vor);
  const name = [vor, fam].filter(Boolean).join(" ").trim();
  const initials = ((vor[0] || "") + (fam[0] || "")).toUpperCase() || "?";
  const updated = num(raw && raw.updated);
  const res = d.res && typeof d.res === "object" ? d.res : {};
  const wrong = d.wrong && typeof d.wrong === "object" ? d.wrong : {};
  const days = Array.isArray(d.days) ? [...new Set(d.days.filter(isDay))].sort() : [];
  const log = Array.isArray(d.log) ? d.log.filter(x => x && num(x.t)) : [];
  const nstat = d.nstat && typeof d.nstat === "object" ? d.nstat : {};

  const items = [];
  for (const [vid, o] of Object.entries(res)) {
    if (!o || !num(o.max)) continue;
    const part = partOf(vid);
    items.push({
      vid, part,
      cur: clampPct(num(o.last) / num(o.max) * 100),
      best: clampPct(num(o.best) / num(o.max) * 100),
      n: Math.max(1, num(o.n)),
      ts: num(o.ts),
      max: num(o.max),
    });
  }

  let answerCorrect = 0, answerTotal = 0;
  for (const v of Object.values(nstat)) {
    if (!Array.isArray(v)) continue;
    const total = Math.max(0, num(v[1]));
    if (!total) continue;
    answerTotal += total;
    answerCorrect += Math.max(0, Math.min(total, num(v[0])));
  }
  const answers = { correct: answerCorrect, total: answerTotal, pct: answerTotal ? round1(answerCorrect / answerTotal * 100) : null };

  const tasks = items.length;
  const attempts = items.reduce((a, x) => a + x.n, 0);
  const scorePct = round1(mean(items.map(x => x.cur)));
  const bestPct = round1(mean(items.map(x => x.best)));
  const successTasks = items.filter(x => x.best >= 80).length;
  const failTasks = items.filter(x => x.best < 50).length;
  const midTasks = Math.max(0, tasks - successTasks - failTasks);

  const sectionAgg = emptySection();
  const partAgg = new Map();
  for (const it of items) {
    const s = sectionAgg[it.part.section];
    if (s) {
      s.tasks++; s.attempts += it.n;
      if (!s._sum) s._sum = 0;
      s._sum += it.cur;
    }
    const p = partAgg.get(it.part.key) || { key: it.part.key, label: it.part.label, section: it.part.section, tasks: 0, attempts: 0, sum: 0 };
    p.tasks++; p.attempts += it.n; p.sum += it.cur;
    partAgg.set(it.part.key, p);
  }
  for (const id of SECTION_ORDER) {
    const s = sectionAgg[id];
    s.pct = s.tasks ? round1(s._sum / s.tasks) : null;
    delete s._sum;
  }
  const parts = [...partAgg.values()]
    .map(p => ({ key: p.key, label: p.label, section: p.section, tasks: p.tasks, attempts: p.attempts, pct: round1(p.sum / p.tasks) }))
    .sort((a, b) => (PART_ORDER[a.key] == null ? 99 : PART_ORDER[a.key]) - (PART_ORDER[b.key] == null ? 99 : PART_ORDER[b.key]));

  // activity: exact log when available, otherwise each saved result's timestamp
  const dayTests = new Map();
  if (log.length) {
    for (const x of log) {
      const day = isoDay(num(x.t));
      dayTests.set(day, (dayTests.get(day) || 0) + 1);
    }
  } else {
    for (const it of items) {
      if (!it.ts) continue;
      const day = isoDay(it.ts);
      dayTests.set(day, (dayTests.get(day) || 0) + 1);
    }
  }
  const daySet = new Set(days);
  const activity = lastDays(30).map(date => ({
    date,
    tests: dayTests.get(date) || 0,
    active: daySet.has(date) || dayTests.has(date),
  }));

  // mistakes
  const wrongArr = Object.entries(wrong).map(([key, w]) => {
    const part = partOf(w && w.vid);
    return { key, vid: String((w && w.vid) || ""), part, n: num(w && w.n), ts: num(w && w.ts) };
  }).sort((a, b) => b.ts - a.ts);
  const weakMap = new Map();
  for (const w of wrongArr) {
    const k = w.part.key;
    const cur = weakMap.get(k) || { key: k, label: w.part.label, section: w.part.section, count: 0 };
    cur.count++;
    weakMap.set(k, cur);
  }
  const weak = [...weakMap.values()];

  const st = streakOf(days);
  const trendSeq = (log.length ? log.map(x => ({ ts: num(x.t), pct: num(x.mx) ? clampPct(num(x.sc) / num(x.mx) * 100) : null }))
    : items.filter(x => x.ts).map(x => ({ ts: x.ts, pct: x.best })))
    .filter(x => x.pct != null).sort((a, b) => a.ts - b.ts).slice(-12);

  const firstTs = Math.min(
    ...[days.length ? dayStart(days[0]) : Infinity,
    ...items.filter(x => x.ts).map(x => x.ts)].filter(Number.isFinite)
  );
  const lastResultTs = Math.max(0, ...items.map(x => x.ts), ...wrongArr.map(x => x.ts));
  const lastActiveTs = Math.max(updated, lastResultTs, days.length ? dayStart(days[days.length - 1]) : 0);

  const achievements = ACHIEVEMENTS.map(a => {
    let earned = false;
    switch (a.id) {
      case "first": earned = tasks >= 1; break;
      case "ten": earned = tasks >= 10; break;
      case "fifty": earned = tasks >= 50; break;
      case "hundred": earned = attempts >= 100; break;
      case "week": earned = st.longest >= 7; break;
      case "month": earned = days.length >= 30; break;
      case "perfect": earned = items.some(x => x.best === 100); break;
      case "ace": earned = bestPct != null && bestPct >= 85 && tasks >= 10; break;
      case "hoeren": earned = (sectionAgg.hoeren.pct || 0) >= 80 && sectionAgg.hoeren.tasks >= 3; break;
      case "schreiben": earned = (sectionAgg.schreiben.pct || 0) >= 80 && sectionAgg.schreiben.tasks >= 2; break;
    }
    return { id: a.id, label: a.label, icon: a.icon, hint: a.hint, earned };
  });

  return {
    uid: String((raw && raw.uid) || ""),
    fam, vor, name: name || "Без имени", initials, hasName: !!(fam || vor),
    days: days.length,
    tasks,
    attempts,
    answers,
    scorePct,
    bestPct,
    successTasks,
    failTasks,
    midTasks,
    failures: wrongArr.length,
    firstDay: Number.isFinite(firstTs) ? isoDay(firstTs) : null,
    lastActive: lastActiveTs ? isoDay(lastActiveTs) : null,
    lastSync: updated ? isoDay(updated) : null,
    streak: st,
    sections: sectionAgg,
    parts,
    activity,
    trend: trendSeq.map(x => ({ date: isoDay(x.ts), pct: Math.round(x.pct) })),
    achievements,
    earned: achievements.filter(a => a.earned).length,
    recentWrong: wrongArr.slice(0, 6).map(w => ({ part: w.part.label, section: w.part.section, n: w.n, ts: w.ts ? isoDay(w.ts) : null })),
    weak,
  };
}

function dashboard(rawUsers, now = Date.now()) {
  const students = (rawUsers || []).map(u => computeStudent(u, now));
  const withData = students.filter(s => s.tasks > 0 || s.days > 0);
  const withScore = students.filter(s => s.scorePct != null);
  const d7 = dayKey(-6), d30 = dayKey(-29);

  const totals = {
    students: students.length,
    withData: withData.length,
    active7d: students.filter(s => s.lastActive && s.lastActive >= d7).length,
    active30d: students.filter(s => s.lastActive && s.lastActive >= d30).length,
    new7d: students.filter(s => s.firstDay && s.firstDay >= d7).length,
    days: students.reduce((a, s) => a + s.days, 0),
    tests: students.reduce((a, s) => a + s.attempts, 0),
    tasks: students.reduce((a, s) => a + s.tasks, 0),
    successTasks: students.reduce((a, s) => a + s.successTasks, 0),
    failTasks: students.reduce((a, s) => a + s.failTasks, 0),
    midTasks: students.reduce((a, s) => a + s.midTasks, 0),
    failures: students.reduce((a, s) => a + s.failures, 0),
    avgScore: round1(mean(withScore.map(s => s.scorePct))),
    avgBest: round1(mean(withScore.map(s => s.bestPct))),
    named: students.filter(s => s.hasName).length,
  };

  const sections = SECTION_ORDER.map(id => {
    const present = students.filter(s => s.sections[id] && s.sections[id].tasks > 0);
    return {
      id,
      name: SECTION_NAME[id],
      pct: round1(mean(present.map(s => s.sections[id].pct))),
      tasks: present.reduce((a, s) => a + s.sections[id].tasks, 0),
      attempts: present.reduce((a, s) => a + s.sections[id].attempts, 0),
      students: present.length,
    };
  });

  const activity = lastDays(30).map(date => {
    let tests = 0, active = 0;
    for (const s of students) {
      const day = s.activity.find(a => a.date === date);
      if (day) { tests += day.tests; if (day.active) active++; }
    }
    return { date, tests, students: active };
  });

  const bands = [
    { id: "low", label: "0–39%", min: 0, max: 40, students: 0 },
    { id: "mid", label: "40–59%", min: 40, max: 60, students: 0 },
    { id: "good", label: "60–79%", min: 60, max: 80, students: 0 },
    { id: "high", label: "80–100%", min: 80, max: 100.01, students: 0 },
  ];
  for (const s of withScore) {
    const b = bands.find(x => s.scorePct >= x.min && s.scorePct < x.max);
    if (b) b.students++;
  }

  const weakMap = new Map();
  for (const s of students) {
    for (const w of s.weak) {
      const cur = weakMap.get(w.key) || { key: w.key, label: w.label, section: w.section, count: 0, students: 0 };
      cur.count += w.count;
      cur.students++;
      weakMap.set(w.key, cur);
    }
  }
  const weak = [...weakMap.values()].sort((a, b) => b.count - a.count).slice(0, 10);

  const top = students.filter(s => s.hasName && s.scorePct != null && s.tasks >= 5)
    .sort((a, b) => b.scorePct - a.scorePct || b.attempts - a.attempts)
    .slice(0, 5)
    .map(s => ({ uid: s.uid, name: s.name, initials: s.initials, scorePct: s.scorePct, tasks: s.tasks, days: s.days }));

  return {
    generatedAt: now,
    source: "",
    totals,
    sections,
    activity,
    distribution: bands,
    weak,
    top,
    students,
  };
}

async function buildDashboard() {
  const { source, users } = await loadUsers();
  const out = dashboard(users);
  out.source = source;
  return out;
}

/* ------------------------------------------------------------- leaderboard */

function leaderboardStats(raw, period, now) {
  const d = (raw && raw.data) || {};
  const log = Array.isArray(d.log) ? d.log.filter(x => x && num(x.t)) : [];
  const res = d.res && typeof d.res === "object" ? d.res : {};
  const days = Array.isArray(d.days) ? [...new Set(d.days.filter(isDay))] : [];
  if (period === "week") {
    const cutoff = now - 7 * DAY;
    let points = 0, tests = 0, sum = 0;
    if (log.length) {
      for (const x of log) {
        if (num(x.t) < cutoff) continue;
        const mx = num(x.mx);
        if (!mx) continue;
        const p = clampPct(num(x.sc) / mx * 100);
        points += Math.round(p); tests++; sum += p;
      }
    } else {
      for (const o of Object.values(res)) {
        if (!o || num(o.ts) < cutoff || !num(o.max)) continue;
        const p = clampPct(num(o.best) / num(o.max) * 100);
        points += Math.round(p); tests++; sum += p;
      }
    }
    return { points, tests, avg: tests ? round1(sum / tests) : null, days: days.filter(d => dayStart(d) >= cutoff).length };
  }
  let points = 0;
  for (const o of Object.values(res)) {
    const mx = num(o && o.max);
    if (!mx) continue;
    points += Math.round(clampPct(num(o.best) / mx * 100));
  }
  return { points, tests: 0, avg: null, days: days.length };
}

function leaderboardRows(users, period, now) {
  const rows = [];
  for (const raw of users || []) {
    const s = computeStudent(raw, now);
    if (!s.hasName) continue;
    const st = leaderboardStats(raw, period, now);
    const tests = period === "week" ? st.tests : s.attempts;
    const avg = period === "week" ? st.avg : s.scorePct;
    const days = period === "week" ? st.days : s.days;
    if (!st.points && !tests && !days) continue;
    const name = s.vor
      ? s.vor + (s.fam ? " " + s.fam[0].toUpperCase() + "." : "")
      : (s.fam ? s.fam[0].toUpperCase() + "." : "Ученик");
    rows.push({
      uid: s.uid,
      name,
      initials: s.initials,
      points: st.points,
      tests,
      days,
      avg,
      streak: s.streak.current,
      medal: 0,
    });
  }
  rows.sort((a, b) => b.points - a.points || b.tests - a.tests || (b.avg || 0) - (a.avg || 0) || a.name.localeCompare(b.name, "ru"));
  return rows.map((r, i) => Object.assign(r, { rank: i + 1, medal: i < 3 ? i + 1 : 0 }));
}

let lbCache = { at: 0, week: null, all: null };

async function buildLeaderboard(period = "week", uid = "", now = Date.now()) {
  period = period === "all" ? "all" : "week";
  if (!lbCache.week || now - lbCache.at > 60000) {
    const { users } = await loadUsers();
    lbCache = {
      at: now,
      week: leaderboardRows(users, "week", now),
      all: leaderboardRows(users, "all", now),
    };
  }
  const rows = lbCache[period] || [];
  const pub = r => ({
    rank: r.rank, name: r.name, initials: r.initials, points: r.points,
    tests: r.tests, days: r.days, avg: r.avg, streak: r.streak, medal: r.medal,
  });
  const mine = uid ? rows.find(r => r.uid === uid) : null;
  return {
    period,
    updatedAt: lbCache.at,
    participants: rows.length,
    entries: rows.slice(0, 50).map(r => Object.assign(pub(r), { isMe: !!uid && r.uid === uid })),
    me: mine ? pub(mine) : null,
  };
}

/* --------------------------------------------------------------- http glue */

function clientIp(headers, fallback) {
  const xff = String((headers && headers["x-forwarded-for"]) || "").split(",")[0].trim();
  return xff || String(fallback || "x");
}

function sameOrigin(headers) {
  headers = headers || {};
  const origin = headers.origin || headers.referer;
  if (!origin) return true;
  let host;
  try { host = new URL(origin).host; } catch { return false; }
  const expected = String(headers["x-forwarded-host"] || headers.host || "").split(",")[0].trim();
  return !expected || host === expected;
}

function isSecure(headers) {
  headers = headers || {};
  const proto = String(headers["x-forwarded-proto"] || "").split(",")[0].trim();
  if (proto) return proto === "https";
  const host = String(headers.host || "").toLowerCase();
  return isVercel() && !/^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(host);
}

function bodyOf(body) {
  if (body && typeof body === "object") return body;
  if (typeof body === "string" && body) {
    try { const j = JSON.parse(body); return j && typeof j === "object" ? j : {}; } catch { return {}; }
  }
  return {};
}

function login(password) {
  if (!adminPassword()) {
    throw adminError("no_password", 503, "ADMIN_PASSWORD не задан на сервере.");
  }
  if (!passwordMatches(password)) {
    throw adminError("bad_password", 401, "Неверный пароль.");
  }
  return true;
}

module.exports = {
  COOKIE,
  SESSION_MS,
  ACHIEVEMENTS,
  SECTION_ORDER,
  SECTION_NAME,
  adminError,
  adminPassword,
  passwordMatches,
  createSession,
  verifySession,
  parseCookies,
  sessionCookie,
  clearCookie,
  loginRateLimited,
  clearLoginHits,
  clientIp,
  sameOrigin,
  isSecure,
  bodyOf,
  login,
  serviceAccount,
  accessToken,
  fetchFirestore,
  fixtureUsers,
  loadUsers,
  computeStudent,
  dashboard,
  buildDashboard,
  buildLeaderboard,
  leaderboardStats,
  leaderboardRows,
  partOf,
  parseServiceAccount,
  repairJsonText,
  streakOf,
  lastDays,
};
