(() => {
"use strict";

/* ---------- utilities ---------- */
const $ = (s, r = document) => r.querySelector(s);
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "style") el.style.cssText = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat(Infinity)) if (c != null && c !== false) el.append(c.nodeType ? c : String(c));
  return el;
}
const LET = "abcdefghijklmnopqrstuvwxyz";
const today = () => new Date().toISOString().slice(0, 10);
const words = (t) => (t.trim().match(/\S+/g) || []).length;
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const norm = (s) => String(s || "").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/\s+/g, " ").trim();

const store = {
  get(k, d) { try { const v = localStorage.getItem("dtb." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("dtb." + k, JSON.stringify(v)); } catch {} }
};
function markActive() { const d = store.get("days", []); if (!d.includes(today())) { d.push(today()); store.set("days", d.slice(-400)); } }
function saveRes(vid, score, max) {
  const r = store.get("res", {});
  const o = r[vid] || { best: 0, n: 0 };
  o.last = score; o.max = max; o.n++; o.ts = Date.now(); o.best = Math.max(o.best || 0, score);
  r[vid] = o; store.set("res", r); markActive();
}
const resOf = (vid) => store.get("res", {})[vid];
function trackItems(list) { // list: [{key, n, ok, vid, sec}]
  const w = store.get("wrong", {}), ns = store.get("nstat", {});
  for (const it of list) {
    if (it.ok) delete w[it.key]; else w[it.key] = { vid: it.vid, sec: it.sec, n: it.n, ts: Date.now() };
    if (it.n) { const s = ns[it.n] || [0, 0]; s[0] += it.ok ? 1 : 0; s[1]++; ns[it.n] = s; }
  }
  store.set("wrong", w); store.set("nstat", ns); updateNav();
}

/* ---------- Claude (sample capability) ---------- */
let SAMPLE = null, sampleChecked = false;
// Local version (no claude.ai runtime): the small server in server.js forwards requests to the Claude API using ANTHROPIC_API_KEY
async function localSample() {
  try { const st = await (await fetch("/api/status")).json(); if (!st.ready) return null; } catch { return null; }
  const call = async (input, opts = {}) => {
    const messages = typeof input === "string" ? [{ role: "user", content: input }] : input;
    let r;
    try { r = await fetch("/api/claude", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages, tier: opts.modelTier || "default" }), signal: opts.signal }); }
    catch (e) { throw e && e.name === "AbortError" ? { code: "cancelled" } : { code: "network" }; }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw { code: j.code || "error", message: j.message };
    opts.onText && opts.onText({ text: j.text, delta: j.text });
    return { text: j.text };
  };
  call.json = async (input, opts = {}) => { const { text } = await call(input, opts); const m = text.match(/\{[\s\S]*\}/); try { return JSON.parse(m[0]); } catch { throw { code: "invalid_json" }; } };
  return call;
}
const sampleReady = (window.claude && window.claude.use ? window.claude.use("sample") : localSample())
  .then(s => { SAMPLE = s; sampleChecked = true; refreshAI(); return s; })
  .catch(() => { sampleChecked = true; refreshAI(); return null; });
