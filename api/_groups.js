// Study groups. An organizer signs up in the trainer, names the group and gets a pending group; the main teacher
// (ADMIN_PASSWORD) approves it in /admin. Then the organizer opens /admin with the same e-mail + password and sees
// only the own group. Students pick their group from the list of approved groups when they sign up.
// Firestore `groups/{code}` = {name, owner (uid), email, status "pending"|"ok", at}. Students keep the code in cand.group;
// students without a code (signed up before groups existed) belong to the main group MAIN of the main teacher.
const crypto = require("crypto");
const admin = require("./_admin.js");

const MAIN = "MAIN";
const PUBLIC = "PUBLIC"; // open group for people who study on their own, without a teacher (one shared leaderboard)
const BUILTIN = new Set([MAIN, PUBLIC]);
const CODE_RE = /^[A-Z0-9]{3,12}$/;
const fail = (status, code, message) => Object.assign(new Error(message), { status, code });
const mem = new Map(); // local preview / tests without Firestore
let cache = { at: 0, list: null };

const normCode = c => String(c || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
const groupOf = cand => { const c = normCode(cand && cand.group); return c || MAIN; };
const useMem = () => { try { return !admin.serviceAccount(); } catch { return true; } };
const cleanName = s => String(s || "").replace(/\s+/g, " ").trim().slice(0, 60);

function newCode(taken) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (;;) {
    let c = ""; for (let i = 0; i < 6; i++) c += abc[crypto.randomInt(abc.length)];
    if (!taken.has(c) && !BUILTIN.has(c)) return c;
  }
}
function base() {
  const sa = admin.serviceAccount();
  return "https://firestore.googleapis.com/v1/projects/" + encodeURIComponent(sa.project_id) + "/databases/(default)/documents/groups";
}
const str = v => (v && v.stringValue) || "";
async function fsFetch(url, opt) {
  let r;
  try { r = await fetch(url, Object.assign({}, opt, { headers: { authorization: "Bearer " + await admin.accessToken(), "content-type": "application/json" } })); }
  catch (e) { if (e && e.code) throw e; throw fail(502, "firestore_unreachable", "Нет связи с Firestore."); }
  return r;
}

async function listGroups(fresh) {
  if (!fresh && cache.list && Date.now() - cache.at < 30000) return cache.list;
  let list = [];
  if (useMem()) list = [...mem.values()].map(g => Object.assign({}, g));
  else {
    const r = await fsFetch(base() + "?pageSize=300");
    if (r.status !== 404) {
      if (!r.ok) throw fail(502, "firestore_failed", "Firestore groups: HTTP " + r.status);
      const j = await r.json().catch(() => ({}));
      list = (j.documents || []).map(d => {
        const f = d.fields || {};
        return { code: String(d.name || "").split("/").pop(), name: str(f.name), owner: str(f.owner), email: str(f.email), status: str(f.status) || "pending", at: Number((f.at && f.at.integerValue) || 0) };
      });
    }
  }
  if (!list.some(g => g.code === PUBLIC)) list.unshift({ code: PUBLIC, name: "Общая группа", owner: "", email: "", status: "ok", at: 1 });
  if (!list.some(g => g.code === MAIN)) list.unshift({ code: MAIN, name: "Основная группа", owner: "", email: "", status: "ok", at: 0 });
  const rank = c => (c === MAIN ? 0 : c === PUBLIC ? 1 : 2);
  list.sort((a, b) => rank(a.code) - rank(b.code) || a.at - b.at);
  cache = { at: Date.now(), list };
  return list;
}

async function write(g) {
  if (useMem()) mem.set(g.code, Object.assign({}, g));
  else {
    const fields = { name: { stringValue: g.name }, owner: { stringValue: g.owner || "" }, email: { stringValue: g.email || "" },
      status: { stringValue: g.status }, at: { integerValue: String(g.at || Date.now()) } };
    const r = await fsFetch(base() + "/" + g.code, { method: "PATCH", body: JSON.stringify({ fields }) });
    if (!r.ok) throw fail(502, "firestore_failed", "Firestore groups: HTTP " + r.status);
  }
  cache = { at: 0, list: null };
}

