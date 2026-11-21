// Vercel function: GET /api/access (Authorization: Bearer <Firebase ID token>) -> {verified, contact}.
// The trainer opens only for students the teacher has approved in /admin.
const verify = require("./_verify.js");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const [code, out] = await verify.access(req.headers && req.headers.authorization);
  res.statusCode = code;
  res.end(JSON.stringify(out));
};
