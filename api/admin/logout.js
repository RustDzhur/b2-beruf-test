// Vercel function: POST /api/admin/logout -> clears the session cookie.
const admin = require("../_admin.js");

module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "POST") { res.statusCode = 405; return res.end(JSON.stringify({ code: "method", message: "POST only" })); }
  res.setHeader("Set-Cookie", admin.clearCookie(admin.isSecure(req.headers)));
  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true }));
};
