// Vercel function: POST /api/ai  {messages:[{role,content}]} -> {text}. Needs OPENAI_API_KEY in the project environment variables.
const ai = require("./_ai.js");
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.statusCode = 405; return res.end(JSON.stringify({ code: "error", message: "POST only" })); }
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "x";
  const [code, out] = await ai.handle(req.body, ip, ai.sameOrigin(req.headers));
  res.statusCode = code; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.end(JSON.stringify(out));
};
