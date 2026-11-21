// Manual verification of students. Only verified students may use the AI (the only feature that spends money).
// Source of truth: Firestore collection `verified`, one document per student uid (existence = verified).
// It is read and written ONLY here with the service account, so a student cannot grant it to themselves
// (the Firestore rules for the browser cover only users/{uid}).
// The browser proves who it is with its Firebase ID token (Authorization: Bearer ...), which is checked against Google.
const crypto = require("crypto");
const admin = require("./_admin.js");

const WEB_KEY = process.env.FIREBASE_WEB_API_KEY || "AIzaSyA5_PmCPlHg-9P1OD9LQFHXXF4Svj6Vajo"; // public by design (same key as in the page)
const UID_RE = /^[A-Za-z0-9_-]{6,128}$/;
const TOKEN_TTL = 5 * 60 * 1000, VERIFIED_TTL = 60 * 1000;
const tokenCache = new Map(), verifiedCache = new Map(), created = new Map(), emails = new Map(), mailOk = new Map();
// ADMIN_EMAILS (comma separated): the site owner's own accounts. With a confirmed e-mail they are always admitted,
// get the AI and may sign in to /admin as the main administrator (see _admin.js login).
const adminEmails = () => String(process.env.ADMIN_EMAILS || "").toLowerCase().split(/[\s,;]+/).filter(Boolean);
const isOwner = uid => { const e = emails.get(uid); return !!e && mailOk.get(uid) === true && adminEmails().includes(e); };
const mem = new Set(); // used only with ADMIN_FIXTURES (no Firestore), so the cabinet can be tried locally

const contact = () => String(process.env.VERIFY_CONTACT || "").slice(0, 120);
const open = () => process.env.AI_OPEN === "1"; // escape hatch for local work: everybody may use the AI
const useMem = () => { try { return !admin.serviceAccount() && !!admin.fixtureUsers(); } catch { return false; } };
const fail = (status, code, message) => Object.assign(new Error(message), { status, code });

function base() {
  const sa = admin.serviceAccount();
  if (!sa) throw fail(501, "no_service_account", "Не настроен ключ Firebase.");
  return "https://firestore.googleapis.com/v1/projects/" + encodeURIComponent(sa.project_id) + "/databases/(default)/documents/verified";
}

async function lookupUid(idToken) {
  const key = crypto.createHash("sha256").update(idToken).digest("hex");
  const hit = tokenCache.get(key);
  if (hit && hit.exp > Date.now()) return hit.uid;
  let r, j;
  try {
    r = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(WEB_KEY), {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken }) });
    j = await r.json().catch(() => ({}));
  } catch { throw fail(502, "verify_unavailable", "Нет связи с Google."); }
  if (!r.ok) {
    if (r.status === 400 || r.status === 401) return null; // expired or forged token
    throw fail(502, "verify_unavailable", "Google: HTTP " + r.status);
  }
  const uid = j.users && j.users[0] && j.users[0].localId;
  if (!uid) return null;
  if (tokenCache.size > 2000) tokenCache.clear();
  tokenCache.set(key, { uid, exp: Date.now() + TOKEN_TTL });
  emails.set(uid, String(j.users[0].email || "").toLowerCase()); // the sign-in address (old accounts: u…@dtb-trainer.app)
  mailOk.set(uid, j.users[0].emailVerified === true);
  created.set(uid, Number(j.users[0].createdAt || 0)); // account creation time: old accounts are admitted automatically
  return uid;
}

async function isVerified(uid) {
  if (!UID_RE.test(uid)) return false;
  if (useMem()) return mem.has(uid);
  const hit = verifiedCache.get(uid);
  if (hit && hit.exp > Date.now()) return hit.v;
  let r;
  try { r = await fetch(base() + "/" + uid, { headers: { authorization: "Bearer " + await admin.accessToken() } }); }
  catch (e) { if (e && e.code) throw e; throw fail(502, "verify_unavailable", "Нет связи с Firestore."); }
  if (r.status !== 200 && r.status !== 404) throw fail(502, "verify_unavailable", "Firestore: HTTP " + r.status);
  const v = r.status === 200;
  if (verifiedCache.size > 5000) verifiedCache.clear();
  verifiedCache.set(uid, { v, exp: Date.now() + VERIFIED_TTL });
  return v;
}

