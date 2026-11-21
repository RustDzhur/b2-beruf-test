// Vercel function: POST /api/admin/delete {uids:[...]} -> the teacher removes students (progress, approval, account).
// The response carries a backup of the deleted progress documents; the cabinet saves it as a JSON file.
const admin = require("../_admin.js");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const headers = req.headers || {};
  if (req.method !== "POST") { res.statusCode = 405; return res.end(JSON.stringify({ code: "method", message: "POST only" })); }
  if (!admin.sameOrigin(headers)) { res.statusCode = 403; return res.end(JSON.stringify({ code: "origin", message: "forbidden origin" })); }
  if (!admin.verifySession(headers.cookie)) { res.statusCode = 401; return res.end(JSON.stringify({ code: "unauthorized", message: "Войдите в кабинет." })); }
  try {
    const out = await admin.deleteUsers(admin.bodyOf(req.body).uids);
    res.statusCode = 200;
    res.end(JSON.stringify(Object.assign({ ok: true }, out)));
  } catch (e) {
    res.statusCode = e.status || 500;
    res.end(JSON.stringify({ code: e.code || "error", message: e.message || "Не удалось удалить." }));
  }
};
