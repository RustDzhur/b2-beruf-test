
/* ---------- optional cloud sync of progress (Firebase Auth + Firestore over REST, no SDK, no own server) ----------
   Called from: e_main.js (viewProfile submit -> cloudConnect, boot -> cloudBoot, updateWho -> cloudOn) and build_web.py (concat before e_main.js).
   Reads/writes: localStorage keys dtb.{res,wrong,nstat,days,drafts,feedback,cand,log} + dtb.cloud (session), dtb.syncts; Firestore doc users/{uid} = {data: JSON string, updated: ms}.
   The web apiKey is public by design; access is protected by Firestore rules (uid == doc id). Without a password everything stays local. */
const FB = { key: "AIzaSyA5_PmCPlHg-9P1OD9LQFHXXF4Svj6Vajo", project: "prufung-6e9b1" };
const SYNC_KEYS = ["res", "wrong", "nstat", "days", "drafts", "feedback", "cand", "log"];
const cloud = { s: store.get("cloud", null), timer: null, state: "" };
const cloudOn = () => !!cloud.s;

async function fbApi(url, opt) {
  const r = await fetch(url, opt);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const m = (j.error && j.error.message) || ("HTTP " + r.status); throw Object.assign(new Error(m), { msg: m, status: r.status }); }
  return j;
}
const fbAuth = (op, email, password) => fbApi(`https://identitytoolkit.googleapis.com/v1/accounts:${op}?key=${FB.key}`,
  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true }) });

