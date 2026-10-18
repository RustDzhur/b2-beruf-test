// Shared AI proxy for the letter checker. Used by server.js (local) and api/ai.js + api/status.js (Vercel functions).
// The key is read ONLY from the environment (OPENAI_API_KEY, or ANTHROPIC_API_KEY as a fallback); it is never sent to the browser.
const OPENAI_KEY = process.env.OPENAI_API_KEY, ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5-5";
const ready = () => !!(OPENAI_KEY || ANTHROPIC_KEY);

// best-effort limits so a public page cannot burn the whole budget: size, token cap, per-IP rate (per instance)
const MAX_CHARS = 40000, MAX_OUT = 3500, WINDOW = 10 * 60 * 1000, MAX_REQ = 30;
const hits = new Map();
function limited(ip) {
  const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < WINDOW);
  a.push(now); hits.set(ip, a);
  if (hits.size > 5000) hits.clear();
  return a.length > MAX_REQ;
}

async function ask(messages) {
  if (OPENAI_KEY) {
    const r = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + OPENAI_KEY },
      body: JSON.stringify({ model: OPENAI_MODEL, messages, max_completion_tokens: MAX_OUT }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw { status: r.status, code: r.status === 429 ? "rate_limited" : (j.error && j.error.code) || "error", message: j.error && j.error.message };
    return ((j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "");
  }
  const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST",
    headers: { "content-type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: MAX_OUT, messages }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw { status: r.status, code: r.status === 429 ? "rate_limited" : (j.error && j.error.type) || "error", message: j.error && j.error.message };
  return (j.content || []).filter(b => b.type === "text").map(b => b.text).join("");
}

// returns [httpStatus, jsonBody]
async function handle(body, ip, sameOrigin) {
  if (!ready()) return [503, { code: "not_granted", message: "no API key configured" }];
  if (!sameOrigin) return [403, { code: "error", message: "forbidden origin" }];
  if (limited(ip)) return [429, { code: "rate_limited", message: "too many requests" }];
  let messages;
  try { messages = (typeof body === "string" ? JSON.parse(body) : body).messages; } catch { return [400, { code: "error", message: "bad json" }]; }
  if (!Array.isArray(messages) || !messages.length || messages.some(m => !m || !["user", "assistant"].includes(m.role) || typeof m.content !== "string")) return [400, { code: "error", message: "bad messages" }];
  if (messages.reduce((n, m) => n + m.content.length, 0) > MAX_CHARS) return [413, { code: "error", message: "too large" }];
  try { return [200, { text: await ask(messages) }]; }
  catch (e) { return [e.status || 502, { code: e.code || "error", message: String(e.message || e) }]; }
}
// same-origin check from request headers: Origin (or Referer) host must equal Host
function sameOrigin(h) {
  const o = h.origin || h.referer; if (!o) return true;
  try { return new URL(o).host === h.host; } catch { return false; }
}
module.exports = { ready, handle, sameOrigin, provider: () => OPENAI_KEY ? "openai (" + OPENAI_MODEL + ")" : ANTHROPIC_KEY ? "claude (" + CLAUDE_MODEL + ")" : "" };
