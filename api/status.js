// Vercel function: GET /api/status -> {ready}; the page shows the letter checker only when a key is configured.
const ai = require("./_ai.js");
module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store"); res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ ready: ai.ready() }));
};
