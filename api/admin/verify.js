// Vercel function: POST /api/admin/verify {uid, verified} -> the teacher grants or withdraws a student's access to the AI (requires session).
const admin = require("../_admin.js");
const verify = require("../_verify.js");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const headers = req.headers || {};
  if (req.method !== "POST") { res.statusCode = 405; return res.end(JSON.stringify({ code: "method", message: "POST only" })); }
  if (!admin.sameOrigin(headers)) { res.statusCode = 403; return res.end(JSON.stringify({ code: "origin", message: "forbidden origin" })); }
  if (!admin.verifySession(headers.cookie)) { res.statusCode = 401; return res.end(JSON.stringify({ code: "unauthorized", message: "Войдите в кабинет." })); }
  try {
    const b = admin.bodyOf(req.body);
    await verify.setVerified(b.uid, !!b.verified);
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, uid: String(b.uid), verified: !!b.verified }));
  } catch (e) {
    res.statusCode = e.status || 500;
    res.end(JSON.stringify({ code: e.code || "error", message: e.message || "Не удалось сохранить." }));
  }
};
