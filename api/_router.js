// One handler for the teacher and group API, shared by server.js (local) and the Vercel functions in api/admin/*.js, api/groups.js, api/group-request.js.
// handle({method, path, headers, body, ip}) -> {status, json, headers}
const admin = require("./_admin.js");
const verify = require("./_verify.js");
const groups = require("./_groups.js");

const out = (status, json, headers) => ({ status, json, headers: headers || {} });
const need = role => { if (!role) throw Object.assign(new Error("Войдите в кабинет."), { status: 401, code: "unauthorized" }); return role; };

async function route({ method, path, headers, body, ip }) {
  headers = headers || {};
  if (path === "/api/groups" && method === "GET") return out(200, { groups: await groups.openGroups() }); // public list for the sign-up form
  if (path === "/api/group-request" && method === "POST") { // a signed-in organizer asks for a group
    const m = /^Bearer\s+(\S{20,4096})$/.exec(String(headers.authorization || ""));
    const uid = m ? await verify._hooks.lookupUid(m[1]) : null;
    if (!uid) return out(401, { code: "unauthorized", message: "Войдите в аккаунт." });
    const bb = admin.bodyOf(body);
    const g = await groups.requestGroup(uid, bb.email, bb.name);
    return out(200, { ok: true, group: { code: g.code, name: g.name, status: g.status } });
  }
  if (!admin.sameOrigin(headers)) return out(403, { code: "origin", message: "forbidden origin" });
  const secure = admin.isSecure(headers);
  const b = admin.bodyOf(body);
  if (path === "/api/admin/login" && method === "POST") {
    if (admin.loginRateLimited(ip)) return out(429, { code: "rate_limited", message: "Слишком много попыток. Попробуйте через 10 минут." });
    const role = await admin.login(b);
    admin.clearLoginHits(ip);
    return out(200, { ok: true, role }, { "Set-Cookie": admin.sessionCookie(secure, role) });
  }
  if (path === "/api/admin/logout" && method === "POST") return out(200, { ok: true }, { "Set-Cookie": admin.clearCookie(secure) });
  const role = admin.sessionRole(headers.cookie);
  if (path === "/api/admin/me") {
    let storage = false, fixtures = false;
    try { storage = !!admin.serviceAccount(); } catch {}
    try { fixtures = !!admin.fixtureUsers(); } catch {}
    return out(200, { ok: !!role, role, configured: !!admin.adminPassword(), storage, fixtures });
  }
  if (path === "/api/admin/dashboard" && method === "GET") {
    const only = new URL("http://x" + (headers["x-url"] || "")).searchParams.get("group") || "";
    return out(200, await admin.buildDashboard(need(role), only));
  }
  if (path === "/api/admin/verify" && method === "POST") {
    await admin.assertRole([b.uid], need(role));
    await verify.setVerified(b.uid, !!b.verified);
    return out(200, { ok: true, uid: String(b.uid), verified: !!b.verified });
  }
  if (path === "/api/admin/delete" && method === "POST") {
    const uids = Array.isArray(b.uids) ? b.uids : [];
    await admin.assertRole(uids, need(role));
    return out(200, Object.assign({ ok: true }, await admin.deleteUsers(uids)));
  }
  if (path === "/api/admin/groups") {
    need(role);
    if (method === "GET") {
      const list = (await groups.listGroups(true)).map(groups.publicGroup);
      return out(200, { groups: role === "super" ? list : list.filter(g => g.code === role) });
    }
    if (method === "POST") {
      if (role !== "super") return out(403, { code: "forbidden", message: "Группами управляет главный администратор." });
      if (b.remove) { await groups.deleteGroup(b.code); return out(200, { ok: true }); }
      const g = await groups.updateGroup(b.code, { name: b.name, status: b.status });
      if (b.status === "ok" && g.owner) await verify.setVerified(g.owner, true); // the organizer may use the trainer too
      return out(200, { ok: true, group: groups.publicGroup(g) });
    }
  }
  return out(404, { code: "not_found", message: "Неизвестный метод API." });
}

async function handle(req) {
  try { return await route(req); }
  catch (e) { return out(e.status || 500, { code: e.code || "error", message: e.message || "Ошибка сервера." }); }
}

// Vercel function wrapper (the same file serves every api/admin/* path)
async function vercel(req, res) {
  const h = Object.assign({}, req.headers || {}, { "x-url": req.url });
  const r = await handle({ method: req.method, path: String(req.url || "").split("?")[0], headers: h, body: req.body,
    ip: admin.clientIp(req.headers || {}, req.socket && req.socket.remoteAddress) });
  res.statusCode = r.status;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  for (const [k, v] of Object.entries(r.headers)) res.setHeader(k, v);
  res.end(JSON.stringify(r.json));
}

module.exports = { handle, vercel };