function refreshAI() { document.querySelectorAll("[data-ai]").forEach(el => { el.hidden = !SAMPLE; }); document.querySelectorAll("[data-noai]").forEach(el => { el.hidden = !!SAMPLE || !sampleChecked; }); }
const ERR = {
  not_granted: "Вы не разрешили странице обращаться к Claude. Автоматическая проверка ответов работает и без него.",
  sampling_disabled: "Claude недоступен для этого аккаунта.",
  rate_limited: "Слишком много запросов подряд или исчерпан лимит. Попробуйте немного позже.",
  session_expired: "Сессия истекла. Войдите в claude.ai снова и обновите страницу.",
  invalid_json: "Ответ пришёл в неожиданном формате. Нажмите кнопку ещё раз.",
  refused: "Claude не ответил на этот запрос. Измените текст.",
  prompt_too_large: "Текст слишком длинный. Сократите его.",
  cancelled: "Запрос остановлен.",
  network: "Нет связи с локальным сервером. Запущен ли npm start?",
  authentication_error: "Ключ API не подходит. Проверьте ANTHROPIC_API_KEY.",
  error: "Claude вернул ошибку. Попробуйте ещё раз."
};
const errText = (e) => ERR[e && e.code] || "Не удалось связаться с Claude. Попробуйте ещё раз.";
function thinking(msg) { return h("div", { class: "thinking" }, h("span", { class: "dots" }, h("i"), h("i"), h("i")), msg || "Claude думает…"); }
async function getSample() { const s = SAMPLE || await sampleReady; if (!s) throw { code: "not_granted" }; return s; }
const LANG_NAME = { en: "English", de: "Deutsch" };
// the interface language also decides in which language Claude explains and gives feedback
function langNote(prompt) {
  const l = store.get("lang", "ru"), n = LANG_NAME[l];
  if (!n) return prompt;
  const note = `\n\n[Interface language: ${n}. Write every explanation, comment, tip, summary and error description in ${n} instead of Russian. Keep German quotes, corrections and examples in German. Role-play replies of a conversation partner or examiner stay in German.]`;
  if (typeof prompt === "string") return prompt + note;
  const c = prompt.map((m) => Object.assign({}, m));
  for (let i = c.length - 1; i >= 0; i--) if (c[i].role === "user") { c[i].content += note; break; }
  return c;
}
async function askJSON(prompt, opts = {}) { const s = await getSample(); return s.json(langNote(prompt), Object.assign({ cache: false }, opts)); }
async function askText(prompt, opts = {}) { const s = await getSample(); return s(langNote(prompt), opts); }
function aiButton(label, onClick, cls) { return h("button", { class: "btn " + (cls || "primary"), "data-ai": "", hidden: !SAMPLE, onclick: onClick }, h("span", { class: "ai" }, "AI"), label); }
const LOCAL = !(window.claude && window.claude.use);
function noAiNote(text) { return h("div", { class: "note", "data-noai": "", hidden: !!SAMPLE || !sampleChecked }, LOCAL ? "Проверка Claude выключена: не задан ключ API. Остановите сервер и запустите его так: ANTHROPIC_API_KEY=sk-ant-... npm start (ключ создаётся на console.anthropic.com). Либо делайте письма в онлайн-версии на claude.ai, там проверка работает без ключа." : text || "Проверка через Claude недоступна в этом просмотре. Откройте страницу на claude.ai и разрешите доступ к Claude, когда появится запрос."); }

/* ---------- speech: natural German voices, one voice per speaker ---------- */
const TTS = window.speechSynthesis;
let deVoices = [];
const F_VOICES = /katja|amala|seraphina|louisa|ingrid|anna|helena|petra|hedda|viktoria|sandy|marlene|vicki|elke|gisela|klarissa|maja|tanja|elisabeth|kerstin|christel|leni|sabina|shelley|grandma|flo\b|google deutsch|female|frau/i;
const M_VOICES = /conrad|killian|florian|jonas|klaus|markus|yannick|stefan|bernd|christoph|ralf|kasper|hans|martin|jan\b|reed|eddy|rocko|grandpa|male|mann|georg|lukas|felix/i;
function voiceScore(v) {
  const n = v.name; let s = 0;
  if (/natural|neural|online/i.test(n)) s += 100;
  if (/premium|enhanced|siri|verbessert/i.test(n)) s += 80;
  if (/google/i.test(n)) s += 60;
  if (F_VOICES.test(n) || M_VOICES.test(n)) s += 10;
  if (/espeak|compact|eloquence|grandma|grandpa|rocko|shelley|reed|flo\b|eddy/i.test(n)) s -= 60;
  if (/de-DE/i.test(v.lang)) s += 5;
  return s;
}
const voiceGender = (v) => M_VOICES.test(v.name) && !/female/i.test(v.name) ? "m" : F_VOICES.test(v.name) ? "f" : "?";
const isNatural = (v) => v && voiceScore(v) >= 60;
function loadVoices() { if (!TTS) return; deVoices = TTS.getVoices().filter(v => /^de(-|_|$)/i.test(v.lang)); deVoices.sort((a, b) => voiceScore(b) - voiceScore(a)); }
if (TTS) { loadVoices(); TTS.onvoiceschanged = () => { loadVoices(); document.querySelectorAll("[data-voices]").forEach(p => p._refresh && p._refresh()); }; }
const vcfg = () => store.get("voice", { f: "", m: "", rate: 1 });

