// One handler for the teacher and group API, shared by server.js (local) and the single Vercel function api/router.js.
// handle({method, path, headers, body, ip}) -> {status, json, headers}
const admin = require("./_admin.js");
const verify = require("./_verify.js");
const groups = require("./_groups.js");
const subs = require("./_subs.js");
const crypto = require("crypto");

const out = (status, json, headers) => ({ status, json, headers: headers || {} });
// only the main administrator changes anything; a group teacher just looks at the progress of the own group
const superOnly = role => { need(role); if (role !== "super") throw Object.assign(new Error("Это может только главный администратор."), { status: 403, code: "forbidden" }); return role; };
const need = role => { if (!role) throw Object.assign(new Error("Войдите в кабинет."), { status: 401, code: "unauthorized" }); return role; };

async function route({ method, path, headers, body, ip }) {
  headers = headers || {};
  if (path === "/api/access") { const [c, o] = await verify.access(headers.authorization); return out(c, o); }
  if (path === "/api/groups" && method === "GET") return out(200, { groups: await groups.openGroups() }); // public list for the sign-up form
  if (path === "/api/group-request" && method === "POST") { // a signed-in organizer asks for a group
    const m = /^Bearer\s+(\S{20,4096})$/.exec(String(headers.authorization || ""));
    const uid = m ? await verify._hooks.lookupUid(m[1]) : null;
    if (!uid) return out(401, { code: "unauthorized", message: "Войдите в аккаунт." });
    const bb = admin.bodyOf(body);
    const g = await groups.requestGroup(uid, bb.email, bb.name);
    return out(200, { ok: true, group: { code: g.code, name: g.name, status: g.status } });
  }
  if (path === "/api/link-email" && method === "POST") { // old account signed in by name: attach the real e-mail
    const m = /^Bearer\s+(\S{20,4096})$/.exec(String(headers.authorization || ""));
    const uid = m ? await verify._hooks.lookupUid(m[1]) : null;
    if (!uid) return out(401, { code: "unauthorized", message: "Войдите в аккаунт." });
    return out(200, await admin.linkEmail(uid, verify.emails.get(uid), admin.bodyOf(body).email));
  }
  if (path.startsWith("/api/pay/")) { // PayPal: the student pays from the site, the server checks it and opens access
    const pay = require("./_pay.js");
    if (path === "/api/pay/config" && method === "GET") return out(200, pay.config());
    if (path === "/api/pay/webhook" && method === "POST") return out(200, await pay.webhook(headers, body));
    const m = /^Bearer\s+(\S{20,4096})$/.exec(String(headers.authorization || ""));
    const uid = m ? await verify._hooks.lookupUid(m[1]) : null;
    if (!uid) return out(401, { code: "unauthorized", message: "Войдите в аккаунт." });
    const bb = admin.bodyOf(body);
    if (path === "/api/pay/create" && method === "POST") return out(200, await pay.createOrder(uid, bb.plan));
    if (path === "/api/pay/capture" && method === "POST") return out(200, await pay.captureOrder(uid, bb.orderId));
    return out(404, { code: "not_found", message: "Неизвестный метод API." });
  }
  if (path === "/api/cron/subs") { // Vercel Cron, once a day: reminders and "subscription ended" letters
    const secret = String(process.env.CRON_SECRET || "");
    if (!secret) return out(501, { code: "no_cron_secret", message: "CRON_SECRET is not set." });
    const a = Buffer.from(String(headers.authorization || "")), e = Buffer.from("Bearer " + secret);
    if (a.length !== e.length || !crypto.timingSafeEqual(a, e)) return out(401, { code: "unauthorized" });
    return out(200, Object.assign({ ok: true }, await subs.runDaily()));
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
    superOnly(role);
    await verify.setVerified(b.uid, !!b.verified);
    if (b.verified) await subs.start(b.uid, "ai"); else await subs.downgrade(b.uid); // payment for the AI plan starts a month
    return out(200, { ok: true, uid: String(b.uid), verified: !!b.verified, sub: await subs.get(b.uid) });
  }
  if (path === "/api/admin/admit" && method === "POST") { // admission to the trainer (not the AI)
    superOnly(role);
    await require("./_admit.js").setAdmitted(b.uid, !!b.admitted);
    const sub = b.admitted ? await subs.start(b.uid, "basic") : null; // payment confirmed: one month starts now
    return out(200, { ok: true, uid: String(b.uid), admitted: !!b.admitted, sub });
  }
  if (path === "/api/admin/delete" && method === "POST") {
    superOnly(role);
    const uids = Array.isArray(b.uids) ? b.uids : [];
    return out(200, Object.assign({ ok: true }, await admin.deleteUsers(uids)));
  }
  if (path === "/api/admin/link-email" && method === "POST") { // main administrator attaches an e-mail to a student's account
    superOnly(role);
    if (!require("./_verify.js").UID_RE.test(String(b.uid || ""))) return out(400, { code: "bad_uid", message: "Некорректный UID." });
    return out(200, await admin.linkEmail(String(b.uid), "", b.email, true, b.password));
  }
  if (path === "/api/admin/sub" && method === "POST") { // paid month, trial or unlimited, set by the main administrator
    superOnly(role);
    const plan = b.plan === "ai" ? "ai" : "basic";
    let sub;
    if (b.action === "month") sub = await subs.extend(b.uid, plan);
    else if (b.action === "trial") sub = await subs.trial(b.uid, b.days, plan);
    else if (b.action === "unlimited") return out(200, { ok: true, sub: await subs.clear(b.uid) });
    else return out(400, { code: "bad_action", message: "Неизвестное действие." });
    await require("./_admit.js").setAdmitted(b.uid, true);
    await verify.setVerified(b.uid, plan === "ai");
    return out(200, { ok: true, sub });
  }
  if (path === "/api/admin/move" && method === "POST") { // move students to another group
    superOnly(role);
    const uids = (Array.isArray(b.uids) ? b.uids : []).map(String).slice(0, 500);
    const g = await groups.moveUsers(uids, b.group);
    admin.resetLeaderboardCache && admin.resetLeaderboardCache();
    return out(200, { ok: true, moved: uids, group: { code: g.code, name: g.name } });
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
      if (b.status === "ok" && g.owner) await require("./_admit.js").setAdmitted(g.owner, true); // the organizer may use the trainer too (the AI stays closed)
      return out(200, { ok: true, group: groups.publicGroup(g) });
    }
  }
  return out(404, { code: "not_found", message: "Неизвестный метод API." });
}

