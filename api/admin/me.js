// Vercel function: GET /api/admin/me -> is this browser signed in, and is the storage configured?
const admin = require("../_admin.js");

module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const ok = admin.verifySession(req.headers && req.headers.cookie);
  let storage = false, fixtures = false;
  try { storage = !!admin.serviceAccount(); } catch { storage = false; }
  try { fixtures = !!admin.fixtureUsers(); } catch { fixtures = false; }
  res.statusCode = 200;
  res.end(JSON.stringify({
    ok,
    configured: !!admin.adminPassword(),
    storage,
    fixtures,
  }));
};
