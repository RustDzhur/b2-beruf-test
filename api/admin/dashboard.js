// Vercel function: GET /api/admin/dashboard -> all students with metrics (requires session).
const admin = require("../_admin.js");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "GET") { res.statusCode = 405; return res.end(JSON.stringify({ code: "method", message: "GET only" })); }
  if (!admin.verifySession(req.headers && req.headers.cookie)) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ code: "unauthorized", message: "Войдите в кабинет." }));
  }
  try {
    const data = await admin.buildDashboard();
    res.statusCode = 200;
    res.end(JSON.stringify(data));
  } catch (e) {
    res.statusCode = e.status || 500;
    res.end(JSON.stringify({ code: e.code || "error", message: e.message || "Не удалось загрузить данные." }));
  }
};