async function handle(req) {
  try { return await route(req); }
  catch (e) { return out(e.status || 500, { code: e.code || "error", message: e.message || "Ошибка сервера." }); }
}

// Real API path of a Vercel request. vercel.json rewrites /api/admin/*, /api/groups, /api/group-request and /api/access
// to the single function api/router.js with ?__p=<rest>, because the Hobby plan allows at most 12 functions.
function vercelPath(rawUrl) {
  const u = new URL("http://x" + (String(rawUrl || "/").startsWith("/") ? rawUrl : "/" + rawUrl));
  const p = u.searchParams.get("__p");
  u.searchParams.delete("__p");
  const path = p != null && /^\/api\/router\/?$/.test(u.pathname) ? "/api/" + p.replace(/^\/+/, "") : u.pathname;
  const q = u.searchParams.toString();
  return { path, url: path + (q ? "?" + q : "") };
}

// Vercel function wrapper (api/router.js serves every routed path)
async function vercel(req, res) {
  const { path, url } = vercelPath(req.url);
  const h = Object.assign({}, req.headers || {}, { "x-url": url });
  const r = await handle({ method: req.method, path, headers: h, body: req.body,
    ip: admin.clientIp(req.headers || {}, req.socket && req.socket.remoteAddress) });
  res.statusCode = r.status;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  for (const [k, v] of Object.entries(r.headers)) res.setHeader(k, v);
  res.end(JSON.stringify(r.json));
}

module.exports = { handle, vercel, vercelPath };
