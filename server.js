// Tiny static server without dependencies: `node server.js` (or `npm start`) → http://localhost:5173
const http = require("http"), fs = require("fs"), path = require("path"), { exec, execFile } = require("child_process"), os = require("os"), crypto = require("crypto");
const ROOT = __dirname, PORT = +process.env.PORT || 5173;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".mp3": "audio/mpeg" };
const ai = require("./api/_ai.js");
const json = (res, code, o) => { res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" }); res.end(JSON.stringify(o)); };
async function aiRoute(req, res) {
  let body = ""; for await (const c of req) { body += c; if (body.length > 2e6) return json(res, 413, { code: "error", message: "too large" }); }
  const [code, out] = await ai.handle(body, req.socket.remoteAddress || "local", ai.sameOrigin(req.headers));
  json(res, code, out);
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
  if (req.url === "/api/status") return json(res, 200, { ready: ai.ready() });
  if (req.url === "/api/ai" && req.method === "POST") return aiRoute(req, res);
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
  console.log(ai.ready() ? `Briefprüfung durch KI: AN (${ai.provider()})` : "Briefprüfung durch KI: AUS (OPENAI_API_KEY nicht gesetzt)");
  if (!process.env.NO_OPEN) exec((process.platform === "darwin" ? "open " : process.platform === "win32" ? "start " : "xdg-open ") + url);
});