const F_NAMES = /^(frau|kundin|chefin|leiterin|verkäuferin|kollegin|mitarbeiterin|sekretärin|ärztin|lehrerin|teamleiterin|erzieherin|alimi|amira|anita|barthum|ella|emilia|lena|melanie|mia|michaella|sabine|sandra|jana|anna|katia|kathrin|andrea|daniela|barbara|rita|lara|clara|anja|irina|erisia|trixi|julia|gina|miriam|petra|adriane)/i;
const M_NAMES = /^(herr|chef\b|kunde|leiter\b|verkäufer\b|kollege|mitarbeiter\b|teamleiter\b|sprecher|ignacio|karl|markus|max|michael|murat|mustafa|simmering|timbur|tom|thomas|zarif|juri|mario|taro|felix|daniel|robert|stefan|guido|waldemar|julius|konstantinos|roman|paul|eno|hans|ahmed|achmed)/i;
function guessGender(who, i) {
  const w = String(who || "").trim();
  if (F_NAMES.test(w)) return "f";
  if (M_NAMES.test(w)) return "m";
  const m = w.match(/(\d)/); if (m) return +m[1] % 2 ? "f" : "m";
  return i % 2 ? "m" : "f";
}
// Assign a distinct voice to each speaker of a recording
function castVoices(segs) {
  loadVoices();
  const c = vcfg();
  const pool = (g) => {
    const pref = deVoices.find(v => v.name === c[g]);
    const same = deVoices.filter(v => voiceGender(v) === g && v !== pref);
    return [pref, ...same].filter(Boolean);
  };
  const F = pool("f"), M = pool("m");
  const speakers = []; segs.forEach(s => { if (!speakers.includes(s.who)) speakers.push(s.who); });
  const cast = {}; let fi = 0, mi = 0;
  speakers.forEach((who, i) => {
    const g = segs.find(s => s.who === who).g || guessGender(who, i);
    let v = null, pitch = 1;
    if (g === "f") { v = F[fi % Math.max(F.length, 1)] || null; if (F.length && fi >= F.length) pitch = 1.12; fi++; }
    else { v = M[mi % Math.max(M.length, 1)] || null; if (M.length && mi >= M.length) pitch = 0.88; mi++; }
    if (!v) { v = deVoices[0] || null; pitch = g === "m" ? 0.78 : 1.1; }
    cast[who] = { v, pitch, g };
  });
  return cast;
}
// make phone numbers and spelled names sound like a real announcer
function speakable(t) {
  return t
    .replace(/\b([A-ZÄÖÜß]{1,3}(?:\s?-\s?[A-ZÄÖÜß]{1,3}){2,})\b/g, (m) => m.split(/\s?-\s?/).join(", ") + ",")
    .replace(/\b0\d{2,4}(?:[\s\-]\d{1,4}){1,5}\b|\b0\d{7,11}\b/g, (m) => m.replace(/[\s\-]+/g, " ").split(" ").map(g => g.split("").join(" ")).join(", "))
    .replace(/\*innen/g, "innen").replace(/20XX/g, "zwanzig x x");
}
function chunks(t) {
  const sents = t.match(/[^.!?]+[.!?]+["“”»]*\s*|[^.!?]+$/g) || [t];
  const out = []; let cur = "";
  for (const s of sents) { if ((cur + s).length > 200 && cur) { out.push(cur.trim()); cur = ""; } cur += s; }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function fnv(s) { let h = 0x811c9dc5; for (const x of new TextEncoder().encode(s)) { h ^= x; h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, "0"); }
const segKey = (s) => fnv((s.who || "") + "\u0001" + s.t);
let AUDIO = {}; // pre-rendered neural recordings (assets/audio/index.json), produced by src/gen_audio.py
const audioReady = location.protocol.startsWith("http") ? fetch("assets/audio/index.json").then(r => r.ok ? r.json() : {}).then(j => { AUDIO = j || {}; }).catch(() => {}) : Promise.resolve();
let activePlayer = null;
let liveAudio = null;
function stopAll() { if (liveAudio) { liveAudio.onerror = null; liveAudio.pause(); liveAudio = null; } if (activePlayer) activePlayer.stop(); else if (TTS) TTS.cancel(); }
// speak any text: neural voice from the local server (npm start), browser voice as fallback
function browserSpeak(text, g) { if (!TTS) return; loadVoices(); const c = castVoices([{ who: "x", t: text, g: g || "f" }]).x; speakLater(chunks(speakable(text)).map(t => { const u = new SpeechSynthesisUtterance(t); if (c.v) { u.voice = c.v; u.lang = c.v.lang; } else u.lang = "de-DE"; u.pitch = c.pitch; u.rate = vcfg().rate || 1; return u; })); }
function speakText(text, g) {
  stopAll();
  if (!(LOCAL && location.protocol.startsWith("http"))) return browserSpeak(text, g);
  const au = liveAudio = new Audio("api/tts?g=" + (g === "m" ? "m" : "f") + "&t=" + encodeURIComponent(speakable(text)));
  au.playbackRate = vcfg().rate || 1;
  au.onerror = () => { if (liveAudio === au) { liveAudio = null; browserSpeak(text, g); } };
  au.play().catch(() => au.onerror && au.onerror());
}

function makePlayer(segs, opt = {}) {
  // segs: [{who, t, g?}]; opt: {title, once, onLine(i), onEnd}
  let plays = 0, state = "idle", locked = false;
  const count = h("span", { class: "small muted mono" }, "");
  const playBtn = h("button", { class: "btn primary" }, "▶ Слушать");
  const stopBtn = h("button", { class: "btn", disabled: true }, "■");
  const cast = castVoices(segs);
  const castLine = h("span", { class: "cast" });
  const fillCast = () => { const c = castVoices(segs); Object.assign(cast, c); castLine.textContent = Object.keys(c).filter(Boolean).length > 1 ? Object.entries(c).map(([w, x]) => `${w}: ${x.v ? x.v.name.replace(/^Microsoft |\s*\(.*\)|Online|Natural|- Deutsch.*$/g, "").trim() : "—"}`).join(" · ") : ""; };
  fillCast();
  const box = h("div", { class: "player" }, h("span", { class: "wave", "aria-hidden": "true" }, h("i"), h("i"), h("i"), h("i")),
    h("div", { style: "display:flex;flex-direction:column;min-width:0;flex:1" }, opt.title ? h("span", { class: "ptitle" }, opt.title) : null, castLine), playBtn, stopBtn, count);
  const useAudio = segs.every(s => AUDIO[segKey(s)]);
  if (useAudio) castLine.textContent = "диктор: нейроголос Microsoft";
  if (!TTS && !useAudio) { box.replaceChildren(h("span", { class: "small muted" }, "Браузер не умеет озвучивать текст. Откройте страницу в Chrome или Edge, либо читайте транскрипт.")); return box; }
  const setState = (s) => {
    state = s; box.classList.toggle("playing", s === "playing");
    playBtn.textContent = s === "playing" ? "❚❚ Пауза" : s === "paused" ? "▶ Дальше" : locked ? "Прослушано" : plays ? "↻ Ещё раз" : "▶ Слушать";
    playBtn.disabled = locked && s === "idle"; stopBtn.disabled = s === "idle";
  };
  let cur = null, ai = 0, atimer = null; const keep = [];
  const halt = () => { if (TTS) TTS.cancel(); clearTimeout(atimer); if (cur) { cur.onended = cur.onerror = null; cur.pause(); cur = null; } };
  const done = () => { if (activePlayer === api) { plays++; if (opt.once) locked = true; count.textContent = opt.once ? "на экзамене звучит 1 раз" : `прослушано: ${plays}`; stop(); opt.onEnd && opt.onEnd(); } };
  function nextAudio() {
    if (activePlayer !== api) return;
    if (ai >= segs.length) { done(); return; }
    const i = ai, au = new Audio("assets/audio/" + AUDIO[segKey(segs[i])]);
    au.playbackRate = vcfg().rate || 1; cur = au; opt.onLine && opt.onLine(i);
    au.onended = () => { ai++; atimer = setTimeout(nextAudio, 350); };
    au.onerror = () => { ai++; nextAudio(); };
    au.play().catch(() => { ai++; nextAudio(); });
  }
  function stop() { halt(); if (activePlayer === api) activePlayer = null; setState("idle"); opt.onLine && opt.onLine(-1); }
  function play() {
    stopAll(); activePlayer = api; halt(); fillCast();
    if (useAudio) { ai = 0; setState("playing"); nextAudio(); return; }
    const rate = vcfg().rate || 1;
    const q = [];
    const startSpeech = () => {
    segs.forEach((s, i) => chunks(speakable(s.t)).forEach(t => q.push({ i, t, who: s.who })));
    q.forEach((it, n) => {
      const c = cast[it.who] || {};
      const u = new SpeechSynthesisUtterance(it.t);
      if (c.v) { u.voice = c.v; u.lang = c.v.lang; } else u.lang = "de-DE";
      u.pitch = c.pitch || 1; u.rate = rate;
      u.onstart = () => { api.mark && api.mark(); opt.onLine && opt.onLine(it.i); };
      u.onerror = (e) => { if (e.error && e.error !== "interrupted" && e.error !== "canceled") { castLine.textContent = "Ошибка озвучки: " + e.error; } };
      if (n === q.length - 1) u.onend = done;
      keep.push(u); TTS.speak(u);
      if (n < q.length - 1 && q[n + 1].i !== it.i) { const p = new SpeechSynthesisUtterance(","); p.volume = 0; p.rate = 1.4; keep.push(p); TTS.speak(p); }
    });
    };
    setState("playing");
    // Chrome swallows speak() right after cancel(), so wait a moment; also keep the utterances referenced
    TTS.cancel(); let started = false;
    setTimeout(() => { if (activePlayer === api && state === "playing") startSpeech(); }, 120);
    setTimeout(() => { if (activePlayer === api && state === "playing" && !started && !TTS.speaking) { stop(); castLine.textContent = "Браузер не смог озвучить текст. Откройте раздел «Голос» и проверьте немецкие голоса."; } }, 3500);
    api.mark = () => { started = true; };
  }
  playBtn.onclick = () => {
    if (state === "playing") { if (useAudio) { clearTimeout(atimer); cur && cur.pause(); } else TTS.pause(); setState("paused"); }
    else if (state === "paused") { if (useAudio) { if (cur && !cur.ended) cur.play(); else nextAudio(); } else TTS.resume(); setState("playing"); }
    else if (!locked) play();
  };
  stopBtn.onclick = () => { stop(); if (opt.once && plays === 0) { /* stopping early in exam mode counts as the one play */ locked = true; setState("idle"); } };
  const api = { stop, el: box };
  setState("idle");
  return box;
}
function transcript(segs, open) {
  const lines = segs.map(s => h("div", null, s.who ? h("div", { class: "spk" }, s.who) : null, h("span", null, s.t)));
  const box = h("div", { class: "transcript", hidden: !open }, lines);
  const btn = h("button", { class: "btn ghost small" }, open ? "Скрыть транскрипт" : "Показать транскрипт");
  btn.onclick = () => { box.hidden = !box.hidden; btn.textContent = box.hidden ? "Показать транскрипт" : "Скрыть транскрипт"; };
  return { box, btn, highlight(i) { lines.forEach((l, n) => l.lastChild.classList.toggle("now", n === i)); } };
}
const SPOKEN = [];
// Chrome drops speak() right after cancel(): queue the utterances after a short pause and keep them referenced
function speakLater(utts) { TTS.cancel(); SPOKEN.length = 0; SPOKEN.push(...utts); setTimeout(() => utts.forEach((u) => TTS.speak(u)), 120); }
function speakBtn(text, g) {
  return h("button", { class: "btn ghost small", title: "Озвучить", onclick: () => speakText(text, g) }, "🔊");
}
