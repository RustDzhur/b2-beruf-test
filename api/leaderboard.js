// Public leaderboard: first name + surname initial only. No auth, no UIDs in the response.
// Query: ?period=week|all&uid=<firestore uid> (uid is only used to return "my place").
const admin = require("./_admin.js");

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ code: "method", message: "GET only" }));
  }
  const q = new URL(req.url, "https://x").searchParams;
  const period = q.get("period") === "all" ? "all" : "week";
  const uid = String(q.get("uid") || "").slice(0, 128);
  try {
    const data = await admin.buildLeaderboard(period, uid);
    res.statusCode = 200;
    res.end(JSON.stringify(data));
  } catch (e) {
    res.statusCode = e.status || 500;
    res.end(JSON.stringify({ code: e.code || "error", message: e.message || "Рейтинг временно недоступен." }));
  }
};