// organizer (signed-in Firebase uid) asks for a new group; one group per organizer
async function requestGroup(uid, email, name) {
  name = cleanName(name);
  if (!name) throw fail(400, "no_name", "Укажите название группы.");
  const list = await listGroups(true);
  if (list.some(g => g.name.toLowerCase() === name.toLowerCase() && g.owner !== uid)) throw fail(409, "name_taken", "Группа с таким названием уже есть.");
  let g = list.find(x => x.owner === uid);
  if (g) { if (g.status !== "ok") { g.name = name; await write(g); } return g; }
  g = { code: newCode(new Set(list.map(x => x.code))), name, owner: uid, email: String(email || "").slice(0, 120), status: "pending", at: Date.now() };
  await write(g);
  return g;
}

// main teacher: approve / rename a group
async function updateGroup(code, { name, status }) {
  const g = (await listGroups(true)).find(x => x.code === normCode(code));
  if (!g) throw fail(404, "no_group", "Группа не найдена.");
  if (name) g.name = cleanName(name);
  if (status === "ok" || status === "pending") g.status = status;
  await write(g);
  return g;
}
async function deleteGroup(code) {
  code = normCode(code);
  if (BUILTIN.has(code)) throw fail(400, "main", "Основную и общую группу удалить нельзя.");
  if (useMem()) mem.delete(code);
  else {
    const r = await fsFetch(base() + "/" + code, { method: "DELETE" });
    if (!r.ok && r.status !== 404) throw fail(502, "firestore_failed", "Firestore groups: HTTP " + r.status);
  }
  cache = { at: 0, list: null };
}

// main teacher moves students to another group: Firestore `moves/{uid}` = {group}. It wins over cand.group,
// which the student's own app keeps writing, so a move survives the next cloud save.
const moveMem = new Map();
const movesBase = () => base().replace(/\/groups$/, "/moves");
let movesCache = { at: 0, map: null };
async function listMoves() {
  if (useMem()) return new Map(moveMem);
  if (movesCache.map && Date.now() - movesCache.at < 15000) return movesCache.map;
  const map = new Map();
  let page = "", n = 0;
  do {
    const r = await fsFetch(movesBase() + "?pageSize=300" + (page ? "&pageToken=" + encodeURIComponent(page) : ""));
    if (r.status === 404) break;
    if (!r.ok) throw fail(502, "firestore_failed", "Firestore moves: HTTP " + r.status);
    const j = await r.json().catch(() => ({}));
    for (const d of (j.documents || [])) { const g = normCode(str((d.fields || {}).group)); if (g) map.set(String(d.name || "").split("/").pop(), g); }
    page = j.nextPageToken || "";
  } while (page && ++n < 50);
  movesCache = { at: Date.now(), map };
  return map;
}
async function moveUsers(uids, code) {
  code = normCode(code);
  const g = (await listGroups(true)).find(x => x.code === code && x.status === "ok");
  if (!g) throw fail(404, "no_group", "Группа не найдена или ещё не одобрена.");
  for (const uid of uids) {
    if (!/^[A-Za-z0-9_-]{6,128}$/.test(String(uid))) throw fail(400, "bad_uid", "Некорректный UID.");
    if (useMem()) { moveMem.set(String(uid), code); continue; }
    const r = await fsFetch(movesBase() + "/" + uid, { method: "PATCH", body: JSON.stringify({ fields: { group: { stringValue: code }, at: { integerValue: String(Date.now()) } } }) });
    if (!r.ok) throw fail(502, "firestore_failed", "Firestore moves: HTTP " + r.status);
  }
  movesCache = { at: 0, map: null };
  return g;
}
// apply moves to loaded users (cand.group = moved group)
async function applyMoves(users) {
  let moves;
  try { moves = await listMoves(); } catch { return users; }
  if (!moves.size) return users;
  return users.map(u => {
    const g = moves.get(u.uid);
    if (!g) return u;
    const data = Object.assign({}, u.data, { cand: Object.assign({}, u.data && u.data.cand, { group: g }) });
    return Object.assign({}, u, { data });
  });
}

const ownedBy = async uid => (await listGroups(true)).find(g => g.owner === uid) || null;
const publicGroup = g => ({ code: g.code, name: g.name, status: g.status, email: g.email || "", owner: g.owner || "" });
const openGroups = async () => (await listGroups()).filter(g => g.status === "ok").map(g => ({ code: g.code, name: g.name }));

module.exports = { MAIN, PUBLIC, CODE_RE, normCode, groupOf, listGroups, requestGroup, updateGroup, deleteGroup, ownedBy, publicGroup, openGroups, listMoves, moveUsers, applyMoves, _mem: mem, _moveMem: moveMem };