async function setVerified(uid, on) {
  uid = String(uid || "");
  if (!UID_RE.test(uid)) throw fail(400, "bad_uid", "Некорректный UID.");
  if (useMem()) { on ? mem.add(uid) : mem.delete(uid); return; }
  const token = await admin.accessToken();
  let r;
  try {
    r = on
      ? await fetch(base() + "/" + uid + "?updateMask.fieldPaths=at", { method: "PATCH",
        headers: { authorization: "Bearer " + token, "content-type": "application/json" },
        body: JSON.stringify({ fields: { at: { integerValue: String(Date.now()) } } }) })
      : await fetch(base() + "/" + uid, { method: "DELETE", headers: { authorization: "Bearer " + token } });
  } catch { throw fail(502, "firestore_unreachable", "Нет связи с Firestore."); }
  if (!r.ok && !(r.status === 404 && !on)) throw fail(502, "firestore_failed", "Firestore: HTTP " + r.status);
  verifiedCache.delete(uid);
}

async function listVerified() {
  if (useMem()) return new Set(mem);
  const token = await admin.accessToken();
  const out = new Set();
  let pageToken = "", pages = 0;
  do {
    const url = new URL(base());
    url.searchParams.set("pageSize", "300");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    let r, j;
    try { r = await fetch(url, { headers: { authorization: "Bearer " + token } }); j = await r.json().catch(() => ({})); }
    catch { throw fail(502, "firestore_unreachable", "Нет связи с Firestore."); }
    if (r.status === 404) break;
    if (!r.ok) throw fail(502, "firestore_failed", "Firestore: HTTP " + r.status);
    for (const d of (j.documents || [])) out.add(String(d.name || "").split("/").pop());
    pageToken = j.nextPageToken || "";
  } while (pageToken && ++pages < 50);
  return out;
}

// hooks so tests can run without Google
// sub(uid): the subscription term (see _subs.js); a Firestore hiccup must not lock everybody out, so it counts as "no term"
const impl = { lookupUid, isVerified, isAdmitted: (uid, createdAt) => require("./_admit.js").isAdmitted(uid, createdAt),
  sub: async uid => { try { return await require("./_subs.js").get(uid); } catch { return null; } } };
const isExpired = sub => require("./_subs.js").expired(sub);

// Authorization header -> {ok:true, uid} or {ok:false, status, code}
async function check(authHeader) {
  if (open()) return { ok: true, uid: "open" };
  const m = /^Bearer\s+(\S{20,4096})$/.exec(String(authHeader || ""));
  if (!m) return { ok: false, status: 403, code: "not_verified" };
  try {
    const uid = await impl.lookupUid(m[1]);
    if (!uid) return { ok: false, status: 403, code: "not_verified" };
    if (isOwner(uid)) return { ok: true, uid };
    if (!(await impl.isVerified(uid))) return { ok: false, status: 403, code: "not_verified" };
    if (isExpired(await impl.sub(uid))) return { ok: false, status: 403, code: "expired" }; // the paid month or the trial is over
    return { ok: true, uid };
  } catch (e) {
    return { ok: false, status: e.status || 503, code: e.code || "verify_unavailable" };
  }
}

// GET /api/access -> {verified: admitted to the trainer, ai: may use the paid AI, contact}
// "verified" keeps its old name for the page; it now means admission (see _admit.js), not the AI.
// PayPal.me link for the payment buttons (PAYPAL_ME, e.g. "YourName"); payments are checked by hand by the administrator
const payLink = () => {
  const n = String(process.env.PAYPAL_ME || "RustemDzhuraiev").replace(/^.*paypal\.me\//i, "").replace(/[^A-Za-z0-9_.-]/g, "").slice(0, 60);
  return n ? "https://paypal.me/" + n : "";
};
async function access(authHeader) {
  const [code, o] = await accessCheck(authHeader);
  return [code, Object.assign(o, { pay: payLink() })];
}
async function accessCheck(authHeader) {
  if (open()) return [200, { verified: true, ai: true, contact: contact() }];
  const m = /^Bearer\s+(\S{20,4096})$/.exec(String(authHeader || ""));
  if (!m) return [200, { verified: false, ai: false, contact: contact() }];
  try {
    const uid = await impl.lookupUid(m[1]);
    if (!uid) return [200, { verified: false, ai: false, contact: contact() }];
    if (isOwner(uid)) return [200, { verified: true, ai: true, owner: true, contact: contact() }];
    const admitted = await impl.isAdmitted(uid, created.get(uid));
    const sub = admitted ? await impl.sub(uid) : null;
    const term = sub && sub.until > 0 ? { until: sub.until, trial: !!sub.trial, plan: sub.plan } : null;
    if (isExpired(sub)) return [200, { verified: false, ai: false, expired: true, sub: term, contact: contact() }]; // closes by itself
    const ai = admitted ? await impl.isVerified(uid) : false;
    return [200, { verified: admitted, ai, sub: term, contact: contact() }];
  } catch (e) {
    return [e.status || 503, { code: e.code || "verify_unavailable", verified: null, contact: contact() }];
  }
}

module.exports = { emails, mailOk, adminEmails, isOwner, check, access, setVerified, listVerified, isVerified, contact, UID_RE, _hooks: impl };