async function fbToken() {
  const s = cloud.s; if (!s) throw new Error("no session");
  if (cloud.id && cloud.exp > Date.now() + 60000) return cloud.id;
  const j = await fbApi(`https://securetoken.googleapis.com/v1/token?key=${FB.key}`,
    { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(s.refresh)}` });
  cloud.id = j.id_token; cloud.exp = Date.now() + (+j.expires_in || 3600) * 1000;
  if (j.refresh_token && j.refresh_token !== s.refresh) { s.refresh = j.refresh_token; store.set("cloud", s); }
  return cloud.id;
}
const docUrl = () => `https://firestore.googleapis.com/v1/projects/${FB.project}/databases/(default)/documents/users/${cloud.s.uid}`;

// one stable account per person: the same name, birth date and password open the same progress on any device
async function fbMail(c) {
  const id = [c.fam, c.vor, c.geb || ""].map(x => String(x || "").trim().toLowerCase().replace(/\s+/g, " ")).join("|");
  let hex = "";
  try { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("dtb|" + id)); hex = [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("").slice(0, 32); }
  catch { let a = 5381, b = 52711; for (const ch of id) { a = ((a * 33) ^ ch.charCodeAt(0)) >>> 0; b = ((b * 31) + ch.charCodeAt(0)) >>> 0; } hex = a.toString(16) + b.toString(16); }
  return `u${hex}@dtb-trainer.app`;
}

const localSnap = () => { const o = {}; SYNC_KEYS.forEach(k => { const v = store.get(k, null); if (v != null) o[k] = v; }); return o; };
function mergeCloud(cd, cupd) {
  const lt = store.get("syncts", 0);
  const pickCloud = cupd >= lt;
  Object.keys(cd).forEach(k => {
    if (!SYNC_KEYS.includes(k)) return;
    const loc = store.get(k, null);
    if (loc == null) { store.set(k, cd[k]); return; }
    if (k === "days") store.set(k, [...new Set([...(loc || []), ...(cd[k] || [])])].sort().slice(-400));
    else if (k === "res") { const m = { ...loc }; Object.entries(cd[k] || {}).forEach(([v, o]) => { if (!m[v] || (o.ts || 0) > (m[v].ts || 0)) m[v] = o; }); store.set(k, m); }
    else if (k === "log") {
      const byKey = new Map();
      [...(Array.isArray(loc) ? loc : []), ...(Array.isArray(cd[k]) ? cd[k] : [])].forEach(x => { if (x && x.t) byKey.set(x.t + "|" + x.vid, x); });
      store.set(k, [...byKey.values()].sort((a, b) => a.t - b.t).slice(-2000));
    }
    else if (pickCloud) store.set(k, cd[k]);
  });
}
async function cloudPull() {
  const t = await fbToken();
  let j;
  try { j = await fbApi(docUrl(), { headers: { Authorization: "Bearer " + t } }); }
  catch (e) { if (e.status === 404) return; throw e; }
  const f = j.fields || {};
  if (f.data && f.data.stringValue) mergeCloud(JSON.parse(f.data.stringValue), +((f.updated || {}).integerValue || 0));
}
async function cloudPush() {
  if (!cloud.s) return;
  const t = await fbToken();
  const now = Date.now();
  await fbApi(`${docUrl()}?updateMask.fieldPaths=data&updateMask.fieldPaths=updated`, { method: "PATCH",
    headers: { Authorization: "Bearer " + t, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { data: { stringValue: JSON.stringify(localSnap()) }, updated: { integerValue: String(now) } } }) });
  store.set("syncts", now);
}
function cloudSoon() {
  clearTimeout(cloud.timer);
  cloud.timer = setTimeout(() => { cloudPush().then(() => { cloud.state = "ok"; }).catch(() => { cloud.state = "err"; }); }, 2500);
}
store.onSet = (k) => { if (cloud.s && SYNC_KEYS.includes(k)) { store.set("syncts", Date.now() - 1); cloudSoon(); } };

// sign in (or create the account on first use), then merge cloud progress with this device and upload the result
async function cloudConnect(c, password) {
  const email = await fbMail(c);
  let a;
  try { a = await fbAuth("signInWithPassword", email, password); }
  catch (e) {
    if (!/EMAIL_NOT_FOUND|INVALID_LOGIN_CREDENTIALS|USER_NOT_FOUND/.test(e.msg)) throw e;
    try { a = await fbAuth("signUp", email, password); }
    catch (e2) { if (/EMAIL_EXISTS/.test(e2.msg)) throw Object.assign(new Error("PW"), { msg: "PW" }); throw e2; }
  }
  cloud.s = { uid: a.localId, refresh: a.refreshToken, email };
  cloud.id = a.idToken; cloud.exp = Date.now() + (+a.expiresIn || 3600) * 1000;
  store.set("cloud", cloud.s);
  await cloudPull();
  await cloudPush();
  cloud.state = "ok";
}
function cloudOff(wipe) {
  clearTimeout(cloud.timer);
  if (wipe) SYNC_KEYS.forEach(k => { try { localStorage.removeItem("dtb." + k); } catch {} });
  try { localStorage.removeItem("dtb.cloud"); localStorage.removeItem("dtb.syncts"); } catch {}
  cloud.s = null; cloud.id = null;
}
function cloudBoot(then) {
  if (!cloud.s) return;
  cloudPull().then(() => { cloud.state = "ok"; then && then(); return cloudPush(); }).catch(() => { cloud.state = "err"; });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && cloud.s) cloudPush().catch(() => {}); });
}
function cloudErrText(e) {
  if (e.msg === "PW") return "Falsches Kennwort für dieses Konto.";
  if (/WEAK_PASSWORD/.test(e.msg || "")) return "Das Kennwort ist zu kurz (mindestens 6 Zeichen).";
  if (/OPERATION_NOT_ALLOWED|CONFIGURATION_NOT_FOUND/.test(e.msg || "")) return "Anmeldung per E-Mail/Kennwort ist in Firebase noch nicht aktiviert. Die Daten bleiben vorerst nur auf diesem Gerät.";
  if (/PERMISSION_DENIED|Missing or insufficient/.test(e.msg || "")) return "Firestore-Regeln fehlen. Die Daten bleiben vorerst nur auf diesem Gerät.";
  return "Keine Verbindung zur Cloud. Die Daten bleiben vorerst nur auf diesem Gerät.";
}
