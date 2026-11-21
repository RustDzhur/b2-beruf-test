// Admission to the trainer (separate from the paid AI access in _verify.js / Firestore `verified`).
// Accounts created before ADMIT_BEFORE (the switch to e-mail sign-up) are admitted automatically.
// Newer accounts need the teacher's "Допустить" in /admin, stored as Firestore `admitted/{uid}`.
const admin = require("./_admin.js");

const CUTOFF = Date.parse(process.env.ADMIT_BEFORE || "2026-11-21T17:30:00Z");
const UID_RE = /^[A-Za-z0-9_-]{6,128}$/;
const fail = (status, code, message) => Object.assign(new Error(message), { status, code });
const mem = new Set(); // local preview / tests (fixtures): every fixture user counts as an old account
const memNew = new Set(); // tests: uids that count as new accounts
const cache = new Map();
const useMem = () => { try { return !admin.serviceAccount() && !!admin.fixtureUsers(); } catch { return false; } };
const isOld = createdAt => Number.isFinite(+createdAt) && +createdAt > 0 && +createdAt < CUTOFF;

function sa() {
  const s = admin.serviceAccount();
  if (!s) throw fail(501, "no_service_account", "Не настроен ключ Firebase.");
  return s;
}
const col = () => "https://firestore.googleapis.com/v1/projects/" + encodeURIComponent(sa().project_id) + "/databases/(default)/documents/admitted";
async function get(url, opt) {
  try { return await fetch(url, Object.assign({}, opt, { headers: Object.assign({ authorization: "Bearer " + await admin.accessToken(), "content-type": "application/json" }, (opt && opt.headers) || {}) })); }
  catch (e) { if (e && e.code) throw e; throw fail(502, "firestore_unreachable", "Нет связи с Firestore."); }
}

async function hasDoc(uid) {
  if (useMem()) return mem.has(uid) || !memNew.has(uid);
  const hit = cache.get(uid);
  if (hit && hit.exp > Date.now()) return hit.v;
  const r = await get(col() + "/" + uid);
  if (r.status !== 200 && r.status !== 404) throw fail(502, "verify_unavailable", "Firestore: HTTP " + r.status);
  const v = r.status === 200;
  if (cache.size > 5000) cache.clear();
  cache.set(uid, { v, exp: Date.now() + 60000 });
  return v;
}

// a signed-in student (createdAt from the token lookup)
async function isAdmitted(uid, createdAt) {
  if (!UID_RE.test(String(uid || ""))) return false;
  if (isOld(createdAt)) return true;
  return hasDoc(uid);
}

async function setAdmitted(uid, on) {
  uid = String(uid || "");
  if (!UID_RE.test(uid)) throw fail(400, "bad_uid", "Некорректный UID.");
  if (useMem()) { if (on) { mem.add(uid); memNew.delete(uid); } else { mem.delete(uid); memNew.add(uid); } return; }
  const r = on
    ? await get(col() + "/" + uid + "?updateMask.fieldPaths=at", { method: "PATCH", body: JSON.stringify({ fields: { at: { integerValue: String(Date.now()) } } }) })
    : await get(col() + "/" + uid, { method: "DELETE" });
  if (!r.ok && !(r.status === 404 && !on)) throw fail(502, "firestore_failed", "Firestore: HTTP " + r.status);
  cache.delete(uid);
}

// every admitted uid: old accounts (by Firebase Auth creation time) + `admitted` docs. Returns a Set.
async function listAdmitted() {
  if (useMem()) {
    const users = admin.fixtureUsers() || [];
    return new Set(users.map(u => u.uid).filter(u => !memNew.has(u) || mem.has(u)));
  }
  const out = new Set();
  let page = "", n = 0;
  do { // Auth accounts with their creation time
    const url = new URL("https://identitytoolkit.googleapis.com/v1/projects/" + encodeURIComponent(sa().project_id) + "/accounts:batchGet");
    url.searchParams.set("maxResults", "1000");
    if (page) url.searchParams.set("nextPageToken", page);
    const r = await get(url);
    if (!r.ok) throw fail(502, "auth_failed", "Firebase Auth: HTTP " + r.status);
    const j = await r.json().catch(() => ({}));
    for (const u of (j.users || [])) if (isOld(u.createdAt)) out.add(u.localId);
    page = j.nextPageToken || "";
  } while (page && ++n < 50);
  page = ""; n = 0;
  do {
    const url = new URL(col());
    url.searchParams.set("pageSize", "300");
    if (page) url.searchParams.set("pageToken", page);
    const r = await get(url);
    if (r.status === 404) break;
    if (!r.ok) throw fail(502, "firestore_failed", "Firestore: HTTP " + r.status);
    const j = await r.json().catch(() => ({}));
    for (const d of (j.documents || [])) out.add(String(d.name || "").split("/").pop());
    page = j.nextPageToken || "";
  } while (page && ++n < 50);
  return out;
}

module.exports = { CUTOFF, isOld, isAdmitted, setAdmitted, listAdmitted, _mem: mem, _memNew: memNew };
