// Tiny static server without dependencies: `node server.js` (or `npm start`) → http://localhost:5173
const http = require("http"), fs = require("fs"), path = require("path"), { exec, execFile } = require("child_process"), os = require("os"), crypto = require("crypto");
const ROOT = __dirname, PORT = +process.env.PORT || 5173;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".mp3": "audio/mpeg" };
const KEY = process.env.ANTHROPIC_API_KEY, MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5-5";
const API = process.env.ANTHROPIC_API_URL || "https://api.anthropic.com/v1/messages";
const json = (res, code, o) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(o)); };
async function claude(req, res) {
  let body = ""; for await (const c of req) { body += c; if (body.length > 2e6) return json(res, 413, { code: "error", message: "too large" }); }
  try {
    const { messages } = JSON.parse(body);
    const r = await fetch(API, { method: "POST", headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: MODEL, max_tokens: 8000, messages }) });
    const j = await r.json();
    if (!r.ok) return json(res, r.status, { code: r.status === 429 ? "rate_limited" : (j.error && j.error.type) || "error", message: j.error && j.error.message });
    json(res, 200, { text: (j.content || []).filter(b => b.type === "text").map(b => b.text).join("") });
  } catch (e) { json(res, 502, { code: "error", message: String(e.message || e) }); }
}
// live neural speech for texts that are not pre-rendered (Claude's replies, voice tests): edge-tts, cached in the temp dir
const TTS_DIR = path.join(os.tmpdir(), "dtb-b2-tts"); fs.mkdirSync(TTS_DIR, { recursive: true });
const TTS_VOICE = { f: "de-DE-KatjaNeural", m: "de-DE-ConradNeural" };
function tts(req, res) {
  const q = new URL(req.url, "http://x").searchParams, t = (q.get("t") || "").slice(0, 4000), voice = TTS_VOICE[q.get("g")] || TTS_VOICE.f;
  if (!t.trim()) return json(res, 400, { code: "error", message: "no text" });
  const file = path.join(TTS_DIR, crypto.createHash("sha1").update(voice + "\u0001" + t).digest("hex") + ".mp3");
  const send = () => fs.readFile(file, (err, buf) => { if (err) return json(res, 500, { code: "error" }); res.writeHead(200, { "Content-Type": "audio/mpeg" }); res.end(buf); });
  if (fs.existsSync(file)) return send();
  execFile("python3", ["-m", "edge_tts", "--text", t, "--voice", voice, "--rate=-4%", "--write-media", file + ".part"], { timeout: 60000 }, (err) => {
    if (err) { fs.rm(file + ".part", () => {}); return json(res, 502, { code: "error", message: "edge-tts failed (python3 -m pip install edge-tts, нужен интернет)" }); }
    fs.rename(file + ".part", file, send);
  });
}
http.createServer((req, res) => {
  if (req.url.startsWith("/api/tts?")) return tts(req, res);
  if (req.url === "/api/status") return json(res, 200, { ready: !!KEY });
  if (req.url === "/api/claude" && req.method === "POST") return KEY ? claude(req, res) : json(res, 503, { code: "not_granted", message: "ANTHROPIC_API_KEY is not set" });
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const file = path.join(ROOT, path.normalize(p));
  if (!file.startsWith(ROOT) || file.includes(`${path.sep}src${path.sep}`)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(buf);
  });
}).listen(PORT, "127.0.0.1", () => {
  const url = `http://localhost:${PORT}`;
  console.log(`DTB B2 Trainer läuft: ${url}  (Stop: Ctrl+C)`);
  console.log(KEY ? `Claude-Prüfung der Briefe: AN (${MODEL})` : "Claude-Prüfung der Briefe: AUS (ANTHROPIC_API_KEY nicht gesetzt)");
  if (!process.env.NO_OPEN) exec((process.platform === "darwin" ? "open " : process.platform === "win32" ? "start " : "xdg-open ") + url);
});
