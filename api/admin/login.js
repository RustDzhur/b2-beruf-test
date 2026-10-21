// Vercel function: POST /api/admin/login {password} -> sets an HttpOnly session cookie.
const admin = require("../_admin.js");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "POST") { res.statusCode = 405; return res.end(JSON.stringify({ code: "method", message: "POST only" })); }
  const headers = req.headers || {};
  if (!admin.sameOrigin(headers)) { res.statusCode = 403; return res.end(JSON.stringify({ code: "origin", message: "forbidden origin" })); }
  const ip = admin.clientIp(headers, req.socket && req.socket.remoteAddress);
  if (admin.loginRateLimited(ip)) { res.statusCode = 429; return res.end(JSON.stringify({ code: "rate_limited", message: "Слишком много попыток. Попробуйте через 10 минут." })); }
  try {
    admin.login(admin.bodyOf(req.body).password);
    admin.clearLoginHits(ip);
    res.setHeader("Set-Cookie", admin.sessionCookie(admin.isSecure(headers)));
    res.statusCode = 200;
    return res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    res.statusCode = e.status || 500;
    return res.end(JSON.stringify({ code: e.code || "error", message: e.message || "Ошибка входа." }));
  }
};
