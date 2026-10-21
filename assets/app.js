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
  set(k, v) { try { localStorage.setItem("dtb." + k, JSON.stringify(v)); } catch {} if (store.onSet) store.onSet(k); }
};
// Test mode is a per-tab, temporary choice. A stored "learn" must never turn
// every later test into a non-interactive answer sheet.
const modeStore = {
  get() { try { const v = sessionStorage.getItem("dtb.mode"); return ["train", "exam", "learn"].includes(v) ? v : "train"; } catch { return "train"; } },
  set(v) { try { sessionStorage.setItem("dtb.mode", v); } catch {} }
};
// One stable shuffle per attempt. The seed is dropped on restart/reload, so a
// retake gets fresh option and matching-card positions without moving between
// mode/language re-renders of the same attempt.
const TRY_SEEDS = new Map();
function attemptSeed(vid) {
  if (!TRY_SEEDS.has(vid)) TRY_SEEDS.set(vid, (Math.random() * 0xFFFFFFFF) >>> 0);
  return TRY_SEEDS.get(vid);
}
function resetAttempt(vid) { TRY_SEEDS.delete(vid); }
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function shuffleArr(a, rand) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function shuffleForAttempt(sec, it, seed) {
  const rand = mulberry32(seed);
  const d = JSON.parse(JSON.stringify(it));
  if (sec === "l1" && Array.isArray(d.ads)) {
    const order = shuffleArr(d.ads.slice(), rand), map = new Map();
    order.forEach((a, i) => { const old = a.l; a.l = LET[i]; map.set(old, a.l); });
    d.ads = order;
    d.persons = d.persons.map(p => ({ ...p, ans: map.get(p.ans) || p.ans }));
    return d;
  }
  if (sec === "l3" && Array.isArray(d.posts)) {
    const order = shuffleArr(d.posts.slice(), rand), map = new Map();
    order.forEach((a, i) => { const old = a.l; a.l = LET[i]; map.set(old, a.l); });
    d.posts = order;
    d.persons = d.persons.map(p => ({ ...p, ans: map.get(p.ans) || p.ans }));
    return d;
  }
  if (sec === "h2" && Array.isArray(d.opts) && Array.isArray(d.ans)) {
    const old = d.opts.slice();
    const order = shuffleArr(d.opts.map((_, i) => i), rand);
    const map = new Map(order.map((oldI, newI) => [LET[oldI], LET[newI]]));
    d.opts = order.map(i => old[i]);
    d.ans = d.ans.map(a => map.get(a) || a);
    return d;
  }
  if (sec === "s1" && Array.isArray(d.opts) && Array.isArray(d.opts[0])) {
    const old = d.opts.slice();
    const order = shuffleArr(old.map((_, i) => i), rand);
    const map = new Map(order.map((oldI, newI) => [LET[oldI], LET[newI]]));
    d.opts = order.map((oldI, newI) => [LET[newI], old[oldI][1]]);
    d.ans = d.ans.map(a => map.get(a) || a);
    return d;
  }
  if (sec === "s2" && Array.isArray(d.opts) && Array.isArray(d.ans)) {
    d.opts = d.opts.map((opts, gi) => {
      const order = shuffleArr(opts.map((_, j) => j), rand);
      const map = new Map(order.map((oldJ, newJ) => [LET[oldJ], LET[newJ]]));
      d.ans[gi] = map.get(d.ans[gi]) || d.ans[gi];
      return order.map(j => opts[j]);
    });
    return d;
  }
  const mixMC = (q) => {
    if (!q || q.type !== "mc" || !Array.isArray(q.opts)) return;
    const oldIdx = LET.indexOf(q.ans);
    if (oldIdx < 0) return;
    const order = shuffleArr(q.opts.map((_, i) => i), rand);
    q.opts = order.map(i => q.opts[i]);
    q.ans = LET[order.indexOf(oldIdx)];
  };
  if (sec === "h4" && Array.isArray(d.msgs)) {
    d.msgs.forEach(m => mixMC(m.q));
    return d;
  }
  if (Array.isArray(d.qs)) d.qs.forEach(mixMC);
  return d;
}
function markActive() { const d = store.get("days", []); if (!d.includes(today())) { d.push(today()); store.set("days", d.slice(-400)); } }
function saveRes(vid, score, max) {
  const r = store.get("res", {});
  const o = r[vid] || { best: 0, n: 0 };
  o.last = score; o.max = max; o.n++; o.ts = Date.now(); o.best = Math.max(o.best || 0, score);
  r[vid] = o; store.set("res", r); markActive();
  // compact activity log for the teacher cabinet (last 2000 attempts); synced to Firestore
  const log = store.get("log", []);
  if (Array.isArray(log)) { log.push({ t: o.ts, vid, sc: score, mx: max }); store.set("log", log.slice(-2000)); }
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

/* ---------- ИИ (sample capability) ---------- */
let SAMPLE = null, sampleChecked = false;
// Local version (no claude.ai runtime): the small server in server.js forwards requests to the ИИ API using OPENAI_API_KEY
async function localSample() {
  try { const st = await (await fetch("/api/status")).json(); if (!st.ready) return null; } catch { return null; }
  const call = async (input, opts = {}) => {
    const messages = typeof input === "string" ? [{ role: "user", content: input }] : input;
    let r;
    try { r = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages, tier: opts.modelTier || "default" }), signal: opts.signal }); }
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
  not_granted: "Вы не разрешили странице обращаться к ИИ. Автоматическая проверка ответов работает и без него.",
  sampling_disabled: "ИИ недоступен для этого аккаунта.",
  rate_limited: "Слишком много запросов подряд или исчерпан лимит. Попробуйте немного позже.",
  session_expired: "Сессия истекла. Войдите в claude.ai снова и обновите страницу.",
  invalid_json: "Ответ пришёл в неожиданном формате. Нажмите кнопку ещё раз.",
  refused: "ИИ не ответил на этот запрос. Измените текст.",
  prompt_too_large: "Текст слишком длинный. Сократите его.",
  cancelled: "Запрос остановлен.",
  network: "Нет связи с локальным сервером. Запущен ли npm start?",
  authentication_error: "Ключ API не подходит. Проверьте OPENAI_API_KEY.",
  error: "ИИ вернул ошибку. Попробуйте ещё раз."
};
const errText = (e) => ERR[e && e.code] || "Не удалось связаться с ИИ. Попробуйте ещё раз.";
function thinking(msg) { return h("div", { class: "thinking" }, h("span", { class: "dots" }, h("i"), h("i"), h("i")), msg || "ИИ думает…"); }
async function getSample() { const s = SAMPLE || await sampleReady; if (!s) throw { code: "not_granted" }; return s; }
const LANG_NAME = { ru: "Russian", en: "English", de: "German", fr: "French", tr: "Turkish", ar: "Arabic", it: "Italian" };
// German names for prompts written in German ("Übersetzung ins …")
const LANG_DE = { ru: "Russische", en: "Englische", fr: "Französische", tr: "Türkische", ar: "Arabische", it: "Italienische" };
// the interface language (German by default) decides in which language the AI explains, and into which language it translates
// "auf …" for German prompts: the language explanations are written in
const LANG_AUF = { ru: "Russisch", en: "Englisch", de: "Deutsch", fr: "Französisch", tr: "Türkisch", ar: "Arabisch", it: "Italienisch" };
const aufLang = () => "auf " + (LANG_AUF[aiLang()] || "Deutsch");
const aiLang = () => (typeof curLang === "function" ? curLang() : store.get("lang", "de"));
// rule for word lists after an AI answer: none for a German interface, otherwise translations into the interface language
const glossaryDe = (what) => aiLang() === "de" ? "" : ` Danach eine Leerzeile und ${what} aus dem Text mit Übersetzung ins ${LANG_DE[aiLang()]}, eine pro Zeile.`;
function langNote(prompt) {
  const l = aiLang(), n = LANG_NAME[l];
  const note = l === "de"
    ? "\n\n[Interface language: German. Write every explanation, comment, tip, summary and error description in simple, clear German (level B2). Do NOT translate German words or sentences into any other language and do not add glossaries or word lists with translations. Role-play replies stay in German.]"
    : `\n\n[Interface language: ${n}. Write every explanation, comment, tip, summary and error description in ${n}. Whenever you translate German words or sentences, translate them into ${n} only${l === "ru" ? "" : ", never into Russian or any other language"}. Keep German quotes, corrections and examples in German. Role-play replies of a conversation partner or examiner stay in German.]`;
  if (typeof prompt === "string") return prompt + note;
  const c = prompt.map((m) => Object.assign({}, m));
  for (let i = c.length - 1; i >= 0; i--) if (c[i].role === "user") { c[i].content += note; break; }
  return c;
}
async function askJSON(prompt, opts = {}) { const s = await getSample(); return s.json(langNote(prompt), Object.assign({ cache: false }, opts)); }
async function askText(prompt, opts = {}) { const s = await getSample(); return s(langNote(prompt), opts); }
function aiButton(label, onClick, cls) { return h("button", { class: "btn " + (cls || "primary"), "data-ai": "", hidden: !SAMPLE, onclick: onClick }, h("span", { class: "ai" }, "AI"), label); }
const LOCAL = !(window.claude && window.claude.use);
function noAiNote(text) { return h("div", { class: "note", "data-noai": "", hidden: !!SAMPLE || !sampleChecked }, LOCAL ? "Проверка ИИ выключена: не задан ключ API. Остановите сервер и запустите его так: OPENAI_API_KEY=sk-... npm start (ключ создаётся на platform.openai.com). Либо делайте письма в онлайн-версии на claude.ai, там проверка работает без ключа." : text || "Проверка через ИИ недоступна в этом просмотре. Откройте страницу на claude.ai и разрешите доступ к ИИ, когда появится запрос."); }

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

/* ---------- question engine (train / exam / learn) ---------- */
const MODES = { train: "Тренировка", exam: "Экзамен", learn: "Учить" };
const MODE_HINT = {
  train: "Ответ проверяется сразу после выбора. Аудио можно слушать сколько угодно.",
  exam: "Как на экзамене: проверка в конце, аудио звучит один раз.",
  learn: "Правильные ответы уже отмечены. Читайте и запоминайте, нажимайте «Почему?», чтобы понять."
};
function letterOf(i) { return LET[i]; }
let LAST_QZ = null; // the quiz built by the latest render, picked up by the exam-paper Antwortbogen

function quiz(cfg) {
  const { vid, sec, items } = cfg;
  const mode = cfg.mode || "train";
  const per = cfg.per || 1;
  const st = {}; // key -> {val, done}
  const W = {};
  const resultBox = h("div", { class: "stack" });
  let finished = false;

  function optLabel(it, val) {
    if (it.kind === "rf") return val === "R" ? "Richtig" : "Falsch";
    if (it.kind === "mc") { const i = LET.indexOf(val); return `${val}) ${it.opts[i]}`; }
    if (it.kind === "gap") { const o = it.opts.find(o => o[0] === val); return o ? `${o[0]}) ${o[1]}` : val; }
    return val === "x" ? "X (нет подходящего)" : val;
  }

  function build(it) {
    const s = st[it.key] = { val: null, done: false };
    const explainBox = h("div", { class: "explain", hidden: true });
    const why = aiButton("Почему?", () => explain(it, explainBox, why), "small");
    why.hidden = true; why.dataset.ai = "";
    const verdict = h("span", { class: "small" });
    const foot = h("div", { class: "qfoot" }, verdict, why);
    const btns = [];
    let el;
    const choose = (val) => {
      if (s.done || finished) return;
      s.val = val;
      btns.forEach(b => b.classList.toggle("sel", b.dataset.v === val));
      if (it.kind === "gap") sel.classList.toggle("chosen", !!val);
      if (mode === "train") { reveal(it); afterTrain(); }
      paint(it);
      cfg.onChange && cfg.onChange();
    };
    let sel = null;
    if (it.kind === "gap") {
      sel = h("select", { id: `g-${vid}-${it.n}`, "aria-label": "Lücke " + it.n },
        h("option", { value: "" }, "…"), it.opts.map(o => h("option", { value: o[0] }, `${o[0]}) ${o[1]}`)));
      sel.onchange = () => choose(sel.value || null);
      const fix = h("span", { class: "fix", hidden: true });
      el = h("span", { class: "gap" }, h("span", { class: "gn" }, it.n), sel, fix);
      W[it.key] = { el, btns, sel, fix, why, explainBox, verdict, foot, choose: (v) => { sel.value = v; choose(v); } };
      return el;
    }
    let optsEl;
    if (it.kind === "mc") {
      optsEl = h("div", { class: "opts" }, it.opts.map((o, i) => { const b = h("button", { class: "opt", "data-v": LET[i], onclick: () => choose(LET[i]) }, h("span", { class: "l" }, LET[i] + ")"), h("span", null, o)); btns.push(b); return b; }));
    } else if (it.kind === "rf") {
      optsEl = h("div", { class: "opts rf" }, ["R", "F"].map(v => { const b = h("button", { class: "opt", "data-v": v, onclick: () => choose(v) }, v === "R" ? "Richtig" : "Falsch"); btns.push(b); return b; }));
    } else {
      optsEl = h("div", { class: "letters" }, it.letters.map(l => { const b = h("button", { class: "lb", "data-v": l, onclick: () => choose(l), "aria-label": "Ответ " + l }, l === "x" ? "X" : l); btns.push(b); return b; }));
    }
    el = h("div", { class: "q" }, h("div", { class: "qh" }, h("span", { class: "qn" }, it.n), h("div", { class: "qt" }, it.textEl || it.text)), optsEl, foot, explainBox);
    W[it.key] = { el, btns, why, explainBox, verdict, foot, choose };
    return el;
  }

  function reveal(it) {
    const s = st[it.key], w = W[it.key];
    s.done = true;
    const ok = s.val === it.ans;
    if (it.kind === "gap") {
      w.el.classList.add(ok ? "good" : "badc"); w.sel.disabled = true;
      if (!ok) { w.fix.hidden = false; w.fix.textContent = "→ " + optLabel(it, it.ans); }
      w.el.title = ok ? "Верно" : "Правильно: " + optLabel(it, it.ans);
    } else {
      w.el.classList.add(ok ? "right" : "wrong");
      w.btns.forEach(b => { b.disabled = true; b.classList.remove("sel"); if (b.dataset.v === it.ans) b.classList.add("good"); else if (b.dataset.v === s.val) b.classList.add("badc"); });
      w.verdict.replaceChildren(mode === "learn" ? h("span", { class: "chip ok" }, "Ответ: " + optLabel(it, it.ans)) :
        ok ? h("span", { class: "chip ok" }, "Верно") : h("span", { class: "chip bad" }, s.val ? "Неверно · правильно: " + optLabel(it, it.ans) : "Нет ответа · правильно: " + optLabel(it, it.ans)));
      w.why.hidden = !SAMPLE;
    }
    paint(it);
    cfg.onReveal && cfg.onReveal(it, ok);
  }

  /* Antwortbogen: telc-style answer sheet rows (number · bubbles · number), in sync with the task */
  const marks = {};
  const choicesOf = (it) => it.kind === "rf" ? [["R", "richtig"], ["F", "falsch"]] : it.kind === "mc" ? it.opts.map((o, i) => [LET[i], LET[i]])
    : it.kind === "gap" ? it.opts.map(o => [o[0], o[0]]) : it.letters.map(l => [l, l]);
  function paint(it) {
    const m = marks[it.key]; if (!m) return;
    const s = st[it.key];
    m.forEach(b => { const v = b.dataset.v; b.classList.toggle("on", s.val === v);
      b.classList.toggle("good", s.done && v === it.ans); b.classList.toggle("badc", s.done && s.val === v && v !== it.ans); b.disabled = s.done || finished; });
  }
  function bogen() {
    return h("div", { class: "bg-rows" }, items.map((it, r) => {
      const bs = choicesOf(it).map(([v, l]) => h("button", { class: "bub" + (it.kind === "rf" ? " wide" : ""), "data-v": v, "aria-label": `${it.n}: ${l}`, onclick: () => W[it.key].choose(v) }, h("i"), h("span", null, l)));
      marks[it.key] = bs; paint(it);
      return h("div", { class: "bg-row" + (r % 2 ? "" : " alt") }, h("b", null, it.n), h("div", { class: "bubs" }, bs), h("b", null, it.n));
    }));
  }

  async function explain(it, box, btn) {
    box.hidden = false; btn.disabled = true;
    box.replaceChildren(thinking("ИИ разбирает вопрос…"));
    const s = st[it.key];
    const L = aiLang(), de = L === "de";
    const p = `Ты — опытный преподаватель немецкого, готовишь ученика к экзамену telc DTB B2 Beruf.
Объясни ${de ? "на простом, понятном немецком языке (уровень B2)" : "на языке интерфейса ученика: " + LANG_NAME[L]}, почему в задании ниже правильный ответ «${optLabel(it, it.ans)}».
${s.val && s.val !== it.ans ? `Ученик выбрал «${optLabel(it, s.val)}» — объясни, почему это неверно.` : ""}
Процитируй дословно немецкую фразу из текста, которая доказывает ответ${de ? " (без перевода на другие языки)" : ", и переведи её на " + LANG_NAME[L]}. В конце дай 2–3 полезных немецких слова или выражения из этого места${de ? " с коротким объяснением по-немецки, без переводов" : " с переводом на " + LANG_NAME[L]}.
Пиши коротко и понятно (5–9 предложений), без Markdown-разметки, без заголовков.

Часть экзамена: ${cfg.label}
${(cfg.context ? cfg.context(it) : "").slice(0, 14000)}

Вопрос ${it.n}: ${it.text || ""}
${it.kind === "mc" ? it.opts.map((o, i) => `${LET[i]}) ${o}`).join("\n") : it.kind === "gap" ? "Варианты: " + it.opts.map(o => `${o[0]}) ${o[1]}`).join(", ") : it.kind === "rf" ? "Richtig / Falsch" : "Варианты ответа: буквы " + it.letters.join(", ")}`;
    try {
      await askText(p, { onText: ({ text }) => { box.textContent = text; } });
    } catch (e) { box.textContent = e.text || errText(e); }
    btn.disabled = false;
  }

  function score() { return items.reduce((n, it) => n + (st[it.key] && st[it.key].val === it.ans ? 1 : 0), 0); }
  function showResult() {
    finished = true;
    resetAttempt(cfg.vid);
    const sc = score(), mx = items.length;
    const pct = Math.round(sc / mx * 100);
    saveRes(vid, sc, mx);
    trackItems(items.map(it => ({ key: `${vid}:${it.key}`, n: it.n, ok: st[it.key].val === it.ans, vid, sec })));
    const pts = Math.round(sc * per * 10) / 10, pmx = Math.round(mx * per * 10) / 10;
    resultBox.replaceChildren(h("div", { class: "result" },
      h("span", { class: "big" }, `${sc}/${mx}`),
      h("span", { class: "chip " + (pct >= 60 ? "ok" : pct >= 40 ? "warn" : "bad") }, `${pct}% · ${pts} из ${pmx} баллов`),
      h("span", { class: "small muted", style: "flex:1;min-width:200px" }, pct >= 60 ? "Это уровень сдачи (60% и выше)." : "Пока ниже 60%. Посмотрите ошибки и нажмите «Почему?»."),
      h("button", { class: "btn", onclick: () => cfg.restart && cfg.restart() }, "↻ Пройти заново"),
      cfg.next ? h("a", { class: "btn primary", href: cfg.next }, "Следующий вариант →") : null));
    checkBtn.hidden = true;
    cfg.onDone && cfg.onDone(sc, mx);
  }
  function afterTrain() { if (items.every(it => st[it.key].done)) showResult(); }

  const checkBtn = h("button", { class: "btn primary", hidden: mode !== "exam", onclick: () => {
    const missing = items.filter(it => !st[it.key].val).length;
    if (missing && !checkBtn.dataset.sure) { checkBtn.dataset.sure = "1"; checkBtn.textContent = `Без ответа: ${missing}. Всё равно проверить`; return; }
    items.forEach(reveal); showResult();
  } }, "Проверить ответы");

  const els = {};
  items.forEach(it => { els[it.key] = build(it); });
  if (mode === "learn") items.forEach(it => { st[it.key].val = it.ans; if (W[it.key].sel) W[it.key].sel.value = it.ans; reveal(it); });
  const footer = h("div", { class: "stack" }, h("div", { class: "footer-bar" }, checkBtn), resultBox);
  const api = { el: (k) => els[k], footer, items, state: st, bogen };
  LAST_QZ = api;
  return api;
}

function modeSwitch(cur, onPick) {
  return h("div", { class: "row" },
    h("div", { class: "seg", role: "tablist" }, Object.entries(MODES).map(([k, v]) => h("button", { class: k === cur ? "on" : "", role: "tab", "aria-selected": k === cur ? "true" : "false", onclick: () => onPick(k) }, v))),
    h("span", { class: "modehint" }, MODE_HINT[cur]),
    cur === "learn" ? h("button", { class: "btn small primary", onclick: () => onPick("train") }, "▶ ", MODES.train) : null);
}
const srcNote = () => null;

/* ---------- exam parts ---------- */
const P = (arr) => arr.map(p => h("p", null, p));
const docEl = (title, heading, paras) => h("div", { class: "doc" }, title ? h("div", { class: "dt" }, title) : null, heading ? h("h3", null, heading) : null, P(paras));
const mailEl = (label, paras) => h("div", { class: "mail" }, h("div", { class: "mh" }, label), h("div", { class: "mb" }, P(paras)));
const qItems = (qs) => qs.map(q => ({ key: String(q.n), n: q.n, kind: q.type, text: q.text, opts: q.opts, ans: q.type === "rf" ? q.ans : q.ans }));
const lbl = (it) => "Вариант " + it.v;

const SECS = [
  { id: "l1", grp: "Lesen", t: "Lesen Teil 1", ru: "Люди и объявления", nums: "1–5", per: 3, list: () => DB.L1, label: lbl, min: 15,
    task: "Прочитайте, что ищут люди (1–5), и выберите подходящий текст (a–h). Каждый текст можно выбрать только один раз." },
  { id: "l2", grp: "Lesen", t: "Lesen Teil 2", ru: "Willkommensmappe", nums: "6–9", per: 3, list: () => DB.L2, label: (it) => `Text ${it.part} · №${it.v}`, min: 10,
    task: "Прочитайте текст из папки для новых сотрудников и решите: richtig или falsch, затем выберите a, b или c." },
  { id: "l3", grp: "Lesen", t: "Lesen Teil 3", ru: "Форум: кто кому отвечает", nums: "10–13", per: 3, list: () => DB.L3, label: lbl, min: 15,
    task: "Какой ответ на форуме (a–f) подходит к сообщению (10–13)? Если подходящего нет, выберите X." },
  { id: "l4", grp: "Lesen", t: "Lesen Teil 4", ru: "Протокол совещания", nums: "14–18", per: 3, list: () => DB.L4, label: (it) => `№${it.v}` + (it.topic ? ` · ${it.topic}` : ""), min: 20,
    task: "Прочитайте протокол и выберите правильный ответ a, b или c." },
  { id: "b", grp: "Lesen", t: "Beschwerde: вопросы 19–20", ru: "Записка шефа и письмо клиента", nums: "19–20", per: 3, list: () => DB.B.filter(b => b.qs.length), label: (it) => `№${String(it.v).replace("b", " (новый)")}` + (it.topic ? ` · ${it.topic}` : ""), min: 10,
    task: "Прочитайте записку шефа и письмо клиента и ответьте на вопросы 19 и 20." },
  { id: "bw", grp: "Schreiben", t: "Письмо клиенту (Beschwerde)", ru: "Пишете сами, ИИ проверяет", nums: "21", list: () => DB.B, label: (it) => `№${String(it.v).replace("b", " (новый)")}` + (it.topic ? ` · ${it.topic}` : ""), min: 25, write: true,
    task: "Прочитайте записку шефа и письмо клиента и напишите ответ клиенту сами. ИИ проверит грамматику, построение предложений и уровень B2." },
  { id: "f", grp: "Schreiben", t: "Forumsbeitrag", ru: "Мнение на форуме: пишете сами", nums: "58", list: () => DB.F, label: (it) => `${it.n}. ${it.title}`, min: 30, write: true,
    task: "Напишите сообщение на внутреннем форуме: что произошло, плюсы, минусы, ваше мнение. ИИ проверит текст." },
  { id: "s1", grp: "Schreiben", t: "Sprachbausteine 1", ru: "Пропуски: слова a–j", nums: "46–51", per: 0.5, list: () => DB.S1, label: (it) => `№${it.v}` + (it.subject ? ` · ${it.subject}` : ""), min: 10,
    task: "Какое слово (a–j) подходит в пропуск? Каждое слово используется один раз, некоторые лишние." },
  { id: "s2", grp: "Schreiben", t: "Sprachbausteine 2", ru: "Пропуски: a, b или c", nums: "52–57", per: 0.5, list: () => DB.S2, label: (it) => `№${it.v}` + (it.subject ? ` · ${it.subject.slice(0, 32)}` : ""), min: 10,
    task: "Выберите для каждого пропуска правильный вариант a, b или c." },
  { id: "h1", grp: "Hören", t: "Hören Teil 1", ru: "Три разговора на работе", nums: "22–27", per: 3, list: () => DB.H1, label: lbl, audio: true,
    task: "Вы услышите три разговора. К каждому два задания: richtig/falsch и выбор a, b или c." },
  { id: "h2", grp: "Hören", t: "Hören Teil 2", ru: "Мнения коллег", nums: "28–31", per: 3, list: () => DB.H2, label: (it) => `№${it.v}` + (it.id.length > 4 ? ` · набор ${it.id.slice(-1)}` : ""), audio: true,
    task: "Вы услышите четыре коротких разговора. Какое высказывание (a–f) подходит к каждому?" },
  { id: "h3", grp: "Hören", t: "Hören Teil 3", ru: "Совещание / доклад", nums: "32–35", per: 3, list: () => DB.H3, label: (it) => `№${it.v}` + (it.topic ? ` · ${it.topic}` : ""), audio: true,
    task: "Вы услышите сообщение на совещании. Выберите правильный ответ a, b или c." },
  { id: "h4", grp: "Hören", t: "Hören Teil 4", ru: "Сообщения на автоответчике", nums: "36–40", per: 3, list: () => DB.H4, label: lbl, audio: true,
    task: "Вы услышите пять сообщений на автоответчике. Выберите правильный ответ a, b или c." },
  { id: "n", grp: "Hören", t: "Telefonnotiz", ru: "Записка по телефонному сообщению", nums: "41–45", list: () => DB.N, label: (it) => `${it.name} · ${it.type}`, audio: true,
    task: "Прослушайте сообщение и заполните записку: имя, телефон, важная информация, что нужно сделать." },
  { id: "sp1", grp: "Sprechen", t: "Sprechen Teil 1", ru: "Презентация + вопросы (2+2 мин)", nums: "T1", list: () => DB.SP1, label: (it) => `${it.n}. ${it.title}`,
    task: "Подготовьте и произнесите короткую презентацию по теме (около 2 минут), затем ответьте на вопросы экзаменатора. ИИ проверяет ваш текст и играет экзаменатора." },
  { id: "sp2", grp: "Sprechen", t: "Sprechen Teil 2", ru: "Smalltalk (3 мин)", nums: "T2", list: () => DB.SP2, label: (it) => `${it.n}. ${it.title}`,
    task: "Непринуждённый разговор с коллегой на бытовую тему. Посмотрите образец разговора, затем поговорите с ИИ." },
  { id: "sp3", grp: "Sprechen", t: "Sprechen Teil 3", ru: "Вместе найти решение (4 мин)", nums: "T3", list: () => DB.SP3, label: (it) => `${it.n}. ${it.text.slice(0, 40)}…`,
    task: "Вы с партнёром обсуждаете проблему на работе и вместе ищете решение. Посмотрите образец диалога, затем поговорите с ИИ." },
];
const SEC = Object.fromEntries(SECS.map(s => [s.id, s]));

/* Lesen 1 / Lesen 3: matching */
function rMatch(it, mode, ctx, kind) {
  const isL1 = kind === "l1";
  const letters = isL1 ? it.ads.map(a => a.l) : [...it.posts.map(p => p.l), "x"];
  const people = it.persons;
  const items = people.map(p => ({ key: String(p.n), n: p.n, kind: "match", text: isL1 ? p.text : p.text, textEl: isL1 ? null : h("span", null, h("b", { style: "font-family:var(--f-ui)" }, p.name + ": "), p.text), letters, ans: p.ans }));
  const side = isL1 ? it.ads.map(a => h("div", { class: "ad", id: `ad-${it.id}-${a.l}` }, h("span", { class: "lt" }, a.l + ")"), h("b", null, a.title), " ", a.text))
    : it.posts.map(a => h("div", { class: "ad", id: `ad-${it.id}-${a.l}` }, h("span", { class: "lt" }, a.l + ")"), h("b", null, a.name), h("div", null, a.text)));
  const context = () => (isL1 ? "Тексты:\n" + it.ads.map(a => `${a.l}) ${a.title} ${a.text}`).join("\n") + "\nЛюди:\n" + people.map(p => `${p.n}. ${p.text}`).join("\n")
    : "Ответы на форуме:\n" + it.posts.map(a => `${a.l}) ${a.name}: ${a.text}`).join("\n") + "\nСообщения:\n" + people.map(p => `${p.n}. ${p.name}: ${p.text}`).join("\n") + "\n(X = подходящего ответа нет)");
  const qz = quiz({ vid: it.id, sec: kind, mode, items, per: 3, label: SEC[kind].t, context, ...ctx,
    onReveal: (q, ok) => { const ad = document.getElementById(`ad-${it.id}-${q.ans}`); if (ad && (mode === "learn")) ad.classList.add("hl"); } });
  return h("div", { class: "two" },
    h("div", { class: "stack" }, h("div", { class: "qs" }, items.map(q => qz.el(q.key))), qz.footer),
    h("div", { class: "ads sticky" }, h("div", { class: "eyebrow" }, isL1 ? "Тексты a–h" : "Ответы a–f"), side));
}

function rL2(it, mode, ctx) {
  const items = qItems(it.qs);
  const context = () => `${it.title}\n${it.heading || ""}\n${it.paras.join("\n")}`;
  const qz = quiz({ vid: it.id, sec: "l2", mode, items, per: 3, label: "Lesen Teil 2", context, ...ctx });
  return h("div", { class: "two" }, docEl(it.title, it.heading, it.paras), h("div", { class: "stack sticky" }, h("div", { class: "qs" }, items.map(q => qz.el(q.key))), qz.footer));
}
function rL4(it, mode, ctx) {
  const items = qItems(it.qs);
  const context = () => it.paras.join("\n");
  const qz = quiz({ vid: it.id, sec: "l4", mode, items, per: 3, label: "Lesen Teil 4 (Protokoll)", context, ...ctx });
  return h("div", { class: "two" }, docEl("Protokoll", it.topic ? "Thema: " + it.topic : null, it.paras), h("div", { class: "stack sticky" }, h("div", { class: "qs" }, items.map(q => qz.el(q.key))), qz.footer));
}

function rBeschwerde(it, mode, ctx, onlyPart) {
  const mails = h("div", { class: "stack" }, mailEl("Записка от руководителя", it.chef), mailEl("Письмо клиента", it.mail));
  const parts = [];
  if (it.qs.length && onlyPart !== "write") {
    const items = qItems(it.qs);
    const context = () => "Записка шефа:\n" + it.chef.join("\n") + "\n\nПисьмо клиента:\n" + it.mail.join("\n");
    const qz = quiz({ vid: it.id, sec: "b", mode, items, per: 3, label: "Lesen und Schreiben, Beschwerde, Aufgaben 19–20", context, ...ctx });
    parts.push(h("div", { class: "two" }, mails, h("div", { class: "stack sticky" }, h("div", { class: "eyebrow" }, "Aufgaben 19–20"), h("div", { class: "qs" }, items.map(q => qz.el(q.key))), qz.footer)));
  } else parts.push(mails);
  if (onlyPart !== "quiz") {
    parts.push(writeTask({
      id: "w-" + it.id, kind: "beschwerde", title: "Aufgabe 21 · Antwort an " + (it.mail[it.mail.length - 1] || "den Kunden"), minutes: 20, target: [100, 180],
      taskEl: h("div", { class: "stack" }, h("p", { style: "margin:0" }, "Вы — сотрудник(ца), которому адресована записка. Напишите ответ клиенту и выполните ", h("b", null, "все поручения руководителя"), ". Ничего лишнего: если шеф не просил скидку, не предлагайте её."),
        h("p", { class: "small muted", style: "margin:0" }, "Структура: обращение → благодарность и извинение → причина → решение по каждому пункту шефа → заключение → Mit freundlichen Grüßen + имя.")),
      context: "Notiz der Chefin / des Chefs:\n" + it.chef.join("\n") + "\n\nE-Mail des Kunden:\n" + it.mail.join("\n"),
      models: it.models.map(m => m.join("\n")), modelNote: null, onDone: ctx.onWriteDone,  onSkip: ctx.onSkip,
    }));
  }
  return h("div", { class: "stack" }, parts);
}

function gapText(text, qz) {
  const out = h("div", { class: "doc gaptext" });
  text.split(/(\{\{\d+\}\})/).forEach(part => { const m = part.match(/^\{\{(\d+)\}\}$/); out.append(m ? qz.el(m[1]) : part); });
  return out;
}
function rS1(it, mode, ctx) {
  const items = it.ans.map((a, i) => ({ key: String(46 + i), n: 46 + i, kind: "gap", opts: it.opts, ans: a, text: "Lücke " + (46 + i) }));
  const context = () => "Текст с пропусками:\n" + it.text + "\nСлова: " + it.opts.map(o => `${o[0]}) ${o[1]}`).join(", ");
  const qz = quiz({ vid: it.id, sec: "s1", mode, items, per: 0.5, label: "Sprachbausteine Teil 1", context, ...ctx });
  return h("div", { class: "stack" },
    h("div", { class: "card stack" }, h("div", { class: "eyebrow" }, "Слова"), h("div", { class: "bank" }, it.opts.map(o => h("span", null, h("b", null, o[0]), o[1])))),
    it.subject ? h("div", { class: "eyebrow" }, "Betreff: " + it.subject) : null,
    gapText(it.text, qz), qz.footer);
}
function rS2(it, mode, ctx) {
  const items = it.ans.map((a, i) => ({ key: String(52 + i), n: 52 + i, kind: "gap", opts: it.opts[i].map((o, j) => [LET[j], o]), ans: a, text: "Lücke " + (52 + i) }));
  const context = () => "Текст с пропусками:\n" + it.text + "\n" + it.opts.map((o, i) => `${52 + i}: a) ${o[0]} b) ${o[1]} c) ${o[2]}`).join("\n");
  const qz = quiz({ vid: it.id, sec: "s2", mode, items, per: 0.5, label: "Sprachbausteine Teil 2", context, ...ctx });
  return h("div", { class: "stack" }, it.subject ? h("div", { class: "eyebrow" }, "Betreff: " + it.subject) : null, gapText(it.text, qz), qz.footer);
}

/* Hören */
function audioBlock(title, segs, mode, extra) {
  const tr = transcript(segs, mode === "learn");
  const pl = makePlayer(segs, { title, once: mode === "exam", onLine: (i) => tr.highlight(i) });
  return h("div", { class: "block" }, pl, mode === "exam" ? null : h("div", { class: "row" }, tr.btn), tr.box, extra || null);
}
const segText = (segs) => segs.map(s => (s.who ? s.who + ": " : "") + s.t).join("\n");
function rH1(it, mode, ctx) {
  const items = qItems(it.qs);
  const byN = Object.fromEntries(items.map(q => [q.n, q]));
  const context = (q) => { const d = it.dialogs.find(d => d.qs.includes(q.n)); return "Транскрипт:\n" + segText(d.segs); };
  const qz = quiz({ vid: it.id, sec: "h1", mode, items, per: 3, label: "Hören Teil 1", context, ...ctx });
  return h("div", { class: "stack" }, it.dialogs.map((d, i) => h("div", { class: "block card" }, h("div", { class: "eyebrow" }, `Gespräch ${i + 1} · Aufgaben ${d.qs.join(" und ")}`),
    audioBlock(`Nummer ${d.qs.join(" und ")}`, d.segs, mode), h("div", { class: "qs" }, d.qs.map(n => qz.el(String(n)))))), qz.footer);
}
function rH2(it, mode, ctx) {
  const letters = it.opts.map((_, i) => LET[i]);
  const items = it.ans.map((a, i) => ({ key: String(28 + i), n: 28 + i, kind: "match", text: "Gespräch " + (28 + i), letters, ans: a }));
  const context = (q) => "Высказывания:\n" + it.opts.map((o, i) => `${LET[i]}) ${o}`).join("\n") + "\nТранскрипт разговора " + q.n + ":\n" + segText(it.dialogs[q.n - 28].segs);
  const qz = quiz({ vid: it.id, sec: "h2", mode, items, per: 3, label: "Hören Teil 2", context, ...ctx });
  return h("div", { class: "two" },
    h("div", { class: "stack" }, it.dialogs.map((d, i) => h("div", { class: "block card" }, audioBlock(`Nummer ${28 + i}`, d.segs, mode), qz.el(String(28 + i)))), qz.footer),
    h("div", { class: "ads sticky" }, h("div", { class: "eyebrow" }, "Высказывания a–" + LET[it.opts.length - 1]), it.opts.map((o, i) => h("div", { class: "ad" }, h("span", { class: "lt" }, LET[i] + ")"), o))));
}
function rH3(it, mode, ctx) {
  const items = qItems(it.qs);
  const context = () => "Транскрипт:\n" + segText(it.segs);
  const qz = quiz({ vid: it.id, sec: "h3", mode, items, per: 3, label: "Hören Teil 3", context, ...ctx });
  return h("div", { class: "stack" }, audioBlock("Nummer 32–35" + (it.topic ? " · " + it.topic : ""), it.segs, mode), h("div", { class: "qs" }, items.map(q => qz.el(q.key))), qz.footer);
}
function rH4(it, mode, ctx) {
  const items = it.msgs.map(m => ({ key: String(m.n), n: m.n, kind: "mc", text: m.q.text, opts: m.q.opts, ans: m.q.ans }));
  const context = (q) => "Сообщение на автоответчике:\n" + it.msgs.find(m => m.n === q.n).text;
  const qz = quiz({ vid: it.id, sec: "h4", mode, items, per: 3, label: "Hören Teil 4", context, ...ctx });
  return h("div", { class: "stack" }, it.msgs.map(m => h("div", { class: "block card" }, audioBlock(`Nummer ${m.n}`, [{ who: "Anrufer" + (m.g === "f" ? "in" : ""), t: m.text, g: m.g }], mode),
    qz.el(String(m.n)))), qz.footer);
}

/* ---------- writing: Beschwerde-Antwort and Forumsbeitrag ---------- */
const REDEMITTEL = {
  beschwerde: [
    { h: "Начало и извинение", items: ["Sehr geehrte Frau …,", "Sehr geehrter Herr …,", "vielen Dank für Ihre E-Mail vom … und Ihre offene Rückmeldung.", "Wir bedauern die entstandenen Unannehmlichkeiten sehr und bitten Sie vielmals um Entschuldigung.", "Es tut uns sehr leid, dass Sie mit unserem Service nicht zufrieden waren."] },
    { h: "Причина", items: ["Ich habe mit unseren Mitarbeitern gesprochen und herausgefunden, dass …", "Der Grund dafür war, dass …", "Leider ist es aufgrund von … zu einer Verzögerung gekommen.", "Wie sich herausgestellt hat, …"] },
    { h: "Решение (поручения шефа)", items: ["Selbstverständlich werden wir …", "Ich möchte Ihnen versichern, dass so etwas nicht wieder vorkommen wird.", "Als Entschädigung bieten wir Ihnen einen Rabatt in Höhe von … % auf Ihre nächste Rechnung an.", "Wir würden uns freuen, wenn Sie uns noch bis … Zeit geben könnten.", "Alternativ können wir Ihnen ein ähnliches Modell anbieten, das wir auf Lager haben.", "Eine korrigierte Rechnung schicken wir Ihnen umgehend zu."] },
    { h: "Заключение", items: ["Wir hoffen, dass Sie mit dieser Lösung einverstanden sind.", "Wir freuen uns auf eine weitere gute Zusammenarbeit.", "Für Rückfragen stehe ich Ihnen gern zur Verfügung.", "Mit freundlichen Grüßen"] },
  ],
  forum: [
    { h: "Обращение и вступление", items: ["Liebe Kolleginnen und Kollegen,", "Hallo zusammen,", "habt ihr schon gehört, dass …", "viele von euch wissen wahrscheinlich schon, dass die Firma vorhat, … zu …", "ich möchte meine Meinung zu … mitteilen."] },
    { h: "Плюсы", items: ["Einerseits finde ich es gut, dass …", "Ein klarer Vorteil wäre, dass …", "Dafür spricht aus meiner Sicht, dass …", "Positiv ist außerdem, dass …"] },
    { h: "Минусы", items: ["Andererseits muss man auch bedenken, dass …", "Dagegen spricht allerdings, dass …", "Ein Nachteil ist, dass …", "Ich frage mich außerdem, ob …"] },
    { h: "Мнение и вывод", items: ["Meiner Meinung nach …", "Persönlich halte ich … für eine gute / keine gute Idee.", "Ich würde vorschlagen, dass …", "Abschließend möchte ich sagen, dass …", "Wie seht ihr das?", "Viele Grüße"] },
  ],
};
const WMAX = { beschwerde: { inhalt: 7, sprache: 12 }, forum: { inhalt: 14, sprache: 15 } };

// the writing field looks like the Antwortbogen: page 5 (21, an e-mail form with An / Cc / Betreff) and page 7 (58, lined paper)
function writeSheet(t, ta) {
  if (t.kind !== "beschwerde" && t.kind !== "forum") return ta;
  const mailHead = t.kind === "beschwerde" ? h("div", { class: "ws-mail" },
    h("span", { class: "ws-send", "aria-hidden": "true" }, "➤", h("small", null, "Senden")),
    h("div", { class: "ws-fields" }, ["An…", "Cc…", "Betreff"].map(l => h("label", null, h("span", null, l), h("input", { class: "ws-in", autocomplete: "off", "aria-label": l }))))) : null;
  return h("div", { class: "ws" },
    h("div", { class: "ws-hd" }, h("span", { class: "ws-ico" }, icon("pencil")), h("b", null, t.kind === "beschwerde" ? "21  Lesen und Schreiben" : "58  Schreiben"), h("span", { class: "ws-nur" }, "Nur für die Bewertung")),
    h("div", { class: "ws-body" }, h("div", { class: "ws-paper" }, mailHead, ta), h("div", { class: "ws-side" })));
}
function writeTask(t) {
  const drafts = store.get("drafts", {});
  const ta = h("textarea", { class: "letter", id: "ta-" + t.id, spellcheck: "false", placeholder: t.kind === "forum" ? "Liebe Kolleginnen und Kollegen,\n…" : t.kind === "praesentation" ? "Guten Tag, ich möchte Ihnen heute … vorstellen.\n…" : "Sehr geehrte Frau …,\n…" });
  ta.value = drafts[t.id] || "";
  const counter = h("span", { class: "small mono" });
  const upd = () => { const n = words(ta.value); counter.textContent = `${n} слов` + (n < t.target[0] ? ` · цель ${t.target[0]}–${t.target[1]}` : n > t.target[1] + 40 ? " · многовато" : " ✓"); const d = store.get("drafts", {}); d[t.id] = ta.value; store.set("drafts", d); };
  ta.addEventListener("input", upd); upd();
  let sec = t.minutes * 60, iv = null;
  const tl = h("span", { class: "timer" }, `${t.minutes}:00`);
  const fmt = () => tl.textContent = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  const tb = h("button", { class: "btn small" }, `⏱ ${t.minutes} мин`);
  tb.onclick = () => { if (iv) { clearInterval(iv); iv = null; tb.textContent = "⏱ Дальше"; return; } tb.textContent = "❚❚ Пауза"; iv = setInterval(() => { if (!document.body.contains(tl)) { clearInterval(iv); return; } sec--; fmt(); if (sec <= 0) { clearInterval(iv); iv = null; tl.textContent = "Время вышло"; tb.textContent = "⏱ Заново"; sec = t.minutes * 60; } }, 1000); };
  const insert = (s) => { const c = s.replace(/…/g, "").replace(/\s+/g, " ").trim(); const p = ta.selectionStart ?? ta.value.length; ta.value = ta.value.slice(0, p) + c + " " + ta.value.slice(ta.selectionEnd ?? p); ta.focus(); ta.selectionStart = ta.selectionEnd = p + c.length + 1; upd(); };
  const rm = h("div", { class: "stack" }, h("div", { class: "eyebrow" }, "Redemittel · нажмите, чтобы вставить"), REDEMITTEL[t.kind].map((g, i) => h("details", { class: "rm", open: i < 2 }, h("summary", null, g.h), h("ul", null, g.items.map(s => h("li", { onclick: () => insert(s) }, s))))));
  const fb = h("div", { class: "stack" });
  const prev = store.get("feedback", {})[t.id];
  if (prev && prev.data) fb.append(renderFeedback(prev.data, prev.text, t.kind));
  let ctl = null;
  const stopBtn = h("button", { class: "btn", hidden: true, onclick: () => ctl && ctl.abort() }, "Остановить");
  const checkBtn = aiButton("Проверить письмо", async () => {
    const text = ta.value.trim();
    if (words(text) < 40) { fb.replaceChildren(h("div", { class: "note" }, "Напишите хотя бы 40 слов, тогда проверка будет полезной.")); return; }
    checkBtn.disabled = true; stopBtn.hidden = false; ctl = new AbortController();
    fb.replaceChildren(thinking("ИИ проверяет письмо по критериям экзамена… обычно 30–90 секунд"));
    try {
      const d = await askJSON(feedbackPrompt(t, text), { signal: ctl.signal });
      if (!d || !d.inhalt || !d.sprache) throw { code: "invalid_json" };
      const f = store.get("feedback", {}); f[t.id] = { data: d, text }; store.set("feedback", f);
      const mx = WMAX[t.kind], pts = Math.min(+d.inhalt.punkte || 0, mx.inhalt) + Math.min(+d.sprache.punkte || 0, mx.sprache);
      saveRes(t.id, pts, mx.inhalt + mx.sprache);
      fb.replaceChildren(renderFeedback(d, text, t.kind));
      t.onDone && t.onDone(pts, mx.inhalt + mx.sprache);
    } catch (e) { fb.replaceChildren(h("div", { class: "note" }, errText(e))); }
    checkBtn.disabled = false; stopBtn.hidden = true;
  });
  const models = h("div", { class: "stack", hidden: true }, t.modelNote ? h("p", { class: "small muted", style: "margin:0" }, t.modelNote) : null, (t.models || []).map(m => h("div", { class: "letterview" }, m)));
  const modelBtn = t.models && t.models.length ? h("button", { class: "btn" }, "Показать образец") : null;
  if (modelBtn) modelBtn.onclick = () => { models.hidden = !models.hidden; modelBtn.textContent = models.hidden ? "Показать образец" : "Скрыть образец"; };
  const genBox = h("div", { class: "letterview", hidden: true });
  const genBtn = t.gen ? aiButton("Пример от ИИ", async () => {
    genBox.hidden = false; genBox.replaceChildren(thinking("ИИ пишет пример…")); genBtn.disabled = true;
    try { await askText(t.gen, { cache: false, onText: ({ text }) => { genBox.textContent = text; } }); } catch (e) { genBox.textContent = e.text || errText(e); }
    genBtn.disabled = false;
  }, "") : null;
  const skip = t.onSkip ? h("button", { class: "btn ghost", onclick: t.onSkip }, "Пропустить письмо") : null;
  return h("div", { class: "stack" },
    h("div", { class: "card stack" }, h("div", { class: "spread" }, h("h2", null, t.title), h("div", { class: "row" }, tb, tl)), t.taskEl),
    h("div", { class: "two" },
      h("div", { class: "stack" }, writeSheet(t, ta), h("div", { class: "spread" }, counter, h("div", { class: "row" }, checkBtn, stopBtn, modelBtn, genBtn, skip)),
        noAiNote("Проверка письма через ИИ недоступна в этом просмотре. Сравните текст с образцом и пройдитесь по Redemittel."), models, genBox),
      h("div", { class: "card sticky" }, rm)),
    fb);
}
function feedbackPrompt(t, text) {
  const mx = WMAX[t.kind];
  const task = t.kind === "praesentation" ? PRAES_TASK : t.kind === "beschwerde"
    ? `Aufgabe 21 (DTB B2 Beruf): Antwort auf eine Kundenbeschwerde im Auftrag der Vorgesetzten. Bewertet wird vor allem, ob ALLE Aufträge aus der Notiz der Vorgesetzten umgesetzt sind, ob nichts Unpassendes versprochen wird (z. B. kein Rabatt, wenn er nicht erwähnt ist), ob das Register formell und höflich ist und ob die Textsorte stimmt (Anrede, Bezug, Entschuldigung, Erklärung, Lösung, Schluss, Gruß).\n\n${t.context}`
    : `Aufgabe 58 (DTB B2 Beruf): Forumsbeitrag im Intranet zu folgender Situation. Erwartet werden: kurze Einleitung zum Thema, Vorteile, Nachteile, eigene begründete Meinung, passender Schluss; einheitliches Register (du/ihr oder Sie, nicht gemischt); ca. 150 Wörter.\n\n${t.context}`;
  return `Du bist ein erfahrener, strenger, aber ermutigender Prüfer für telc Deutsch B2 Beruf (DTB). Bewerte den Text eines Lernenden.

${task}

Text des Lernenden:
"""
${text}
"""

Vergib Punkte:
- inhalt (Aufgabenerfüllung, alle Punkte behandelt): 0 bis ${mx.inhalt}
- sprache (Kommunikative Gestaltung, Wortschatz, Grammatik, Rechtschreibung): 0 bis ${mx.sprache}

Antworte NUR mit JSON in genau diesem Format:
{"inhalt":{"punkte":0,"kommentar":"..."},"sprache":{"punkte":0,"kommentar":"..."},
"leitpunkte":[{"punkt":"...","status":"ja","kommentar":"..."}],
"fehler":[{"original":"...","korrektur":"...","erklaerung":"...","typ":"Grammatik"}],
"niveau":{"stufe":"B1","kommentar":"..."},
"satzbau":[{"original":"...","besser":"...","warum":"..."}],
"verbesserter_text":"...","fazit":"...","tipps":["..."]}

Regeln:
- Alle Kommentare, Erklärungen, das Fazit und die Tipps auf ${aiLang() === "de" ? "Deutsch (einfach und klar, ohne Übersetzungen in andere Sprachen)" : LANG_NAME[aiLang()] + " (Sprache der Benutzeroberfläche)"}.
- "leitpunkte": ${t.kind === "beschwerde" ? "jeder einzelne Auftrag aus der Notiz der Vorgesetzten als eigener Punkt (auf Deutsch kurz benannt)" : t.kind === "praesentation" ? "Einleitung mit Gliederung, jeder Stichpunkt des Themas, eigene Meinung, Schluss" : "Einleitung, Vorteile, Nachteile, eigene Meinung, Schluss"}; "status" ist "ja", "teilweise" oder "nein".
- "original" muss wörtlich und exakt im Text des Lernenden vorkommen (1–6 Wörter), "korrektur" ist die korrigierte Form desselben Ausschnitts.
- "typ" ist eines von: Grammatik, Wortschatz, Rechtschreibung, Zeichensetzung, Stil.
- Alle echten Fehler auflisten (höchstens 30), keine Geschmacksfragen.
- "niveau": ehrliche Einschätzung, auf welchem GER-Niveau der Text insgesamt geschrieben ist (A2, B1, B2 oder C1) und warum: Satzbau (Nebensätze, Konnektoren, Satzvielfalt), Wortschatz, Register, Textaufbau. Kommentar ${aufLang()}.
- "satzbau": 3–6 Sätze aus dem Text, die grammatisch richtig, aber zu einfach für B2 sind (nur Hauptsätze, Wiederholungen, einfache Wörter). "original" wörtlich aus dem Text, "besser" eine elegantere B2-Formulierung (z. B. Nebensatz, Passiv, Nominalisierung, Konnektor), "warum" kurz ${aufLang()}.
- "verbesserter_text": vollständige korrigierte Fassung auf B2-Niveau, nah am Original, mit Absätzen (\\n).
- 3–5 konkrete Tipps mit deutschen Beispielformulierungen.`;
}
function renderFeedback(d, text, kind) {
  const mx = WMAX[kind];
  const pi = Math.min(+d.inhalt.punkte || 0, mx.inhalt), ps = Math.min(+d.sprache.punkte || 0, mx.sprache);
  const total = pi + ps, max = mx.inhalt + mx.sprache, pct = total / max;
  const errs = (d.fehler || []).filter(e => e && e.original);
  const view = h("div", { class: "letterview" });
  const used = [], spans = [], rows = [];
  errs.forEach((e, i) => { let from = 0, at; while ((at = text.indexOf(e.original, from)) >= 0) { if (!used.some(u => at < u[1] && at + e.original.length > u[0])) { used.push([at, at + e.original.length, i]); break; } from = at + 1; } });
  used.sort((a, b) => a[0] - b[0]);
  let p = 0;
  used.forEach(([s, e2, i]) => { view.append(text.slice(p, s)); const m = h("mark", { title: errs[i].korrektur, onclick: () => rows[i] && rows[i].scrollIntoView({ behavior: "smooth", block: "center" }) }, text.slice(s, e2)); spans[i] = m; view.append(m); p = e2; });
  view.append(text.slice(p));
  const st = { ja: "ok", teilweise: "warn", nein: "bad" }, stRu = { ja: "выполнено", teilweise: "частично", nein: "нет" };
  const corrected = h("div", { class: "letterview", hidden: true }, d.verbesserter_text || "");
  const cbtn = h("button", { class: "btn" }, "Показать исправленный текст");
  cbtn.onclick = () => { corrected.hidden = !corrected.hidden; cbtn.textContent = corrected.hidden ? "Показать исправленный текст" : "Скрыть исправленный текст"; };
  return h("div", { class: "card stack" },
    h("div", { class: "spread" }, h("h2", null, "Оценка ИИ"), h("span", { class: "ai" }, "ориентировочно")),
    h("div", { class: "result" }, h("span", { class: "big" }, `${total}/${max}`), h("span", { class: "chip " + (pct >= .6 ? "ok" : pct >= .4 ? "warn" : "bad") }, pct >= .6 ? "на уровне сдачи" : "пока ниже 60%"), d.fazit ? h("span", { style: "flex:1;min-width:220px" }, d.fazit) : null),
    h("div", { class: "crit" },
      h("div", null, h("span", { class: "small muted" }, "Содержание (все пункты)"), h("b", { class: "mono" }, `${pi} / ${mx.inhalt}`), h("span", { class: "small" }, d.inhalt.kommentar)),
      h("div", null, h("span", { class: "small muted" }, "Язык и оформление"), h("b", { class: "mono" }, `${ps} / ${mx.sprache}`), h("span", { class: "small" }, d.sprache.kommentar))),
    d.leitpunkte && d.leitpunkte.length ? h("div", { class: "stack" }, h("div", { class: "eyebrow" }, kind === "beschwerde" ? "Поручения шефа" : "Структура"), h("div", { class: "errlist" }, d.leitpunkte.map(l => h("div", { class: "err" }, h("div", { class: "row" }, h("span", { class: "chip " + (st[l.status] || "") }, stRu[l.status] || l.status), h("b", null, l.punkt)), h("span", { class: "small" }, l.kommentar))))) : null,
    d.niveau && d.niveau.stufe ? h("div", { class: "row", style: "align-items:flex-start" }, h("span", { class: "chip " + (/B2|C1/.test(d.niveau.stufe) ? "ok" : "warn") }, "Уровень текста: " + d.niveau.stufe), h("span", { class: "small", style: "flex:1;min-width:200px" }, d.niveau.kommentar || "")) : null,
    h("div", { class: "stack" }, h("div", { class: "eyebrow" }, `Ваш текст · ошибок: ${errs.length}`), view),
    errs.length ? h("div", { class: "errlist" }, errs.map((e, i) => (rows[i] = h("div", { class: "err", onmouseenter: () => spans[i] && spans[i].classList.add("on"), onmouseleave: () => spans[i] && spans[i].classList.remove("on") },
      h("div", { class: "row" }, h("span", { class: "chip" }, e.typ || "Fehler"), h("span", null, h("s", null, e.original), "  →  ", h("ins", null, e.korrektur))), h("span", { class: "small muted" }, e.erklaerung))))) : null,
    d.satzbau && d.satzbau.length ? h("div", { class: "stack" }, h("div", { class: "eyebrow" }, "Как сказать на уровне B2"), h("div", { class: "errlist" }, d.satzbau.map(s => h("div", { class: "err" }, h("span", null, h("s", null, s.original), "  →  ", h("ins", null, s.besser)), h("span", { class: "small muted" }, s.warum))))) : null,
    d.tipps && d.tipps.length ? h("div", null, h("div", { class: "eyebrow" }, "Советы"), h("ul", { style: "margin:6px 0 0;padding-left:20px" }, d.tipps.map(x => h("li", null, x)))) : null,
    h("div", { class: "row" }, cbtn), corrected);
}

function rForum(it, mode, ctx) {
  return writeTask({ id: "w-F" + it.n, kind: "forum", title: "Aufgabe 58 · " + it.title, minutes: 30, target: [130, 190],
    taskEl: h("div", { class: "stack" }, h("p", { class: "doc", style: "margin:0;padding:14px 16px" }, it.desc || it.title),
      h("p", { class: "small muted", style: "margin:0" }, "Напишите сообщение коллегам на форуме: что планируется, плюсы, минусы, ваше мнение с обоснованием. Выберите один стиль: ihr/euch или Sie, и не смешивайте их.")),
    context: `Thema: ${it.title}\nSituation: ${it.desc || it.title}`,
    gen: `Schreibe einen Musterbeitrag (ca. 150 Wörter, Niveau B2) für ein firmeninternes Forum zum Thema "${it.title}": ${it.desc || ""}\nAufbau: Anrede (Liebe Kolleginnen und Kollegen,), Einleitung, Vorteile, Nachteile, eigene Meinung mit Begründung, Schluss, Gruß. Einheitlich ihr/euch. Nur der Text, ohne Überschrift, ohne Markdown. ${glossaryDe("5 nützliche Wendungen")}`,
    models: [DB.F_MODEL], modelNote: null,
    onDone: ctx.onWriteDone, onSkip: ctx.onSkip });
}

/* ---------- Telefonnotiz: Antwortbogen page 6 (41 Grund für den Anruf, 42 Namen, 43 Kontakt, 44 Weitere Informationen, 45 Zu erledigen) ---------- */
const GRUND = [["a", "Angebot"], ["b", "Bestellung/Buchung"], ["c", "Beschwerde"]];
const grundOf = (type) => /beschwerde/i.test(type) ? "c" : /bestell|buchung/i.test(type) ? "b" : "a";
function rNotiz(it, mode, ctx) {
  const segs = [{ who: it.who, t: it.text, g: it.g }];
  const tr = transcript(segs, mode === "learn");
  const pl = makePlayer(segs, { title: "Telefonische Mitteilung", once: mode === "exam", onLine: (i) => tr.highlight(i) });
  const line = (id, extra) => h("input", { class: "tn-in", id, autocomplete: "off", ...extra });
  const grund = GRUND.map(([v, l]) => h("label", { class: "tn-opt" }, h("small", null, v), h("input", { type: "radio", name: "g-" + it.id, value: v }), h("span", null, l)));
  const f = { name: line(`n-${it.id}-name`), firma: line(`n-${it.id}-firma`), phone: line(`n-${it.id}-phone`, { inputmode: "tel" }),
    info: [0, 1, 2, 3, 4].map(i => line(`n-${it.id}-info${i}`)), todo: [0, 1].map(i => line(`n-${it.id}-todo${i}`)) };
  const pick = () => { const r = grund.map(l => l.querySelector("input")).find(x => x.checked); return r ? r.value : null; };
  if (mode === "learn") {
    grund.forEach(l => { const x = l.querySelector("input"); x.checked = x.value === grundOf(it.type); });
    f.name.value = it.name; f.phone.value = it.phone; it.info.slice(0, 5).forEach((i, n) => { f.info[n].value = i.t; }); f.todo[0].value = it.todo;
  }
  const mk = {}; const markEl = (k) => (mk[k] = h("span", { class: "tn-mark", title: "Nur für die Bewertung" }, h("i", null, "+"), h("i", null, "–")));
  const setMark = (k, ok) => { const [p, m] = mk[k].children; p.classList.toggle("on", ok); m.classList.toggle("on", !ok); };
  const has = (txt, kw) => kw.every(g => g.split("|").some(a => norm(txt).includes(norm(a))));
  const out = h("div", { class: "stack" });
  const checkBtn = h("button", { class: "btn primary", onclick: () => {
    const info = f.info.map(x => x.value).join("\n"), todo = f.todo.map(x => x.value).join(" ");
    const g = grundOf(it.type);
    const res = [
      { l: "Grund für den Anruf: " + GRUND.find(x => x[0] === g).join(" "), ok: pick() === g, n: 41, k: "g" },
      { l: "Name: " + it.name, ok: norm(f.name.value).includes(norm(it.name)), n: 42, k: "name" },
      { l: "Telefon: " + it.phone, ok: f.phone.value.replace(/\D/g, "") === it.phone.replace(/\D/g, ""), n: 43, k: "phone" },
      ...it.info.map(i => ({ l: i.t, ok: has(info, i.kw), n: 44, k: "info" })),
      { l: "Zu erledigen: " + it.todo, ok: has(todo + " " + info, it.todo_kw), n: 45, k: "todo" },
    ];
    const infos = res.filter(r => r.k === "info");
    ["g", "name", "phone", "todo"].forEach(k => setMark(k, res.find(r => r.k === k).ok));
    setMark("info", infos.filter(r => r.ok).length * 2 >= infos.length);
    // official points: 41 = 3 (Hören); 42 = 0.5, 43 = 0.5, 44 = 4, 45 = 1 (Schreiben)
    const ok = (k) => res.find(r => r.k === k).ok;
    const pts = { h: ok("g") ? 3 : 0, s: (ok("name") ? .5 : 0) + (ok("phone") ? .5 : 0) + 4 * infos.filter(r => r.ok).length / Math.max(infos.length, 1) + (ok("todo") ? 1 : 0) };
    pts.s = Math.round(pts.s * 10) / 10;
    const sc = res.filter(r => r.ok).length;
    saveRes(it.id, sc, res.length);
    trackItems(res.map((r, i) => ({ key: `${it.id}:${i}`, n: r.n, ok: r.ok, vid: it.id, sec: "n" })));
    const pct = sc / res.length;
    out.replaceChildren(h("div", { class: "result" }, h("span", { class: "big" }, `${sc}/${res.length}`), h("span", { class: "chip " + (pct >= .6 ? "ok" : pct >= .4 ? "warn" : "bad") }, `Hören ${pts.h}/3 · Schreiben ${pts.s}/6`),
      h("span", { class: "small muted", style: "flex:1;min-width:200px" }, "Проверка по ключевым словам и цифрам. Формулировка может быть своей, главное — смысл и числа."),
      h("button", { class: "btn", onclick: () => render() }, "↻ Заново")),
      h("div", { class: "card stack" }, h("div", { class: "eyebrow" }, "Правильная записка · " + it.type), res.map(r => h("div", { class: "check " + (r.ok ? "ok" : "no") }, h("span", { class: "m" }, r.ok ? "✓" : "✗"), h("span", null, `${r.n} · ${r.l}`)))),
      ...(mode === "exam" ? [h("div", { class: "row" }, tr.btn), tr.box] : []));
    checkBtn.disabled = true;
    ctx.onDone && ctx.onDone(sc, res.length, pts);
  } }, "Проверить записку");
  const row = (n, label, sub, field, k) => h("div", { class: "tn-row" }, h("div", { class: "tn-l" }, h("b", null, n), h("span", null, label, sub ? h("small", null, sub) : null)), h("div", { class: "tn-f" }, field), k ? markEl(k) : h("span"));
  const form = h("div", { class: "tn" },
    h("div", { class: "tn-hd" }, h("span", { class: "tn-ico" }, icon("pencil")), h("div", null, h("b", null, "Hören und Schreiben"), h("div", { class: "tn-t" }, "Telefonnotiz")), h("span", { class: "tn-nur" }, "Nur für die Bewertung")),
    row("41", "Grund für den Anruf", null, h("div", { class: "tn-opts" }, grund), "g"),
    row("42", "Namen", null, h("div", { class: "tn-grid" }, h("label", { for: f.name.id }, "Frau/Herr"), f.name, h("label", { for: f.firma.id }, "Firma"), f.firma), "name"),
    row("43", "Kontakt", "Telefon", f.phone, "phone"),
    row("44", "Weitere Informationen", null, h("div", { class: "tn-lines" }, f.info.map(x => h("div", { class: "tn-li" }, x))), "info"),
    row("45", "Zu erledigen", null, h("div", { class: "tn-lines" }, f.todo.map((x, i) => h("div", { class: "tn-li" + (i ? " nob" : "") }, x))), "todo"));
  return h("div", { class: "stack" },
    srcNote(it.src),
    pl, mode === "exam" ? null : h("div", { class: "row" }, tr.btn), tr.box,
    form,
    h("div", { class: "row" }, checkBtn), out);
}

/* ---------- Sprechen: Teil 1 (Präsentation), Teil 2 (Smalltalk), Teil 3 (gemeinsam eine Lösung finden) ---------- */
const SP_REDE = {
  sp1: [
    { h: "Начало", items: ["Ich möchte Ihnen heute … vorstellen.", "In meiner Präsentation geht es um …", "Ich habe meine Präsentation in drei Teile gegliedert: …", "Zuerst … , dann … und zum Schluss …"] },
    { h: "Основная часть", items: ["Zunächst möchte ich auf … eingehen.", "Ein wichtiger Aspekt ist …", "Das zeigt sich zum Beispiel darin, dass …", "Außerdem …", "Ein klarer Vorteil / Nachteil ist, dass …"] },
    { h: "Мнение и опыт", items: ["Aus meiner Erfahrung …", "Meiner Meinung nach …", "Persönlich finde ich …, weil …"] },
    { h: "Заключение", items: ["Zum Schluss möchte ich zusammenfassen: …", "Abschließend lässt sich sagen, dass …", "Vielen Dank für Ihre Aufmerksamkeit. Haben Sie noch Fragen?"] },
    { h: "Ответы на вопросы", items: ["Das ist eine gute Frage. …", "Dazu kann ich sagen, dass …", "Wenn ich Sie richtig verstehe, möchten Sie wissen, …", "Leider weiß ich das nicht genau, aber …"] },
  ],
  sp2: [
    { h: "Начать и поддержать разговор", items: ["Na, wie war dein Wochenende?", "Und bei dir? Wie war das?", "Wirklich? Erzähl mal!", "Das klingt interessant.", "Das kenne ich auch."] },
    { h: "Рассказать о себе", items: ["Ich habe …, weil …", "Mir gefällt besonders, dass …", "Früher habe ich …, heute …", "Ich würde gern einmal …"] },
    { h: "Задать встречный вопрос", items: ["Und was machst du …?", "Wie siehst du das?", "Hast du schon mal …?", "Was kannst du mir empfehlen?"] },
    { h: "Закончить разговор", items: ["Das war ein nettes Gespräch.", "Ich muss leider weiter, die Arbeit ruft.", "Wir sehen uns später!"] },
  ],
  sp3: [
    { h: "Предложить", items: ["Ich schlage vor, dass wir …", "Wie wäre es, wenn wir …?", "Wir könnten doch …", "Was hältst du davon, wenn …?", "Als Erstes sollten wir …"] },
    { h: "Согласиться / возразить", items: ["Das ist eine gute Idee.", "Da bin ich ganz deiner Meinung.", "Ich bin mir nicht sicher, ob das funktioniert, weil …", "Das ist zwar gut, aber …"] },
    { h: "Договориться", items: ["Dann machen wir es so: …", "Also, zuerst … und danach …", "Wer übernimmt …?", "Sind wir uns einig?"] },
    { h: "Краткосрочно и долгосрочно", items: ["Kurzfristig könnten wir …", "Langfristig sollten wir …", "Damit so etwas nicht wieder passiert, …"] },
  ],
};
REDEMITTEL.praesentation = SP_REDE.sp1;
WMAX.praesentation = { inhalt: 6, sprache: 6 };
const PRAES_TASK = `Sprechen Teil 1 (DTB B2 Beruf): Präsentation zu einem Thema, ca. 2 Minuten (etwa 180–250 Wörter), danach 2 Minuten Fragen. Der Text wurde hier schriftlich vorbereitet. Erwartet werden: Einleitung mit Gliederung, Hauptteil mit allen Stichpunkten und konkreten Beispielen, eigene Meinung, Schluss (Zusammenfassung und Dank), einheitlicher, gut sprechbarer Stil (keine zu langen Schachtelsätze). Bewertet werden Inhalt und Sprache.`;

const PRAXIS = { sp1: "Teil 1", sp2: "Teil 2", sp3: "Teil 3" };
// model dialogue / monologue with audio (neural recording when available) and a readable transcript
function modelBlock(segs, title, hint) {
  const box = h("div", { class: "stack", hidden: true }, hint ? h("p", { class: "small muted", style: "margin:0" }, hint) : null, audioBlock(title, segs, "learn"));
  const btn = h("button", { class: "btn" }, "Показать образец");
  btn.onclick = () => { box.hidden = !box.hidden; btn.textContent = box.hidden ? "Показать образец" : "Скрыть образец"; };
  return { btn, box };
}

// generic practice chat: ИИ plays the partner / examiner, then rates the learner's contributions
function chatPartner(cfg) {
  const turns = [];
  const chat = h("div", { class: "chat" });
  const box = h("textarea", { class: "in", id: "sp-in-" + cfg.id, rows: 3, placeholder: "Schreiben Sie Ihre Antwort auf Deutsch…" });
  const fb = h("div", { class: "stack" });
  const autoSpeak = h("input", { type: "checkbox", id: "sp-voice-" + cfg.id, checked: store.get("spVoice", true) });
  autoSpeak.onchange = () => store.set("spVoice", autoSpeak.checked);
  let ctl = null, first = null;
  const bubble = (who, text) => { const m = h("div", { class: "msg " + (who === "me" ? "me" : "cl") }, h("span", { class: "who" }, who === "me" ? "Вы" : cfg.partnerName), h("span", null, text)); chat.append(m); return m.lastChild; };
  const say = (t) => { if (autoSpeak.checked) speakText(t, "f"); };
  async function partner() {
    const b = bubble("cl", ""); b.replaceChildren(thinking("…"));
    sendBtn.disabled = true; ctl = new AbortController();
    try {
      const { text } = await askText([{ role: "user", content: first }, ...turns], { cache: false, signal: ctl.signal, modelTier: "quick", onText: ({ text }) => { b.textContent = text; } });
      turns.push({ role: "assistant", content: text }); say(text);
    } catch (e) { b.textContent = e.text || errText(e); }
    sendBtn.disabled = false;
  }
  const startBtn = aiButton(cfg.startLabel, () => { first = cfg.rules() + "\n" + cfg.start; startBtn.hidden = true; partner(); });
  const sendBtn = h("button", { class: "btn primary", onclick: () => { const v = box.value.trim(); if (!v || !first) return; bubble("me", v); turns.push({ role: "user", content: v }); box.value = ""; partner(); } }, "Отправить");
  box.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sendBtn.click(); });
  const rateBtn = aiButton("Оценить мой разговор", async () => {
    const mine = turns.filter(t => t.role === "user").map(t => t.content);
    if (mine.length < 2) { fb.replaceChildren(h("div", { class: "note" }, "Сначала ответьте хотя бы 2–3 раза.")); return; }
    fb.replaceChildren(thinking("ИИ оценивает разговор…")); rateBtn.disabled = true;
    try {
      const d = await askJSON(`${cfg.rateIntro}\nGesprächsverlauf (A = ich, der Lernende; B = Gesprächspartner/in):\n${turns.map(t => (t.role === "user" ? "A: " : "B: ") + t.content).join("\n")}\n\nBewerte nur die Beiträge von A. Antworte NUR mit JSON: {"punkte":0,"max":${cfg.max},"fazit":"...","niveau":{"stufe":"B1","kommentar":"..."},"staerken":["..."],"fehler":[{"original":"...","korrektur":"...","erklaerung":"..."}],"satzbau":[{"original":"...","besser":"...","warum":"..."}],"redemittel":["..."]}\nRegeln: Kommentare, Fazit, Erklärungen und Stärken ${aufLang()}. "original" wörtlich aus A. "niveau" = geschätztes GER-Niveau von A (A2, B1, B2, C1). "satzbau" = 2–4 richtige, aber zu einfache Sätze von A mit besserer B2-Formulierung. "redemittel" = 3–5 nützliche deutsche Wendungen für dieses Thema.`);
      fb.replaceChildren(h("div", { class: "card stack" }, h("div", { class: "result" }, h("span", { class: "big" }, `${d.punkte}/${d.max || cfg.max}`), h("span", { style: "flex:1;min-width:200px" }, d.fazit || "")),
        d.niveau && d.niveau.stufe ? h("div", { class: "row", style: "align-items:flex-start" }, h("span", { class: "chip " + (/B2|C1/.test(d.niveau.stufe) ? "ok" : "warn") }, "Уровень: " + d.niveau.stufe), h("span", { class: "small", style: "flex:1;min-width:200px" }, d.niveau.kommentar || "")) : null,
        d.staerken && d.staerken.length ? h("div", null, h("div", { class: "eyebrow" }, "Хорошо получилось"), h("ul", null, d.staerken.map(s => h("li", null, s)))) : null,
        d.fehler && d.fehler.length ? h("div", { class: "errlist" }, d.fehler.map(e => h("div", { class: "err" }, h("span", null, h("s", null, e.original), "  →  ", h("ins", null, e.korrektur)), h("span", { class: "small muted" }, e.erklaerung)))) : null,
        d.satzbau && d.satzbau.length ? h("div", { class: "stack" }, h("div", { class: "eyebrow" }, "Как сказать на уровне B2"), h("div", { class: "errlist" }, d.satzbau.map(s => h("div", { class: "err" }, h("span", null, h("s", null, s.original), "  →  ", h("ins", null, s.besser)), h("span", { class: "small muted" }, s.warum))))) : null,
        d.redemittel && d.redemittel.length ? h("div", null, h("div", { class: "eyebrow" }, "Полезные фразы"), h("ul", null, d.redemittel.map(s => h("li", null, s)))) : null));
      saveRes(cfg.id, +d.punkte || 0, +d.max || cfg.max);
    } catch (e) { fb.replaceChildren(h("div", { class: "note" }, errText(e))); }
    rateBtn.disabled = false;
  }, "");
  const el = h("div", { class: "card stack" }, h("div", { class: "spread" }, h("h3", null, cfg.title), h("label", { class: "row small", for: "sp-voice-" + cfg.id }, autoSpeak, "озвучивать ответы")),
    noAiNote("Разговор с ИИ здесь недоступен. Потренируйтесь вслух по пунктам и Redemittel и сравните с образцом."),
    startBtn, chat, h("div", { class: "stack", "data-ai": "", hidden: !SAMPLE }, box, h("div", { class: "row" }, sendBtn, rateBtn, h("span", { class: "small muted" }, "Ctrl+Enter — отправить"))), fb);
  return el;
}
const rmCard = (key) => h("div", { class: "card sticky stack" }, h("div", { class: "eyebrow" }, "Redemittel"), SP_REDE[key].map((g, i) => h("details", { class: "rm", open: i < 2 }, h("summary", null, g.h), h("ul", null, g.items.map(s => h("li", null, s))))));
const RULES_COMMON = "Antworte immer nur auf Deutsch, in 2–4 kurzen Sätzen, natürlich gesprochen auf B2-Niveau. Keine Korrekturen, keine Erklärungen, keine Aufzählungen, nur das Gespräch.";

// strip in the style of the "Aufgabenblätter" of the oral exam (pair exam, about 16 minutes, no preparation time)
const SP_HEAD = {
  sp1: [["Teil 1A", "Über ein Thema sprechen", "ca. 2 Minuten pro Person"], ["Teil 1B", "Fragen der Prüferin / des Prüfers beantworten", ""], ["Teil 1C", "Einen Aspekt aus dem Beitrag der Partnerin / des Partners erläutern", ""]],
  sp2: [["Teil 2", "Mit Kolleginnen und Kollegen sprechen", "ca. 3 Minuten"]],
  sp3: [["Teil 3", "Lösungswege diskutieren", "ca. 4 Minuten"]],
};
const spHead = (k) => h("div", { class: "sp-head" }, h("span", { class: "sp-ico" }, icon("talk")),
  h("div", null, h("div", { class: "sp-k" }, "Mündliche Prüfung · Sprechen · Paarprüfung, ca. 16 Minuten · keine Vorbereitungszeit"),
    SP_HEAD[k].map(([t, d, m]) => h("div", { class: "sp-p" }, h("b", null, t), " " + d, m ? h("span", null, ` (${m})`) : null))));
function rSprechen3(it) {
  const m = modelBlock(it.model, "Образец диалога", "A — это вы, B — ваш партнёр. Это один из возможных вариантов: берите структуру и фразы, но говорите своими словами.");
  const chat = chatPartner({
    id: it.id, title: "Разговор с партнёром (ИИ)", partnerName: "Партнёр (ИИ)", startLabel: "Начать разговор", max: 10,
    rules: () => `Wir üben die mündliche Prüfung telc DTB B2 Beruf, Teil 3 ("Gemeinsam eine Lösung finden"). Du bist meine Gesprächspartnerin, eine freundliche Kollegin. Situation: ${it.text}\nStichpunkte: ${it.points.join("; ")}\nRegeln: ${RULES_COMMON} Mach eigene konkrete Vorschläge, reagiere auf meine Ideen (zustimmen, nachfragen oder höflich widersprechen) und bringe das Gespräch Schritt für Schritt zu einer gemeinsamen Lösung, sodass alle Stichpunkte besprochen werden. Wenn wir uns einigen, bestätige das kurz.`,
    start: "Beginne du das Gespräch: Begrüße mich kurz, beschreibe das Problem in 2 Sätzen und frage mich, was wir tun sollen.",
    rateIntro: `Bewerte meine Beiträge in einem Übungsgespräch für telc DTB B2 Beruf, Sprechen Teil 3 (gemeinsam Lösungen finden, 10 Punkte). Situation: ${it.text}. Stichpunkte: ${it.points.join("; ")}. Kriterien: alle Stichpunkte behandelt, eigene Vorschläge, auf die Partnerin eingehen, Einigung erzielen, Sprache.`,
  });
  return h("div", { class: "stack" }, spHead("sp3"), h("div", { class: "two" },
    h("div", { class: "stack" },
      h("div", { class: "card stack" }, h("div", { class: "eyebrow" }, "Situation " + it.n), h("p", { class: "qt", style: "margin:0" }, it.text), h("div", { class: "eyebrow" }, "Diese Stichpunkte helfen Ihnen"), h("ul", { style: "margin:0;padding-left:20px" }, it.points.map(p => h("li", null, p))),
        h("div", { class: "row" }, m.btn)), m.box, chat),
    rmCard("sp3")));
}

function rSprechen2(it) {
  const m = modelBlock(it.model, "Образец разговора", "A — это вы, B — собеседник. Берите фразы и структуру, а ответы делайте про себя.");
  const chat = chatPartner({
    id: it.id, title: "Разговор с собеседником (ИИ)", partnerName: "Собеседник (ИИ)", startLabel: "Начать разговор", max: 8,
    rules: () => `Wir üben die mündliche Prüfung telc DTB B2 Beruf, Teil 2 (Smalltalk, ca. 3 Minuten, entspannte Alltagsunterhaltung unter Kollegen). Du bist mein Gesprächspartner / meine Gesprächspartnerin. Thema: ${it.title}. Situation: ${it.situation}\nMögliche Aspekte: ${it.points.join("; ")}\nRegeln: ${RULES_COMMON} Stelle immer wieder eine kurze Frage zu meiner Antwort, erzähle auch selbst etwas Kurzes über dich, bleib freundlich und locker.`,
    start: "Beginne du das Gespräch mit einem natürlichen Einstieg zum Thema.",
    rateIntro: `Bewerte meine Beiträge in einem Smalltalk-Übungsgespräch für telc DTB B2 Beruf, Sprechen Teil 2 (8 Punkte). Thema: ${it.title}. Kriterien: auf den Partner eingehen, Gespräch am Laufen halten, Fragen stellen, eigene Erfahrungen erzählen, Wortschatz und Grammatik.`,
  });
  return h("div", { class: "stack" }, spHead("sp2"), h("div", { class: "two" },
    h("div", { class: "stack" },
      h("div", { class: "card stack" }, h("div", { class: "eyebrow" }, "Thema " + it.n + " · " + it.title), h("p", { class: "qt", style: "margin:0" }, it.situation), h("ul", { style: "margin:0;padding-left:20px" }, it.points.map(p => h("li", null, p))),
        h("div", { class: "row" }, m.btn)), m.box, chat),
    rmCard("sp2")));
}

function rSprechen1(it, mode, ctx) {
  const m = modelBlock(it.model, "Образец презентации", "Пример структуры: приветствие и план, основная часть с примерами, мнение, заключение. Ваш текст должен быть про вас.");
  const write = writeTask({
    id: "w-" + it.id, kind: "praesentation", title: "Teil 1 · " + it.title, minutes: 6, target: [150, 260],
    taskEl: h("div", { class: "stack" }, h("p", { style: "margin:0" }, "Подготовьте выступление на ~2 минуты (150–260 слов) по теме и этим пунктам. Потом прочитайте его вслух, на экзамене вы говорите свободно. ИИ проверит текст, затем задаст вопросы, как экзаменатор."),
      h("ul", { style: "margin:0;padding-left:20px" }, it.points.map(p => h("li", null, p)))),
    context: `Thema: ${it.title}\nStichpunkte: ${it.points.join("; ")}`,
    models: [it.model.map(s => s.t).join("\n\n")], modelNote: "Один из возможных вариантов. Ниже можно ещё послушать его.", onDone: ctx && ctx.onWriteDone,
  });
  const ta = () => (document.getElementById("ta-w-" + it.id) || {}).value || "";
  const qa = chatPartner({
    id: it.id + "-q", title: "Вопросы экзаменатора (2 минуты)", partnerName: "Экзаменатор (ИИ)", startLabel: "Задать вопросы по моей презентации", max: 6,
    rules: () => `Wir üben die mündliche Prüfung telc DTB B2 Beruf, Teil 1: Der Prüfling hat eine Präsentation gehalten, danach stellt die Prüferin zwei bis drei Fragen. Du bist die freundliche Prüferin. Thema: ${it.title}. Text der Präsentation:\n"""\n${ta() || "(Der Prüfling hat keinen Text eingegeben; stelle allgemeine Fragen zum Thema.)"}\n"""\nRegeln: ${RULES_COMMON} Stelle genau eine Frage pro Nachricht, die sich auf die Präsentation bezieht, und reagiere kurz auf meine Antwort, bevor du die nächste Frage stellst. Nach drei Fragen bedanke dich und beende das Gespräch.`,
    start: "Stelle jetzt die erste Frage zur Präsentation.",
    rateIntro: `Bewerte meine Antworten auf die Fragen nach einer Präsentation (telc DTB B2 Beruf, Sprechen Teil 1, Thema: ${it.title}). Kriterien: Frage beantwortet, Begründung und Beispiele, flüssig und verständlich, Wortschatz und Grammatik.`,
  });
  const audio = h("div", { class: "stack" }, h("div", { class: "row" }, m.btn), m.box);
  return h("div", { class: "stack" }, spHead("sp1"), write, audio, qa);
}

/* ---------- «Учить наизусть»: all texts to learn in one place ---------- */
const SRC_FILE = () => null;
const SRC_CLAUDE = () => null;

function copyBtn(getText) {
  const b = h("button", { class: "btn small" }, "Копировать");
  b.onclick = () => { try { navigator.clipboard.writeText(getText()); b.textContent = "Скопировано"; setTimeout(() => { b.textContent = "Копировать"; }, 1400); } catch (e) { b.textContent = "Не вышло"; } };
  return b;
}
function learnText(title, text, opts) {
  const o = opts || {};
  const segs = [{ who: "", t: text.replace(/\s*\n+\s*/g, " "), g: o.g || "f" }];
  return h("div", { class: "stack learnbox" },
    h("div", { class: "letterview" }, text),
    h("div", { class: "row" }, copyBtn(() => text), o.noAudio ? null : makePlayer(segs, { title })));
}
function learnDialog(title, segs) {
  const text = segs.map(s => (s.who ? s.who + ": " : "") + s.t).join("\n");
  return h("div", { class: "stack learnbox" },
    h("div", { class: "letterview" }, text),
    h("div", { class: "row" }, copyBtn(() => text)),
    audioBlock(title, segs, "learn"));
}
const acc = (summary, chips, ...body) => h("details", { class: "card learnacc" }, h("summary", null, h("span", { class: "grow" }, summary), chips || null), h("div", { class: "stack", style: "margin-top:12px" }, body));
const rmList = (arr, open) => arr.map((g, i) => h("details", { class: "rm", open: i < open }, h("summary", null, g.h), h("ul", null, g.items.map(s => h("li", null, s)))));

function viewLearn() {
  const secs = [];
  const sec = (id, title, lead, ...kids) => { secs.push([id, title]); return h("section", { class: "stack", id: "learn-" + id }, h("h2", null, title), lead ? h("p", { class: "lead", style: "margin:0" }, lead) : null, kids); };

  const letters = sec("b", "Ответ на жалобу (Beschwerde, №21)",
    "Образцы писем для заучивания. Дословно заученный текст могут посчитать копипастой. Учите структуру и фразы, а в письме пишите своими словами и только то, о чём просил шеф.",
    DB.B.filter(b => b.models && b.models.length).map(b => acc(`Вариант ${String(b.v)} · ${b.topic || ""}`, SRC_FILE(),
      h("div", { class: "eyebrow" }, "Задание шефа"), h("div", { class: "letterview" }, (b.chef || []).join("\n")),
      b.models.map((m, i) => h("div", { class: "stack" }, h("div", { class: "eyebrow" }, "Образец письма" + (b.models.length > 1 ? " " + (i + 1) : "")), learnText(`Образец ${b.v}`, Array.isArray(m) ? m.join("\n") : m))))));

  const forum = sec("f", "Форум (Forumsbeitrag, №58)",
    "Порядок: приветствие, вступление, аргументы за, аргументы против, ваше мнение, имя. Одним абзацем, один стиль (Sie или du), не смешивать.",
    acc("Образец с шаблоном (тема «фитнес-зал»)", SRC_FILE(), learnText("Образец форума", DB.F_MODEL)),
    rmList(REDEMITTEL.forum, 1),
    acc(`Все темы форума (${DB.F.length})`, SRC_FILE(), h("ol", { class: "small", style: "margin:0;padding-left:22px" }, DB.F.map(f => h("li", null, h("b", null, f.title), " — " + f.desc)))));

  const notes = sec("n", "Telefonnotiz (№42–45)",
    "Файл советует учить только суть: имя, телефон, 2–4 пункта и что нужно сделать. Детали (имена, цвета, числа) на экзамене могут меняться, поэтому слушайте внимательно.",
    h("div", { class: "card tw" }, h("table", { class: "score" },
      h("tr", null, h("th", null, "Кто"), h("th", null, "Тема"), h("th", null, "Что запомнить"), h("th", null, "Что сделать")),
      DB.N.map(n => h("tr", null, h("td", null, n.who + (n.phone ? " · " + n.phone : "")), h("td", null, n.type), h("td", null, h("ul", { style: "margin:0;padding-left:16px" }, (n.info || []).map(i => h("li", null, i.t)))), h("td", null, n.todo))))));

  const rede = sec("r", "Redemittel (готовые фразы)",
    "Свои собственные фразы запоминаются лучше всего, но эти покрывают структуру каждой части.",
    h("div", { class: "grid2" },
      h("div", { class: "card stack" }, h("div", { class: "eyebrow" }, "Beschwerde · ответ клиенту"), rmList(REDEMITTEL.beschwerde, 1)),
      [["sp1", "Sprechen Teil 1 · презентация"], ["sp2", "Sprechen Teil 2 · Smalltalk"], ["sp3", "Sprechen Teil 3 · решение"]].map(([k, t]) =>
        h("div", { class: "card stack" }, h("div", { class: "eyebrow" }, t), rmList(SP_REDE[k], 1)))));

  const sp1 = sec("sp1", "Sprechen Teil 1: образцы презентаций",
    "Темы и образцы презентаций даны как пример структуры. Выучите построение и подставляйте свои темы.",
    DB.SP1.map(s => acc(`${s.n}. ${s.title}`, SRC_CLAUDE(), h("ul", { class: "small", style: "margin:0;padding-left:20px" }, s.points.map(p => h("li", null, p))), learnText(s.title, s.model.map(m => m.t).join("\n\n")))));

  const sp2 = sec("sp2", "Sprechen Teil 2: Smalltalk",
    "Ситуации и диалоги даны как пример структуры разговора.",
    DB.SP2.map(s => acc(`${s.n}. ${s.title}`, SRC_CLAUDE(), h("p", { style: "margin:0" }, s.situation), learnDialog(s.title, s.model))));

  const sp3 = sec("sp3", "Sprechen Teil 3: решение проблемы",
    "Диалоги A и B даны как образец. Это один из многих возможных вариантов.",
    DB.SP3.map(s => acc(`Ситуация ${s.n}`, h("p", { style: "margin:0" }, s.text), h("ul", { class: "small", style: "margin:0;padding-left:20px" }, s.points.map(p => h("li", null, p))), learnDialog("Ситуация " + s.n, s.model))));

  return h("div", { class: "wrap narrow" },
    crumbs(h("a", { href: "#home" }, "Главная"), "Учить наизусть"),
    h("div", { class: "stack" }, h("h1", null, "Учить наизусть"),
      h("p", { class: "lead", style: "margin:0" }, "Все тексты, которые стоит выучить, собраны здесь: письма, форум, Notiz, фразы и образцы для Sprechen. У каждого есть кнопка «Копировать» и озвучка."),
),
    h("div", { class: "row" }, secs.map(([id, t]) => h("button", { class: "btn small", onclick: () => { const el = document.getElementById("learn-" + id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); } }, t.replace(/ \(.*/, "")))),
    letters, forum, notes, rede, sp1, sp2, sp3);
}

/* ---------- interface language: RU (default) / EN / DE / FR / TR / AR / IT ----------
   The Russian strings stay in the source. A DOM pass swaps text and attributes for the chosen language,
   so every page, dynamic message and tooltip follows the switch without touching each renderer. */
const LANGS = { ru: "RU", en: "EN", de: "DE", fr: "FR", tr: "TR", ar: "AR", it: "IT" };
const LANG_IDX = { en: 0, de: 1, fr: 2, tr: 3, ar: 4, it: 5 };
const LANG_TITLE = { ru: "Русский", en: "English", de: "Deutsch", fr: "Français", tr: "Türkçe", ar: "العربية", it: "Italiano" };
const CYR = /[А-Яа-яЁё]/;
const PREFIX_KEYS = ["Ошибка озвучки:", "Неверно · правильно:", "Нет ответа · правильно:", "Правильно:", "Ответ:", "Уровень текста:", "Уровень:", "Правильная записка ·", "Чаще всего ошибки в заданиях №", "Ошибки в №"];
const RULES = I18N_RULES.map(([rx, t]) => [new RegExp(rx), t]);
const fillTpl = (tpl, m, lang) => tpl.replace(/\{(~?)(\d)\}/g, (_, nest, n) => nest ? trText(m[+n], lang) : m[+n]);
const curLang = () => store.get("lang", "de");

function trText(s, lang) {
  if (lang === "ru" || !CYR.test(s)) return s;
  const li = LANG_IDX[lang];
  const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
  const core = s.trim();
  if (!core) return s;
  const hit = (c) => { const e = I18N[c]; if (e) return e[li]; for (const [rx, t] of RULES) { const m = c.match(rx); if (m) return fillTpl(t[li], m, lang); } return null; };
  let out = hit(core);
  if (out == null) {
    for (const k of PREFIX_KEYS) {
      if (core.startsWith(k) && core.length > k.length && (k.endsWith(":") || k.endsWith("№") || k.endsWith("·") || core[k.length] === " ")) {
        const e = I18N[k]; if (e) { out = e[li] + core.slice(k.length); break; }
      }
    }
  }
  if (out == null && core.includes(" · ")) {
    const parts = core.split(" · "), tr = parts.map((x) => { const y = hit(x.trim()); return y == null ? x : y; });
    if (tr.some((x, i) => x !== parts[i])) out = tr.join(" · ");
  }
  return out == null ? s : lead + out + trail;
}

const T_REC = new WeakMap(), A_REC = new WeakMap();
const L_ATTRS = ["placeholder", "title", "aria-label"];
function langNode(node, lang) {
  if (node.nodeType === 3) {
    let r = T_REC.get(node);
    if (r && node.nodeValue !== r.t) r = null;
    if (!r) { if (!CYR.test(node.nodeValue)) { T_REC.delete(node); return; } r = { o: node.nodeValue, t: node.nodeValue }; T_REC.set(node, r); }
    const v = trText(r.o, lang); r.t = v; if (node.nodeValue !== v) node.nodeValue = v;
    return;
  }
  if (node.nodeType !== 1) return;
  const tag = node.tagName;
  if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || node.classList.contains("langsw")) return;
  for (const a of L_ATTRS) {
    if (!node.hasAttribute(a)) continue;
    const key = a; let rec = A_REC.get(node); if (!rec) { rec = {}; A_REC.set(node, rec); }
    const cur = node.getAttribute(a);
    let r = rec[key]; if (r && cur !== r.t) r = null;
    if (!r) { if (!CYR.test(cur)) { delete rec[key]; continue; } r = rec[key] = { o: cur, t: cur }; }
    const v = trText(r.o, lang); r.t = v; if (cur !== v) node.setAttribute(a, v);
  }
  for (let c = node.firstChild; c; c = c.nextSibling) langNode(c, lang);
}
let langObs = null;
function applyLang(root) {
  const lang = curLang();
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  if (langObs) langObs.disconnect();
  langNode(root || document.body, lang);
  if (langObs) langObs.observe(document.body, { childList: true, subtree: true, characterData: true });
}
function initLang() {
  langObs = new MutationObserver((muts) => {
    langObs.disconnect();
    const lang = curLang();
    for (const m of muts) {
      if (m.type === "childList") m.addedNodes.forEach((n) => langNode(n, lang));
      else if (m.type === "characterData") langNode(m.target, lang);
    }
    langObs.takeRecords();
    langObs.observe(document.body, { childList: true, subtree: true, characterData: true });
  });
  const top = document.querySelector(".top-in");
  if (top && !top.querySelector(".langsw")) {
    const sw = h("div", { class: "seg langsw", role: "group", "aria-label": "Language" });
    const paint = () => sw.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.l === curLang()));
    Object.entries(LANGS).forEach(([k, v]) => sw.append(h("button", { "data-l": k, title: LANG_TITLE[k], onclick: () => { store.set("lang", k); paint(); render(); applyLang(document.body); } }, v)));
    paint(); top.append(sw);
  }
  applyLang(document.body);
}

/* ---------- optional cloud sync of progress (Firebase Auth + Firestore over REST, no SDK, no own server) ----------
   Called from: e_main.js (viewProfile submit -> cloudConnect, boot -> cloudBoot, updateWho -> cloudOn) and build_web.py (concat before e_main.js).
   Reads/writes: localStorage keys dtb.{res,wrong,nstat,days,drafts,feedback,cand,log} + dtb.cloud (session), dtb.syncts; Firestore doc users/{uid} = {data: JSON string, updated: ms}.
   The web apiKey is public by design; access is protected by Firestore rules (uid == doc id). Without a password everything stays local. */
const FB = { key: "AIzaSyA5_PmCPlHg-9P1OD9LQFHXXF4Svj6Vajo", project: "prufung-6e9b1" };
const SYNC_KEYS = ["res", "wrong", "nstat", "days", "drafts", "feedback", "cand", "log"];
const cloud = { s: store.get("cloud", null), timer: null, state: "" };
const cloudOn = () => !!cloud.s;

async function fbApi(url, opt) {
  const r = await fetch(url, opt);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const m = (j.error && j.error.message) || ("HTTP " + r.status); throw Object.assign(new Error(m), { msg: m, status: r.status }); }
  return j;
}
const fbAuth = (op, email, password) => fbApi(`https://identitytoolkit.googleapis.com/v1/accounts:${op}?key=${FB.key}`,
  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true }) });

async function fbToken() {
  const s = cloud.s; if (!s) throw new Error("no session");
  if (cloud.id && cloud.exp > Date.now() + 60000) return cloud.id;
  const j = await fbApi(`https://securetoken.googleapis.com/v1/token?key=${FB.key}`,
    { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(s.refresh)}` });
  cloud.id = j.id_token; cloud.exp = Date.now() + (+j.expires_in || 3600) * 1000;
  if (j.refresh_token && j.refresh_token !== s.refresh) { s.refresh = j.refresh_token; store.set("cloud", s); }
  return cloud.id;
}
const docUrl = () => `https://firestore.googleapis.com/v1/projects/${FB.project}/databases/(default)/documents/users/${cloud.s.uid}`;

// one stable account per person: the same name, birth date and password open the same progress on any device
async function fbMail(c) {
  const id = [c.fam, c.vor, c.geb || ""].map(x => String(x || "").trim().toLowerCase().replace(/\s+/g, " ")).join("|");
  let hex = "";
  try { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("dtb|" + id)); hex = [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("").slice(0, 32); }
  catch { let a = 5381, b = 52711; for (const ch of id) { a = ((a * 33) ^ ch.charCodeAt(0)) >>> 0; b = ((b * 31) + ch.charCodeAt(0)) >>> 0; } hex = a.toString(16) + b.toString(16); }
  return `u${hex}@dtb-trainer.app`;
}

const localSnap = () => { const o = {}; SYNC_KEYS.forEach(k => { const v = store.get(k, null); if (v != null) o[k] = v; }); return o; };
function mergeCloud(cd, cupd) {
  const lt = store.get("syncts", 0);
  const pickCloud = cupd >= lt;
  Object.keys(cd).forEach(k => {
    if (!SYNC_KEYS.includes(k)) return;
    const loc = store.get(k, null);
    if (loc == null) { store.set(k, cd[k]); return; }
    if (k === "days") store.set(k, [...new Set([...(loc || []), ...(cd[k] || [])])].sort().slice(-400));
    else if (k === "res") { const m = { ...loc }; Object.entries(cd[k] || {}).forEach(([v, o]) => { if (!m[v] || (o.ts || 0) > (m[v].ts || 0)) m[v] = o; }); store.set(k, m); }
    else if (k === "log") {
      const byKey = new Map();
      [...(Array.isArray(loc) ? loc : []), ...(Array.isArray(cd[k]) ? cd[k] : [])].forEach(x => { if (x && x.t) byKey.set(x.t + "|" + x.vid, x); });
      store.set(k, [...byKey.values()].sort((a, b) => a.t - b.t).slice(-2000));
    }
    else if (pickCloud) store.set(k, cd[k]);
  });
}
async function cloudPull() {
  const t = await fbToken();
  let j;
  try { j = await fbApi(docUrl(), { headers: { Authorization: "Bearer " + t } }); }
  catch (e) { if (e.status === 404) return; throw e; }
  const f = j.fields || {};
  if (f.data && f.data.stringValue) mergeCloud(JSON.parse(f.data.stringValue), +((f.updated || {}).integerValue || 0));
}
async function cloudPush() {
  if (!cloud.s) return;
  const t = await fbToken();
  const now = Date.now();
  await fbApi(`${docUrl()}?updateMask.fieldPaths=data&updateMask.fieldPaths=updated`, { method: "PATCH",
    headers: { Authorization: "Bearer " + t, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { data: { stringValue: JSON.stringify(localSnap()) }, updated: { integerValue: String(now) } } }) });
  store.set("syncts", now);
}
function cloudSoon() {
  clearTimeout(cloud.timer);
  cloud.timer = setTimeout(() => { cloudPush().then(() => { cloud.state = "ok"; }).catch(() => { cloud.state = "err"; }); }, 2500);
}
store.onSet = (k) => { if (cloud.s && SYNC_KEYS.includes(k)) { store.set("syncts", Date.now() - 1); cloudSoon(); } };

// sign in (or create the account on first use), then merge cloud progress with this device and upload the result
async function cloudConnect(c, password) {
  const email = await fbMail(c);
  let a;
  try { a = await fbAuth("signInWithPassword", email, password); }
  catch (e) {
    if (!/EMAIL_NOT_FOUND|INVALID_LOGIN_CREDENTIALS|USER_NOT_FOUND/.test(e.msg)) throw e;
    try { a = await fbAuth("signUp", email, password); }
    catch (e2) { if (/EMAIL_EXISTS/.test(e2.msg)) throw Object.assign(new Error("PW"), { msg: "PW" }); throw e2; }
  }
  cloud.s = { uid: a.localId, refresh: a.refreshToken, email };
  cloud.id = a.idToken; cloud.exp = Date.now() + (+a.expiresIn || 3600) * 1000;
  store.set("cloud", cloud.s);
  await cloudPull();
  await cloudPush();
  cloud.state = "ok";
}
function cloudOff(wipe) {
  clearTimeout(cloud.timer);
  if (wipe) SYNC_KEYS.forEach(k => { try { localStorage.removeItem("dtb." + k); } catch {} });
  try { localStorage.removeItem("dtb.cloud"); localStorage.removeItem("dtb.syncts"); } catch {}
  cloud.s = null; cloud.id = null;
}
function cloudBoot(then) {
  if (!cloud.s) return;
  cloudPull().then(() => { cloud.state = "ok"; then && then(); return cloudPush(); }).catch(() => { cloud.state = "err"; });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && cloud.s) cloudPush().catch(() => {}); });
}
function cloudErrText(e) {
  if (e.msg === "PW") return "Falsches Kennwort für dieses Konto.";
  if (/WEAK_PASSWORD/.test(e.msg || "")) return "Das Kennwort ist zu kurz (mindestens 6 Zeichen).";
  if (/OPERATION_NOT_ALLOWED|CONFIGURATION_NOT_FOUND/.test(e.msg || "")) return "Anmeldung per E-Mail/Kennwort ist in Firebase noch nicht aktiviert. Die Daten bleiben vorerst nur auf diesem Gerät.";
  if (/PERMISSION_DENIED|Missing or insufficient/.test(e.msg || "")) return "Firestore-Regeln fehlen. Die Daten bleiben vorerst nur auf diesem Gerät.";
  return "Keine Verbindung zur Cloud. Die Daten bleiben vorerst nur auf diesem Gerät.";
}
/* Student progress, leaderboard and theme. Concatenated before e_main.js: uses store/h/trText/curLang/cloud. */
const PG_SECTIONS = ["lesen", "hoeren", "schreiben", "sprechen"];
const PG_SECTION_NAME = { lesen: "Lesen", hoeren: "Hören", schreiben: "Schreiben", sprechen: "Sprechen" };
const PG_PART = {
  L1: ["lesen", "Lesen 1"], L2: ["lesen", "Lesen 2"], L3: ["lesen", "Lesen 3"], L4: ["lesen", "Lesen 4"],
  B: ["lesen", "Lesen 19–20"], S1: ["schreiben", "Sprachbausteine 1"], S2: ["schreiben", "Sprachbausteine 2"],
  H1: ["hoeren", "Hören 1"], H2: ["hoeren", "Hören 2"], H3: ["hoeren", "Hören 3"], H4: ["hoeren", "Hören 4"],
  N: ["hoeren", "Telefonnotiz"], F: ["schreiben", "Forumsbeitrag"],
  SP1: ["sprechen", "Sprechen 1"], SP2: ["sprechen", "Sprechen 2"], SP3: ["sprechen", "Sprechen 3"],
};
const PG_ORDER = { L1: 0, L2: 1, L3: 2, L4: 3, B: 4, H1: 5, H2: 6, H3: 7, H4: 8, N: 9, S1: 10, S2: 11, BW: 12, F: 13, SP1: 14, SP2: 15, SP3: 16 };
const PG_ACH = [
  { id: "first", label: "Первый шаг", icon: "🚀", hint: "решить первое задание" },
  { id: "ten", label: "10 заданий", icon: "⚡", hint: "10 разных заданий" },
  { id: "fifty", label: "50 заданий", icon: "🎯", hint: "50 разных заданий" },
  { id: "hundred", label: "100 попыток", icon: "💯", hint: "100 попыток решения" },
  { id: "week", label: "7 дней подряд", icon: "🔥", hint: "неделя без пропусков" },
  { id: "month", label: "30 дней занятий", icon: "📅", hint: "30 активных дней" },
  { id: "perfect", label: "Без ошибок", icon: "✅", hint: "100% за задание" },
  { id: "ace", label: "Отличник", icon: "🏅", hint: "85%+ на 10 заданиях" },
  { id: "hoeren", label: "Hören-Profi", icon: "🎧", hint: "80%+ в Hören" },
  { id: "schreiben", label: "Schreiben-Profi", icon: "✍️", hint: "80%+ в Schreiben" },
];
const PG_DAY = 86400000;
const pgIso = ts => new Date(ts).toISOString().slice(0, 10);
const pgToday = () => pgIso(Date.now());
const pgDayStart = iso => Date.parse(iso + "T00:00:00Z");
const pgNum = v => (Number.isFinite(+v) ? +v : 0);
const pgMean = a => { const x = a.filter(v => v != null && Number.isFinite(v)); return x.length ? x.reduce((p, c) => p + c, 0) / x.length : null; };
const pgRound = v => (v == null ? null : Math.round(v * 10) / 10);
const pgPct = v => (v == null ? "—" : Math.round(v) + "%");
const pgFmt = n => Number(n || 0).toLocaleString(curLang() === "ru" ? "ru-RU" : curLang());
function T(s) { return typeof trText === "function" ? trText(s, curLang()) : s; }
function pgPlural(n, one, few, many) {
  if (curLang() !== "ru") return many;
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}
function pgDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString(curLang() === "ru" ? "ru-RU" : curLang(), { day: "2-digit", month: "2-digit" });
}
function pgShort(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString(curLang() === "ru" ? "ru-RU" : curLang(), { day: "2-digit", month: "2-digit" });
}
function pgRel(iso) {
  if (!iso) return "—";
  const diff = Math.round((pgDayStart(pgToday()) - pgDayStart(iso)) / PG_DAY);
  if (diff <= 0) return T("Сегодня");
  if (diff === 1) return T("Вчера");
  if (diff < 30) return diff + " " + T("дн. назад");
  return pgShort(iso);
}
function svgEl(tag, attrs, ...kids) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat(Infinity)) if (c != null && c !== false) n.append(c.nodeType ? c : String(c));
  return n;
}
function pgPart(vid) {
  const raw = String(vid || "");
  const write = raw.startsWith("w-");
  const v = write ? raw.slice(2) : raw;
  let key = null;
  if (/^F\d*$/.test(v)) key = "F";
  else { const m = /^(SP[123]|L[1-4]|B|S[12]|H[1-4]|N)/.exec(v); if (m) key = m[1]; }
  if (!key) return { key: "?", section: "other", label: T("Другое") };
  if (key === "B" && write) return { key: "BW", section: "schreiben", label: T("Письмо · Beschwerde") };
  const meta = PG_PART[key];
  return { key, section: meta[0], label: meta[1] };
}
function pgStreak(days) {
  const set = new Set(days);
  let longest = 0, run = 0, prev = null;
  for (const d of days) {
    if (prev && pgDayStart(d) - pgDayStart(prev) === PG_DAY) run++;
    else run = 1;
    prev = d;
    if (run > longest) longest = run;
  }
  let current = 0, cursor = pgToday();
  if (!set.has(cursor)) cursor = pgIso(pgDayStart(cursor) - PG_DAY);
  while (set.has(cursor)) { current++; cursor = pgIso(pgDayStart(cursor) - PG_DAY); }
  return { current, longest };
}
function pgData() {
  const res = store.get("res", {}) || {};
  const wrong = store.get("wrong", {}) || {};
  const rawDays = store.get("days", []);
  const days = Array.isArray(rawDays) ? [...new Set(rawDays.filter(x => /^\d{4}-\d{2}-\d{2}$/.test(x)))].sort() : [];
  const log = Array.isArray(store.get("log", [])) ? store.get("log", []).filter(x => x && pgNum(x.t)) : [];
  const items = [];
  for (const [vid, o] of Object.entries(res)) {
    if (!o || !pgNum(o.max)) continue;
    const part = pgPart(vid);
    items.push({
      vid, part,
      cur: Math.max(0, Math.min(100, pgNum(o.last) / pgNum(o.max) * 100)),
      best: Math.max(0, Math.min(100, pgNum(o.best) / pgNum(o.max) * 100)),
      n: Math.max(1, pgNum(o.n)), ts: pgNum(o.ts),
    });
  }
  const tasks = items.length;
  const attempts = items.reduce((a, x) => a + x.n, 0);
  const scorePct = pgRound(pgMean(items.map(x => x.cur)));
  const bestPct = pgRound(pgMean(items.map(x => x.best)));
  const success = items.filter(x => x.best >= 80).length;
  const fail = items.filter(x => x.best < 50).length;
  const mid = Math.max(0, tasks - success - fail);
  const sections = {};
  for (const id of PG_SECTIONS) sections[id] = { pct: null, tasks: 0, attempts: 0, sum: 0 };
  const partMap = new Map();
  for (const it of items) {
    const sec = sections[it.part.section];
    if (sec) { sec.tasks++; sec.attempts += it.n; sec.sum += it.cur; }
    const p = partMap.get(it.part.key) || { key: it.part.key, label: it.part.label, section: it.part.section, tasks: 0, attempts: 0, sum: 0 };
    p.tasks++; p.attempts += it.n; p.sum += it.cur; partMap.set(it.part.key, p);
  }
  for (const id of PG_SECTIONS) { const s = sections[id]; s.pct = s.tasks ? pgRound(s.sum / s.tasks) : null; delete s.sum; }
  const parts = [...partMap.values()].map(p => ({ key: p.key, label: p.label, section: p.section, tasks: p.tasks, attempts: p.attempts, pct: pgRound(p.sum / p.tasks) }))
    .sort((a, b) => (PG_ORDER[a.key] == null ? 99 : PG_ORDER[a.key]) - (PG_ORDER[b.key] == null ? 99 : PG_ORDER[b.key]));
  const wrongArr = Object.entries(wrong).map(([key, w]) => ({ key, vid: String((w && w.vid) || ""), part: pgPart(w && w.vid), n: pgNum(w && w.n), ts: pgNum(w && w.ts) }))
    .sort((a, b) => b.ts - a.ts);
  const weakMap = new Map();
  for (const w of wrongArr) {
    const cur = weakMap.get(w.part.key) || { key: w.part.key, label: w.part.label, section: w.part.section, count: 0 };
    cur.count++; weakMap.set(w.part.key, cur);
  }
  const weak = [...weakMap.values()].sort((a, b) => b.count - a.count);
  const dayTests = new Map();
  if (log.length) {
    for (const x of log) { const d = pgIso(pgNum(x.t)); dayTests.set(d, (dayTests.get(d) || 0) + 1); }
  } else {
    for (const it of items) if (it.ts) { const d = pgIso(it.ts); dayTests.set(d, (dayTests.get(d) || 0) + 1); }
  }
  const daySet = new Set(days);
  const activity = [];
  for (let i = 29; i >= 0; i--) {
    const date = pgIso(Date.now() - i * PG_DAY);
    activity.push({ date, tests: dayTests.get(date) || 0, active: daySet.has(date) || dayTests.has(date) });
  }
  const trend = (log.length ? log.map(x => ({ ts: pgNum(x.t), pct: pgNum(x.mx) ? Math.round(pgNum(x.sc) / pgNum(x.mx) * 100) : null, vid: x.vid }))
    : items.filter(x => x.ts).map(x => ({ ts: x.ts, pct: Math.round(x.best), vid: x.vid })))
    .filter(x => x.pct != null).sort((a, b) => a.ts - b.ts).slice(-8);
  const st = pgStreak(days);
  const achievements = PG_ACH.map(a => {
    let earned = false;
    if (a.id === "first") earned = tasks >= 1;
    else if (a.id === "ten") earned = tasks >= 10;
    else if (a.id === "fifty") earned = tasks >= 50;
    else if (a.id === "hundred") earned = attempts >= 100;
    else if (a.id === "week") earned = st.longest >= 7;
    else if (a.id === "month") earned = days.length >= 30;
    else if (a.id === "perfect") earned = items.some(x => x.best === 100);
    else if (a.id === "ace") earned = bestPct != null && bestPct >= 85 && tasks >= 10;
    else if (a.id === "hoeren") earned = (sections.hoeren.pct || 0) >= 80 && sections.hoeren.tasks >= 3;
    else if (a.id === "schreiben") earned = (sections.schreiben.pct || 0) >= 80 && sections.schreiben.tasks >= 2;
    return Object.assign({}, a, { earned });
  });
  return { days: days.length, firstDay: days[0] || null, tasks, attempts, scorePct, bestPct, success, mid, fail, failures: wrongArr.length, sections, parts, weak, recentWrong: wrongArr.slice(0, 5), activity, trend, streak: st, achievements, earned: achievements.filter(a => a.earned).length };
}

/* --------------------------------------------------------------- charts --- */
function pgActivityChart(activity, compact) {
  const data = (activity || []).slice(-30);
  if (!data.length || !data.some(d => d.tests)) return h("div", { class: "pg-empty" }, T("Пока нет данных за этот период."));
  const W = compact ? 320 : 640, H = compact ? 108 : 190;
  const pad = compact ? { l: 22, r: 6, t: 8, b: 18 } : { l: 28, r: 8, t: 10, b: 24 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const max = Math.max(1, ...data.map(d => d.tests));
  const bw = iw / data.length;
  const y = v => pad.t + ih - (v / max) * ih;
  const svg = svgEl("svg", { class: "pg-chart", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": T("Активность") });
  for (let i = 0; i <= 3; i++) {
    const v = max * i / 3;
    svg.append(svgEl("line", { class: "grid", x1: pad.l, x2: W - pad.r, y1: y(v), y2: y(v) }));
    svg.append(svgEl("text", { x: pad.l - 4, y: y(v) + 3, "text-anchor": "end" }, String(Math.round(v))));
  }
  const step = Math.max(1, Math.ceil(data.length / (compact ? 4 : 6)));
  data.forEach((d, i) => {
    if (i % step === 0 || i === data.length - 1) svg.append(svgEl("text", { x: pad.l + i * bw + bw / 2, y: H - 6, "text-anchor": "middle" }, pgShort(d.date)));
  });
  const gap = Math.max(1.5, bw * .22);
  data.forEach((d, i) => {
    const top = y(d.tests);
    const bar = svgEl("rect", { class: "pgbar", x: pad.l + i * bw + gap / 2, y: top, width: Math.max(1, bw - gap), height: Math.max(d.tests ? 2 : 0, ih - (top - pad.t)), rx: Math.min(2, bw / 3) });
    bar.append(svgEl("title", {}, pgShort(d.date) + ": " + d.tests));
    svg.append(bar);
  });
  return svg;
}
function pgSparkline(values) {
  const v = (values || []).slice(-14);
  const W = 240, H = 46, pad = 3;
  const max = Math.max(1, ...v);
  const n = v.length;
  const x = i => pad + (n <= 1 ? (W - pad * 2) / 2 : i / (n - 1) * (W - pad * 2));
  const y = val => H - pad - (val / max) * (H - pad * 2);
  const line = v.map((val, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(val).toFixed(1)).join(" ");
  const svg = svgEl("svg", { class: "pg-chart", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": T("Активность") });
  svg.append(svgEl("path", { d: line, class: "line", "stroke-width": 2 }));
  if (n) svg.append(svgEl("circle", { class: "dot", cx: x(n - 1), cy: y(v[n - 1]), r: 2.6 }));
  return svg;
}
function pgDonut(pct) {
  const R = 48, C = 2 * Math.PI * R;
  const val = pct == null ? 0 : Math.max(0, Math.min(100, pct));
  const svg = svgEl("svg", { viewBox: "0 0 120 120", role: "img", "aria-label": pgPct(pct) });
  svg.append(svgEl("circle", { cx: 60, cy: 60, r: R, stroke: "var(--soft)", "stroke-width": 12, fill: "none" }));
  if (val > 0) svg.append(svgEl("circle", { cx: 60, cy: 60, r: R, stroke: "var(--accent)", "stroke-width": 12, fill: "none", "stroke-dasharray": (val / 100 * C) + " " + C, "stroke-dashoffset": 0 }));
  return h("div", { class: "pg-donut" }, svg, h("div", { class: "pg-donut-center" }, h("b", null, pgPct(pct)), h("span", null, T("средний результат"))));
}
function pgSectionBars(sections) {
  return h("div", { class: "pg-bars" }, PG_SECTIONS.map(id => {
    const s = sections[id];
    return h("div", { class: "pg-barrow " + id },
      h("div", { class: "top" }, h("b", null, PG_SECTION_NAME[id]), h("span", null, s.pct == null ? "—" : Math.round(s.pct) + "% · " + s.attempts)),
      h("div", { class: "pg-track" }, h("i", { "data-w": s.pct == null ? 0 : Math.round(s.pct) })));
  }));
}
function pgApplyWidths(root) {
  requestAnimationFrame(() => (root || document).querySelectorAll("[data-w]").forEach(i => { i.style.width = Math.max(0, Math.min(100, Number(i.getAttribute("data-w")) || 0)) + "%"; }));
}
function pgRecentList(rows, empty) {
  if (!rows || !rows.length) return h("div", { class: "pg-empty" }, empty || T("Пока нет результатов."));
  return h("div", { class: "pg-list" }, rows.map(r => h("div", { class: "pg-list-row" },
    h("span", { class: "dot" }),
    h("b", null, r.label || r.part || ""),
    h("span", null, (r.date ? r.date + " · " : "") + pgPct(r.pct)))));
}

/* ------------------------------------------------------------- progress --- */
function pgKpi(label, value, note, tone) {
  return h("div", { class: "pg-kpi", style: "--tone:" + tone },
    h("div", { class: "k" }, label),
    h("div", { class: "v" }, value),
    h("div", { class: "n" }, note || ""));
}
function viewProgress() {
  const d = pgData();
  const empty = !d.tasks && !d.days;
  const wrap = h("div", { class: "pg-wrap" },
    h("div", { class: "pg-hero" },
      h("div", null,
        h("div", { class: "eyebrow", style: "margin-bottom:5px" }, "DTB B2 · " + T("Прогресс")),
        h("h1", null, T("Мой прогресс")),
        h("p", null, T("Дни занятий, результаты по частям экзамена, ошибки и достижения — всё в одном месте."))),
      h("div", { class: "row" },
        h("a", { class: "btn primary", href: "#home" }, T("Продолжить тренировку")),
        h("a", { class: "btn", href: "#review" }, T("Мои ошибки") + (d.failures ? " · " + d.failures : "")))),
    h("div", { class: "pg-kpis" },
      pgKpi(T("Дней занятий"), pgFmt(d.days), d.firstDay ? T("с") + " " + pgShort(d.firstDay) : "", "var(--accent)"),
      pgKpi(T("Заданий решено"), pgFmt(d.tasks), T("из") + " 58", "var(--c-lesen)"),
      pgKpi(T("Попыток"), pgFmt(d.attempts), "", "var(--c-sprechen)"),
      pgKpi(T("Средний результат"), pgPct(d.scorePct), T("Лучший") + ": " + pgPct(d.bestPct), "var(--c-schreiben)"),
      pgKpi(T("Ошибок к повтору"), pgFmt(d.failures), d.weak.length ? d.weak[0].label : "", "var(--bad)"),
      pgKpi(T("Серия дней"), pgFmt(d.streak.current), T("Рекорд") + ": " + d.streak.longest, "var(--c-hoeren)")));
  if (empty) {
    wrap.append(h("div", { class: "pg-card" }, h("div", { class: "pg-empty" },
      h("div", { style: "font-size:30px;line-height:1" }, "📊"),
      h("h2", { style: "margin:8px 0 4px" }, T("Пока нет данных")),
      h("p", { style: "margin:0 auto 12px;max-width:46ch" }, T("Начните с любого задания, и здесь появятся графики, результаты и достижения.")),
      h("a", { class: "btn primary", href: "#home" }, T("Начать тренировку")))));
    pgApplyWidths(wrap);
    return wrap;
  }
  const outcomeCard = h("div", { class: "pg-card" },
    h("h2", null, T("Успехи и провалы")),
    h("p", { class: "sub" }, T("По лучшему результату каждого задания")),
    h("div", { class: "pg-donut-wrap" }, pgDonut(d.scorePct),
      h("div", { style: "flex:1;min-width:140px" },
        h("div", { class: "pg-split" },
          h("div", { class: "pg-split-bar" },
            h("i", { class: "ok", style: "width:" + Math.round(d.success / Math.max(1, d.tasks) * 100) + "%" }),
            h("i", { class: "mid", style: "width:" + Math.round(d.mid / Math.max(1, d.tasks) * 100) + "%" }),
            h("i", { class: "bad", style: "width:" + Math.round(d.fail / Math.max(1, d.tasks) * 100) + "%" })),
          h("div", { class: "pg-split-legend" },
            h("span", null, h("i", { style: "background:var(--ok)" }), T("Успешно") + " · " + d.success),
            h("span", null, h("i", { style: "background:var(--warn)" }), T("Средне") + " · " + d.mid),
            h("span", null, h("i", { style: "background:var(--bad)" }), T("Слабо") + " · " + d.fail))))));
  const sectionsCard = h("div", { class: "pg-card" },
    h("h2", null, T("По частям экзамена")),
    h("p", { class: "sub" }, T("Средний результат по вашим заданиям")),
    pgSectionBars(d.sections));
  const weakCard = h("div", { class: "pg-card" },
    h("h2", null, T("Слабые места")),
    h("p", { class: "sub" }, T("Что повторить в первую очередь")),
    d.weak.length
      ? h("div", { class: "pg-list" }, d.weak.slice(0, 6).map(w => h("div", { class: "pg-list-row" }, h("span", { class: "dot" }), h("b", null, w.label), h("span", null, w.count))))
      : h("div", { class: "pg-empty" }, T("Ошибок нет — отличная работа!")));
  const achievementsCard = h("div", { class: "pg-card" },
    h("h2", null, T("Достижения")),
    h("p", { class: "sub" }, T("Получено") + " " + d.earned + " " + T("из") + " " + d.achievements.length),
    h("div", { class: "pg-badge-grid" }, d.achievements.map(a => h("div", { class: "pg-badge" + (a.earned ? " on" : ""), title: T(a.hint) }, h("b", null, a.icon), h("span", null, T(a.label))))));
  const recentCard = h("div", { class: "pg-card" },
    h("h2", null, T("Последние результаты")),
    h("p", { class: "sub" }, T("Последние сохранённые попытки")),
    pgRecentList(d.trend.slice().reverse().map(r => ({ label: pgPart(r.vid).label, date: pgDate(r.ts), pct: r.pct }))));
  const wrongCard = h("div", { class: "pg-card" },
    h("h2", null, T("Последние ошибки")),
    h("p", { class: "sub" }, T("Вопросы, которые стоит повторить")),
    d.recentWrong.length
      ? h("div", { class: "pg-list" }, d.recentWrong.map(w => h("div", { class: "pg-list-row" }, h("span", { class: "dot" }), h("b", null, w.part.label), h("span", null, "№" + w.n + (w.ts ? " · " + pgRel(pgIso(w.ts)) : "")))))
      : h("div", { class: "pg-empty" }, T("Ошибок нет — отличная работа!")));
  wrap.append(
    h("div", { class: "pg-grid" },
      h("div", { class: "pg-card" },
        h("h2", null, T("Активность за 30 дней")),
        h("p", { class: "sub" }, T("Сколько заданий вы решаете каждый день")),
        pgActivityChart(d.activity, false)),
      outcomeCard),
    h("div", { class: "pg-grid two" }, sectionsCard, weakCard),
    achievementsCard,
    h("div", { class: "pg-grid two" }, recentCard, wrongCard));
  pgApplyWidths(wrap);
  return wrap;
}

/* ------------------------------------------------------------- leaderboard */
let lbPeriod = "week";
let lbCache = { at: 0, week: null, all: null };
function myLeaderboardUid() {
  try { return (typeof cloud !== "undefined" && cloud && cloud.s && cloud.s.uid) || ""; } catch { return ""; }
}
async function fetchLeaderboard(period, force) {
  const now = Date.now();
  if (!force && lbCache[period] && now - lbCache.at < 60000) return lbCache[period];
  const uid = myLeaderboardUid();
  const r = await fetch("/api/leaderboard?period=" + encodeURIComponent(period) + "&uid=" + encodeURIComponent(uid), { cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.message || "HTTP " + r.status), { code: j.code || "error" });
  lbCache[period] = j;
  lbCache.at = now;
  return j;
}
function lbAvatar(name, initials) {
  let hue = 0;
  for (const ch of String(name || "?")) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
  return h("span", { class: "av", style: "background:linear-gradient(140deg,hsl(" + hue + " 64% 48%),hsl(" + ((hue + 42) % 360) + " 62% 38%))", "aria-hidden": "true" }, initials || "?");
}
function lbMedal(rank) {
  return rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "";
}
function lbAward(rank) { return rank === 1 ? T("Золото") : rank === 2 ? T("Серебро") : rank === 3 ? T("Бронза") : ""; }
function homeLeadersCard() {
  const card = h("div", { class: "home-card" },
    h("h2", null, "🏆 " + T("Рейтинг недели")),
    h("p", { class: "sub" }, T("Кто лучше всех занимается на этой неделе")),
    h("div", { id: "home-leaders" }, h("div", { class: "pg-empty" }, T("Загрузка…"))),
    h("div", { style: "margin-top:8px" }, h("a", { class: "small", href: "#leaderboard" }, T("Смотреть весь рейтинг") + " →")));
  setTimeout(loadHomeLeaders, 0);
  return card;
}
async function loadHomeLeaders() {
  const box = document.getElementById("home-leaders");
  if (!box) return;
  try {
    const d = await fetchLeaderboard("week", false);
    const top = (d.entries || []).slice(0, 3);
    if (!top.length) { box.replaceChildren(h("div", { class: "pg-empty" }, T("Пока нет участников"))); return; }
    box.replaceChildren(h("div", { class: "home-lb-list" }, top.map(e => h("div", { class: "home-lb-row" },
      h("span", { class: "md" }, lbMedal(e.rank) || e.rank),
      lbAvatar(e.name, e.initials),
      h("b", null, e.name + (e.isMe ? " · " + T("Вы") : "")),
      h("span", null, pgFmt(e.points))))));
  } catch {
    box.replaceChildren(h("div", { class: "pg-empty" }, T("Рейтинг недоступен. Попробуйте позже.")));
  }
}
function homeProgressCard() {
  const d = pgData();
  if (!d.tasks && !d.days) {
    return h("div", { class: "home-card" },
      h("h2", null, "📈 " + T("Мой прогресс")),
      h("p", { class: "sub" }, T("Дни занятий, результаты и ошибки")),
      h("div", { class: "pg-empty", style: "padding:16px 8px 8px" },
        h("p", { style: "margin:0 0 10px" }, T("Начните с любого задания, и здесь появятся графики, результаты и достижения.")),
        h("a", { class: "btn primary", href: "#l1" }, T("Начать тренировку"))));
  }
  const card = h("div", { class: "home-card" },
    h("h2", null, "📈 " + T("Мой прогресс")),
    h("p", { class: "sub" }, T("Дни занятий, результаты и ошибки")),
    h("div", { class: "home-mini-stats" },
      h("div", null, h("div", { class: "v" }, d.days), h("div", { class: "l" }, T("Дней занятий"))),
      h("div", null, h("div", { class: "v" }, d.attempts), h("div", { class: "l" }, T("Попыток"))),
      h("div", null, h("div", { class: "v" }, pgPct(d.scorePct)), h("div", { class: "l" }, T("Средний результат"))),
      h("div", null, h("div", { class: "v" }, d.failures), h("div", { class: "l" }, T("Ошибок к повтору")))),
    h("div", { class: "row" }, pgSparkline(d.activity.map(x => x.tests)), h("a", { class: "btn small", href: "#progress" }, T("Открыть прогресс") + " →")));
  return card;
}
function homeStrip() { return h("div", { class: "home-strip" }, homeProgressCard(), homeLeadersCard()); }
function viewLeaderboard() {
  const tabs = h("div", { class: "lb-tabs", role: "group", "aria-label": T("Период") },
    [["week", T("За неделю")], ["all", T("За всё время")]].map(([p, label]) => h("button", { class: lbPeriod === p ? "on" : "", "data-lb": p, onclick: () => { lbPeriod = p; renderLeaderboardView(true); } }, label)));
  const wrap = h("div", { class: "lb-wrap" },
    h("div", { class: "lb-hero" },
      h("div", null,
        h("div", { class: "eyebrow", style: "margin-bottom:5px" }, "DTB B2 · " + T("Рейтинг")),
        h("h1", null, T("Рейтинг учеников")),
        h("p", null, T("Кто лучше всех занимается на этой неделе. Участвуют ученики с облачным прогрессом."))),
      tabs),
    h("div", { id: "lb-content" }, h("div", { class: "lb-loading" }, T("Загрузка…"))));
  setTimeout(() => renderLeaderboardView(false), 0);
  return wrap;
}
async function renderLeaderboardView(force) {
  const box = document.getElementById("lb-content");
  if (!box) return;
  const tabs = document.querySelectorAll("[data-lb]");
  tabs.forEach(b => { const on = b.getAttribute("data-lb") === lbPeriod; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
  box.replaceChildren(h("div", { class: "lb-loading" }, T("Загрузка…")));
  try {
    const d = await fetchLeaderboard(lbPeriod, force);
    box.replaceChildren(renderLeaderboardData(d));
  } catch (e) {
    box.replaceChildren(h("div", { class: "pg-card" }, h("div", { class: "pg-empty" },
      h("h2", { style: "margin:0 0 6px" }, T("Рейтинг недоступен. Попробуйте позже.")),
      h("p", { style: "margin:0 auto 12px" }, e.message || ""),
      h("button", { class: "btn", onclick: () => renderLeaderboardView(true) }, T("Обновить")))));
  }
}
function renderLeaderboardData(d) {
  const entries = d.entries || [];
  if (!entries.length) {
    return h("div", { class: "pg-card" }, h("div", { class: "pg-empty" },
      h("div", { style: "font-size:30px;line-height:1" }, "🏆"),
      h("h2", { style: "margin:8px 0 4px" }, T("Пока нет участников")),
      h("p", { style: "margin:0 auto 12px;max-width:50ch" }, T("Чтобы попасть в рейтинг, сохраните прогресс в облаке: анкета → пароль от 6 символов.")),
      h("a", { class: "btn primary", href: "#profile" }, T("Заполнить анкету"))));
  }
  const top = entries.slice(0, 3);
  const podium = h("div", { class: "lb-podium" }, top.map(e => h("div", { class: "lb-pod " + (e.rank === 1 ? "first" : e.rank === 2 ? "second" : "third") },
    e.isMe ? h("span", { class: "me" }, T("Вы")) : null,
    h("div", { class: "medal" }, lbMedal(e.rank) || e.rank),
    lbAvatar(e.name, e.initials),
    h("div", { class: "nm" }, e.name),
    h("div", { class: "pts" }, T("Очки") + " " + pgFmt(e.points) + " · " + lbAward(e.rank)))));
  const rows = entries.map(e => h("div", { class: "lb-row" + (e.isMe ? " me" : "") + (e.rank === 1 ? " top1" : "") },
    h("div", { class: "rank" }, h("span", { class: "md" }, lbMedal(e.rank)), e.rank),
    h("div", { class: "lb-who" }, lbAvatar(e.name, e.initials), h("b", null, e.name), e.isMe ? h("span", { class: "you" }, T("Вы")) : null),
    h("div", { class: "pts" }, pgFmt(e.points)),
    h("div", { class: "lb-num" }, pgFmt(e.tests)),
    h("div", { class: "lb-num" }, pgFmt(e.days)),
    h("div", { class: "lb-num" }, e.avg == null ? "—" : Math.round(e.avg) + "%")));
  const me = d.me;
  const meCard = me
    ? h("div", { class: "lb-me-card" },
      h("div", { class: "rank" }, "#" + me.rank),
      h("div", { class: "txt" }, h("b", null, T("Ваше место") + " · " + me.name), h("span", null, T("Очки") + ": " + pgFmt(me.points) + " · " + T("Попыток") + ": " + pgFmt(me.tests) + " · " + T("Дней") + ": " + pgFmt(me.days))),
      h("div", { class: "pts" }, pgPct(me.avg)))
    : h("div", { class: "lb-note" }, T("Чтобы попасть в рейтинг, сохраните прогресс в облаке: анкета → пароль от 6 символов."));
  return h("div", { style: "display:flex;flex-direction:column;gap:14px" },
    podium,
    meCard,
    h("div", { class: "lb-table" },
      h("div", { class: "lb-row head" },
        h("div", null, "#"), h("div", null, T("Ученик")), h("div", { class: "pts" }, T("Очки")),
        h("div", { class: "lb-num" }, T("Попыток")), h("div", { class: "lb-num" }, T("Дней")), h("div", { class: "lb-num" }, T("Средний"))),
      rows),
    h("p", { class: "lb-note" }, T("Показаны имя и первая буква фамилии.") + " " + T("Участвуют ученики с облачным прогрессом.") + " · " + T("Участников") + ": " + pgFmt(d.participants)));
}

/* ----------------------------------------------------------------- theme --- */
function initTheme() {
  const top = document.querySelector(".top-in");
  if (!top || top.querySelector(".theme-toggle")) return;
  const sun = () => svgEl("svg", { viewBox: "0 0 24 24", width: 17, height: 17, fill: "none", stroke: "currentColor", "stroke-width": 1.8, "stroke-linecap": "round" },
    svgEl("circle", { cx: 12, cy: 12, r: 4 }), svgEl("path", { d: "M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" }));
  const moon = () => svgEl("svg", { viewBox: "0 0 24 24", width: 17, height: 17, fill: "none", stroke: "currentColor", "stroke-width": 1.8, "stroke-linecap": "round", "stroke-linejoin": "round" },
    svgEl("path", { d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" }));
  const root = document.documentElement;
  const current = () => root.getAttribute("data-theme") === "light" ? "light" : "dark";
  const btn = h("button", { class: "theme-toggle", type: "button" });
  const paint = () => {
    const light = current() === "light";
    const src = light ? "Включить тёмную тему" : "Включить светлую тему";
    btn.replaceChildren(light ? moon() : sun());
    btn.title = src;
    btn.setAttribute("aria-label", src);
    if (typeof applyLang === "function") applyLang(btn);
  };
  btn.onclick = () => {
    const next = current() === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    store.set("theme", next);
    document.documentElement.style.colorScheme = next;
    paint();
  };
  if (!root.getAttribute("data-theme")) root.setAttribute("data-theme", store.get("theme", "dark") === "light" ? "light" : "dark");
  document.documentElement.style.colorScheme = current();
  top.append(btn);
  paint();
}

/* ---------- pages ---------- */
const RENDER = {
  l1: (it, m, c) => rMatch(it, m, c, "l1"), l2: rL2, l3: (it, m, c) => rMatch(it, m, c, "l3"), l4: rL4,
  b: (it, m, c) => rBeschwerde(it, m, c, "quiz"), bw: (it, m, c) => rBeschwerde(it, m, c, "write"), s1: rS1, s2: rS2, f: rForum, h1: rH1, h2: rH2, h3: rH3, h4: rH4, n: rNotiz, sp1: (it, m, c) => rSprechen1(it, m, c), sp2: (it) => rSprechen2(it), sp3: (it) => rSprechen3(it),
};
const NO_MODE = { f: 1, bw: 1, sp1: 1, sp2: 1, sp3: 1 };
const vidOf = (sec, it) => sec === "bw" || sec === "sp1" ? "w-" + it.id : it.id || "w-F" + it.n;
function bestOf(sec, it) {
  const ids = [vidOf(sec, it)];
  let r = null;
  ids.forEach(id => { const x = resOf(id); if (x && x.max && (!r || x.best / x.max > r)) r = x.best / x.max; });
  return r;
}
const dotCls = (p) => p == null ? "" : p >= .6 ? "ok" : p >= .4 ? "warn" : "bad";
const app = () => $("#app");
const crumbs = (...xs) => h("div", { class: "crumbs" }, xs.map((x, i) => [i ? h("span", null, "›") : null, typeof x === "string" ? h("span", null, x) : x]));
let EXAM = null;

function secForNum(n) {
  if (n <= 5) return "l1"; if (n <= 9) return "l2"; if (n <= 13) return "l3"; if (n <= 18) return "l4"; if (n <= 20) return "b"; if (n === 21) return "bw";
  if (n <= 27) return "h1"; if (n <= 31) return "h2"; if (n <= 35) return "h3"; if (n <= 40) return "h4"; if (n <= 45) return "n";
  if (n <= 51) return "s1"; if (n <= 57) return "s2"; return "f";
}

function viewHome() {
  const ns = store.get("nstat", {}), res = store.get("res", {}), wrong = Object.keys(store.get("wrong", {})).length;
  const days = store.get("days", []).length;
  const tried = Object.keys(res).length;
  const pcts = Object.values(res).filter(r => r.max).map(r => r.last / r.max);
  const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length * 100) + "%" : "—";
  const cells = [];
  for (let n = 1; n <= 58; n++) {
    const s = ns[n]; let cls = "";
    if (s && s[1]) { const p = s[0] / s[1]; cls = p >= .75 ? "l3" : p >= .45 ? "l2" : "l1"; }
    cells.push(h("a", { class: "cell " + cls, href: "#" + secForNum(n), title: s ? `№${n}: верно ${s[0]} из ${s[1]}` : `№${n}: ещё не решали` }, n));
  }
  loadVoices();
  const voiceWarn = TTS && deVoices.length && !deVoices.some(isNatural) ? h("div", { class: "note" }, "В этом браузере нет естественного немецкого голоса, поэтому Hören может звучать по-роботски. На Mac скачайте голос Anna или Petra (Premium), на Windows лучше всего Microsoft Edge (голоса Katja, Conrad «Natural»). ", h("a", { href: "#voice" }, "Настроить голос →"))
    : TTS && !deVoices.length ? h("div", { class: "note" }, "Браузер не нашёл немецкий голос. Откройте страницу в Microsoft Edge или Chrome. ", h("a", { href: "#voice" }, "Подробнее →")) : null;
  const groups = ["Lesen", "Hören", "Schreiben", "Sprechen"].map(g => h("div", { class: "card group" }, h("h2", null, g),
    SECS.filter(s => s.grp === g).map(s => {
      const list = s.list(); const done = list.filter(it => bestOf(s.id, it) != null).length;
      return h("a", { class: "part", href: "#" + s.id }, h("span", { class: "num" }, s.nums),
        h("div", { style: "flex:1;min-width:0" }, h("div", { class: "pt" }, s.t), h("div", { class: "ps" }, `${s.ru} · ${done}/${list.length}`), h("div", { class: "bar" }, h("i", { style: `width:${Math.round(done / list.length * 100)}%` }))));
    })));
  const rndBtn = h("button", { class: "btn", onclick: () => { const s = rnd(SECS.filter(s => !s.id.startsWith("sp") && s.id !== "f")); location.hash = `#${s.id}.${1 + Math.floor(Math.random() * s.list().length)}`; } }, "🎲 Случайное задание");
  return h("div", { class: "wrap" },
    h("div", { class: "hero" },
      h("div", { class: "card stack" },
        h("div", { class: "eyebrow" }, "telc Deutsch B2 · Beruf"),
        h("h1", null, "Тренажёр по билетам экзамена"),
        h("p", { class: "lead", style: "margin:0" }, "Все варианты по частям экзамена: Lesen, Hören с озвучкой, Sprachbausteine, Telefonnotiz, письма с проверкой ИИ и Sprechen с партнёром."),
        h("div", { class: "row" }, h("a", { class: "btn primary", href: "#bw" }, "✍ Писать письма"), h("a", { class: "btn", href: "#learn" }, "📖 Учить наизусть"), h("a", { class: "btn", href: "#exam" }, "Пробный экзамен"), h("a", { class: "btn", href: "#review" }, `Мои ошибки${wrong ? " · " + wrong : ""}`), rndBtn),
        h("div", { class: "stats" },
          h("div", { class: "stat" }, h("div", { class: "v" }, days), h("div", { class: "l" }, "дней занятий")),
          h("div", { class: "stat" }, h("div", { class: "v" }, tried), h("div", { class: "l" }, "заданий пройдено")),
          h("div", { class: "stat" }, h("div", { class: "v" }, avg), h("div", { class: "l" }, "средний результат")),
          h("div", { class: "stat" }, h("div", { class: "v" }, wrong), h("div", { class: "l" }, "вопросов на повтор")))),
      h("div", { class: "card" },
        h("div", { class: "eyebrow" }, "Antwortbogen · задания 1–58"),
        h("div", { class: "sheetgrid" }, cells),
        h("div", { class: "legend" },
          h("span", null, h("i", { style: "background:var(--ok-soft)" }), "уверенно"), h("span", null, h("i", { style: "background:var(--warn-soft)" }), "бывает ошибка"),
          h("span", null, h("i", { style: "background:var(--bad-soft)" }), "слабое место"), h("span", null, h("i", { style: "border:1px solid var(--line)" }), "не решали")))),
    voiceWarn,
    homeStrip(),
    h("div", { class: "groups" }, groups),
    h("div", { class: "card stack" }, h("h2", null, "Как устроен экзамен и сколько нужно"),
      h("div", { class: "tw" }, h("table", { class: "score" },
        h("tr", null, h("th", null, "Часть"), h("th", null, "Задания"), h("th", null, "Баллы")),
        h("tr", null, h("td", null, "Lesen"), h("td", null, "1–20, каждое по 3 балла"), h("td", null, "60")),
        h("tr", null, h("td", null, "Hören"), h("td", null, "22–40 и 41 (причина звонка), каждое по 3 балла, всё звучит один раз"), h("td", null, "60")),
        h("tr", null, h("td", null, "Schreiben"), h("td", null, "письмо-ответ 21 (7), Notiz 42–45 (6), Sprachbausteine 46–57 (6), форум 58 (14) и язык всех текстов (27)"), h("td", null, "60")),
        h("tr", null, h("td", null, "Sprechen"), h("td", null, "Teil 1A/1B/1C, Teil 2, Teil 3, около 16 минут в паре"), h("td", null, "60")))),
      h("p", { class: "small muted", style: "margin:0" }, "Для сдачи нужно в сумме от 144 из 240 баллов (60%). В каждой части желательно от 36 из 60; одна часть может быть от 24 до 36.")));
}

function viewSec(sec) {
  const s = SEC[sec]; const list = s.list();
  const rows = list.map((it, i) => {
    const p = bestOf(sec, it);
    return h("a", { class: "li", href: `#${sec}.${i + 1}` }, h("span", { class: "num" }, i + 1),
      h("div", { class: "grow" }, h("div", { class: "pt" }, s.label(it)), ),
      p == null ? h("span", { class: "chip" }, "не решали") : h("span", { class: "chip " + dotCls(p) }, Math.round(p * 100) + "%"));
  });
  return h("div", { class: "wrap narrow" },
    crumbs(h("a", { href: "#home" }, "Главная"), s.grp),
    h("div", { class: "stack" }, h("h1", null, s.t), h("p", { class: "lead", style: "margin:0" }, s.task)),
    h("div", { class: "row" }, h("a", { class: "btn primary", href: `#${sec}.${1 + Math.floor(Math.random() * list.length)}` }, "🎲 Случайный вариант"), h("span", { class: "small muted" }, `Вариантов: ${list.length} · задания ${s.nums}`)),
    h("div", { class: "card list" }, rows));
}

function variantPicker(sec, idx) {
  const s = SEC[sec]; const list = s.list();
  if (list.length > 18) {
    const sel = h("select", { class: "in", "aria-label": "Вариант", style: "max-width:100%" }, list.map((it, i) => h("option", { value: i + 1, selected: i + 1 === idx }, `${i + 1}. ${s.label(it)}`)));
    sel.onchange = () => { location.hash = `#${sec}.${sel.value}`; };
    return sel;
  }
  return h("div", { class: "variants" }, list.map((it, i) => h("a", { href: `#${sec}.${i + 1}`, class: i + 1 === idx ? "on" : "", title: s.label(it) }, h("span", { class: "d " + dotCls(bestOf(sec, it)) }), i + 1)));
}

function viewItem(sec, idx) {
  const s = SEC[sec]; const list = s.list(); const it = list[idx - 1];
  if (!it) return viewSec(sec);
  const mode = modeStore.get();
  const next = idx < list.length ? `#${sec}.${idx + 1}` : null;
  const vid = vidOf(sec, it);
  const shown = NO_MODE[sec] ? it : shuffleForAttempt(sec, it, attemptSeed(vid));
  const ctx = { restart: () => { resetAttempt(vid); render(); }, next };
  LAST_QZ = null;
  const body = RENDER[sec](shown, NO_MODE[sec] ? "train" : mode, ctx);
  const qz = LAST_QZ;
  return h("div", { class: "wrap" },
    crumbs(h("a", { href: "#home" }, "Главная"), h("a", { href: "#" + sec }, s.t), s.label(it)),
    h("div", { class: "spread" }, h("div", { class: "stack", style: "gap:4px" }, h("div", { class: "eyebrow" }, `${s.grp} · задания ${s.nums}`), h("h1", null, s.t + " · " + s.label(it))),
      h("div", { class: "row" }, idx > 1 ? h("a", { class: "btn small", href: `#${sec}.${idx - 1}` }, "←") : null, next ? h("a", { class: "btn small", href: next }, "→") : null)),
    variantPicker(sec, idx),
    h("p", { class: "lead", style: "margin:0" }, s.task),
    NO_MODE[sec] ? null : modeSwitch(mode, (m) => { modeStore.set(m); render(); }),
    PAPER_SECS.includes(sec) ? h("label", { class: "row small" }, h("input", { type: "checkbox", checked: store.get("paper", true), onchange: (e) => { store.set("paper", e.target.checked); render(); } }), "Бланк как на экзамене") : null,
    NO_MODE[sec] ? null : srcNote(it.src),
    paperOn(sec) ? sheetEl(sec, s, it, body, qz) : body);
}

/* exam-paper skin: telc-like Prüfungsbogen around the test */
const PAPER_SECS = ["l1", "l2", "l3", "l4", "b", "s1", "s2", "h1", "h2", "h3", "h4", "n"];
const paperOn = (sec) => PAPER_SECS.includes(sec) && store.get("paper", true);
// booklet header per part: [subtest on the side tab, minutes in the header, title, "Teil …", answer-sheet page]
const PAPER_HEAD = {
  l1: ["Lesen", "45 Minuten", "Lesen", "Teil 1", 3], l2: ["Lesen", "45 Minuten", "Lesen", "Teil 2", 3], l3: ["Lesen", "45 Minuten", "Lesen", "Teil 3", 3], l4: ["Lesen", "45 Minuten", "Lesen", "Teil 4", 3],
  b: ["Lesen und Schreiben", "20 Minuten", "Lesen und Schreiben", "", 3],
  h1: ["Hören", "20 Minuten", "Hören", "Teil 1", 4], h2: ["Hören", "20 Minuten", "Hören", "Teil 2", 4], h3: ["Hören", "20 Minuten", "Hören", "Teil 3", 4], h4: ["Hören", "20 Minuten", "Hören", "Teil 4", 4],
  n: ["Hören und Schreiben", "5 Minuten", "Hören und Schreiben", "", 6],
  s1: ["Sprachbausteine und Schreiben", "35 Minuten", "Sprachbausteine", "Teil 1", 4], s2: ["Sprachbausteine und Schreiben", "35 Minuten", "Sprachbausteine", "Teil 2", 4],
};
// answer-sheet section of each part: [panel title, icon]
const BOGEN_SEC = { l: ["Lesen", "book"], b: ["Lesen", "book"], h: ["Hören", "speaker"], s: ["Sprachbausteine", "blocks"] };
const ICONS = {
  book: '<svg viewBox="0 0 24 24"><path d="M6 3h11l1 1v16l-1 1H6l-1-1V4z" fill="currentColor"/><path d="M8 3v18" stroke="#fff" stroke-opacity=".35"/></svg>',
  speaker: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>',
  blocks: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" fill="currentColor"/><rect x="13" y="3" width="8" height="8" fill="currentColor"/><rect x="13" y="13" width="8" height="8" fill="currentColor"/></svg>',
  pencil: '<svg viewBox="0 0 24 24"><path d="M15.5 4.5l4 4L9 19l-5 1 1-5z" fill="currentColor"/></svg>',
  talk: '<svg viewBox="0 0 24 24"><path d="M4 5h16v10H9l-4 4v-4H4z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
};
const icon = (k) => { const s = h("span", { class: "ico", "aria-hidden": "true" }); s.innerHTML = ICONS[k]; return s; };
const PAPER_DE = {
  l1: "Lesen Sie zuerst die Aufgaben 1 bis 5 und dann die Anzeigen a bis h. Welche Anzeige passt zu wem? Sie können jede Anzeige nur einmal verwenden. Markieren Sie Ihre Lösungen für die Aufgaben 1–5 auf dem Antwortbogen.",
  l2: "Lesen Sie den Text und die Aufgaben 6 bis 9. Ist die Aussage richtig oder falsch und welche Antwort (a, b oder c) passt am besten? Markieren Sie Ihre Lösungen für die Aufgaben 6–9 auf dem Antwortbogen.",
  l3: "Lesen Sie die Beiträge 10 bis 13 und die Antworten a bis f. Welche Antwort passt zu welchem Beitrag? Wenn keine Antwort passt, markieren Sie X. Markieren Sie Ihre Lösungen für die Aufgaben 10–13 auf dem Antwortbogen.",
  l4: "Lesen Sie das Protokoll und die Aufgaben 14 bis 18. Welche Antwort (a, b oder c) passt am besten? Markieren Sie Ihre Lösungen für die Aufgaben 14–18 auf dem Antwortbogen.",
  b: "Ihre Teamleitung leitet Ihnen die E-Mail einer Kundin / eines Kunden weiter und bittet Sie zu antworten. Welche Lösung (a, b oder c) passt am besten? Markieren Sie Ihre Lösungen für die Aufgaben 19 und 20 auf dem Antwortbogen.",
  s1: "Lesen Sie den Text und entscheiden Sie, welche Lösung (a–j) in die Lücken 46–51 passt. Jedes Wort passt nur einmal. Nicht alle Wörter passen in den Text. Markieren Sie Ihre Lösungen auf dem Antwortbogen.",
  s2: "Lesen Sie den Text und entscheiden Sie, welche Lösung (a, b oder c) in die Lücken 52–57 passt. Markieren Sie Ihre Lösungen auf dem Antwortbogen.",
  h1: "Sie hören drei Gespräche. Zu jedem Gespräch gibt es zwei Aufgaben. Ist die Aussage dazu richtig oder falsch und welche Antwort (a, b oder c) passt am besten? Markieren Sie Ihre Lösungen für die Aufgaben 22–27 auf dem Antwortbogen.",
  h2: "Sie hören vier Gespräche. Welcher der Sätze a–f passt am besten zu welchem Gespräch? Markieren Sie Ihre Lösungen für die Aufgaben 28–31 auf dem Antwortbogen.",
  h3: "Sie hören eine Präsentation. Welche Antwort (a, b oder c) passt am besten? Markieren Sie Ihre Lösungen für die Aufgaben 32–35 auf dem Antwortbogen.",
  h4: "Sie hören fünf telefonische Mitteilungen. Zu jeder Mitteilung gibt es eine Aufgabe. Welche Lösung (a, b oder c) passt am besten? Markieren Sie Ihre Lösungen für die Aufgaben 36–40 auf dem Antwortbogen.",
  n: "Sie hören eine telefonische Mitteilung. Informieren Sie Ihre Kollegin. 41: Wählen Sie den Grund für den Anruf (a, b oder c). 42–45: Notieren Sie Name, Telefonnummer, weitere Informationen und was zu erledigen ist, direkt auf dem Antwortbogen. Sie hören die Mitteilung einmal.",
};
// candidate data from the cover page of the Antwortbogen S30 (mock exam), shown in each sheet header
const cand = () => store.get("cand", { fam: "", vor: "" });
function bogenHead() {
  const c = cand();
  const boxes = (v, n) => h("span", { class: "bx" }, Array.from({ length: n }, (_, i) => h("i", null, (v || "")[i] || "")));
  return h("div", { class: "bg-data" },
    h("div", null, boxes(c.fam.toUpperCase(), 20), h("small", null, "Familienname · Surname · Nom · Cognome · Soyadı · Фамилия")),
    h("div", null, boxes(c.vor.toUpperCase(), 20), h("small", null, "Vorname · First Name · Prénom · Nome · Adı · Имя")));
}
// one Antwortbogen panel (Lesen / Hören / Sprachbausteine) with the rows of the current task
function bogenPanel(sec, qz) {
  const hd = PAPER_HEAD[sec]; const [title, ic] = BOGEN_SEC[sec[0]] || BOGEN_SEC.l;
  const teil = sec === "b" ? "Lesen und Schreiben" : hd[3];
  return h("aside", { class: "bogen", "aria-label": "Antwortbogen" },
    h("div", { class: "bg-top" }, h("b", null, "Deutsch-Test für den Beruf B2"), h("span", { class: "bg-pg" }, "Antwortbogen · Seite " + hd[4])),
    bogenHead(),
    h("div", { class: "bg-sub" }, "Schriftliche Prüfung"),
    h("div", { class: "bg-panel" }, h("span", { class: "bg-ico" }, icon(ic)), h("div", { class: "bg-ttl" }, title), h("div", { class: "bg-teil" }, teil), qz.bogen()));
}
function sheetEl(sec, s, it, body, qz) {
  const hd = PAPER_HEAD[sec] || [s.grp, "", s.grp, s.t, 0];
  const ic = sec === "n" || sec === "b" ? "pencil" : (BOGEN_SEC[sec[0]] || BOGEN_SEC.l)[1];
  const booklet = h("div", { class: "bk" },
    h("div", { class: "bk-side" }, icon(ic), h("span", { class: "bk-vert" }, hd[0])),
    h("div", { class: "bk-main" },
      h("div", { class: "bk-head" }, h("span", null, hd[1] + " "), h("b", null, hd[0])),
      sec.match(/^(l1|h1|s1)$/) ? h("div", { class: "bk-big" }, "Schriftliche Prüfung") : null,
      h("h2", { class: "bk-title" }, h("b", null, hd[2]), hd[3] ? h("span", null, " " + hd[3]) : null),
      h("div", { class: "bk-inst" }, PAPER_DE[sec] || ""),
      body,
      h("div", { class: "bk-foot" }, h("span", null, "Формулировка заданий дана по образцу telc, оригинальный бланк может немного отличаться."), h("b", null, "Deutsch-Test für den Beruf B2"))));
  return h("div", { class: "sheet" + (qz ? " desk" : "") }, booklet, qz ? bogenPanel(sec, qz) : null);
}

function viewReview() {
  const w = store.get("wrong", {});
  const by = {};
  Object.values(w).forEach(x => { if (!SEC[x.sec]) return; (by[x.vid] = by[x.vid] || { sec: x.sec, ns: new Set() }).ns.add(x.n); });
  const entries = Object.entries(by).map(([vid, g]) => {
    const list = SEC[g.sec].list(); const i = list.findIndex(it => vidOf(g.sec, it) === vid);
    return i < 0 ? null : { vid, sec: g.sec, idx: i + 1, it: list[i], ns: [...g.ns].sort((a, b) => a - b) };
  }).filter(Boolean).sort((a, b) => SECS.indexOf(SEC[a.sec]) - SECS.indexOf(SEC[b.sec]));
  const weak = Object.entries(store.get("nstat", {})).filter(([, s]) => s[1] >= 2 && s[0] / s[1] < .5).map(([n]) => +n).sort((a, b) => a - b);
  return h("div", { class: "wrap narrow" },
    crumbs(h("a", { href: "#home" }, "Главная"), "Ошибки"),
    h("h1", null, "Повторить ошибки"),
    h("p", { class: "lead", style: "margin:0" }, "Здесь варианты, где вы последний раз ответили неверно. Когда ответите правильно, вопрос сам исчезнет из списка."),
    weak.length ? h("div", { class: "note info" }, "Чаще всего ошибки в заданиях №", weak.join(", "), ". Начните с них.") : null,
    entries.length ? h("div", { class: "card list" }, entries.map(e => h("a", { class: "li", href: `#${e.sec}.${e.idx}` }, h("span", { class: "num" }, SEC[e.sec].nums),
      h("div", { class: "grow" }, h("div", { class: "pt" }, `${SEC[e.sec].t} · ${SEC[e.sec].label(e.it)}`), h("div", { class: "ps small muted" }, "Ошибки в №" + e.ns.join(", "))),
      h("span", { class: "chip bad" }, e.ns.length))))
      : h("div", { class: "card" }, h("p", { style: "margin:0" }, "Ошибок пока нет. Решите несколько вариантов, и здесь появятся вопросы для повторения."), h("p", null, h("a", { class: "btn primary", href: "#exam" }, "Пробный экзамен"))));
}

function viewVoice() {
  loadVoices();
  const c = vcfg();
  const box = h("div", { class: "stack", "data-voices": "" });
  const fill = () => {
    loadVoices();
    if (!TTS) { box.replaceChildren(h("div", { class: "note" }, "Этот браузер не умеет озвучивать текст. Откройте тренажёр в Microsoft Edge или Chrome.")); return; }
    if (!deVoices.length) { box.replaceChildren(h("div", { class: "note" }, "Немецких голосов не найдено. В Edge и Chrome они есть сразу; на iPhone: Настройки → Универсальный доступ → Устной контент → Голоса → Deutsch, скачайте «Anna (улучшенный)»."), h("button", { class: "btn", onclick: fill }, "Проверить ещё раз")); return; }
    const mkSel = (g) => {
      const sel = h("select", { class: "in", id: "v-" + g }, h("option", { value: "" }, "Автовыбор (лучший голос)"), deVoices.map(v => h("option", { value: v.name, selected: c[g] === v.name }, `${v.name}${isNatural(v) ? " ★" : ""}`)));
      sel.onchange = () => { const x = vcfg(); x[g] = sel.value; store.set("voice", x); };
      return sel;
    };
    const rate = h("input", { type: "range", min: "0.75", max: "1.2", step: "0.05", value: c.rate || 1, id: "v-rate", style: "width:100%" });
    const rl = h("span", { class: "mono small" }, (c.rate || 1).toFixed(2) + "×");
    rate.oninput = () => { const x = vcfg(); x.rate = +rate.value; store.set("voice", x); rl.textContent = (+rate.value).toFixed(2) + "×"; };
    const nat = deVoices.filter(isNatural);
    const na = new Set(Object.values(AUDIO)).size;
    box.replaceChildren(
      h("div", { class: "card stack" },
        h("div", { class: "voice" },
          h("label", { for: "v-f" }, "Женский голос"), mkSel("f"), speakBtn("Guten Tag, hier spricht Frau Möller von der Firma Elektro Schneider. Bitte rufen Sie mich unter null sieben elf, zwei drei vier fünf zurück.", "f"),
          h("label", { for: "v-m" }, "Мужской голос"), mkSel("m"), speakBtn("Hallo, ich bin Markus aus der Werkstatt. Können wir morgen früh kurz über den neuen Schichtplan sprechen?", "m"),
          h("label", { for: "v-rate" }, "Скорость"), rate, rl)),
      h("div", { class: "card stack" }, h("h3", null, `Немецкие голоса в этом браузере: ${deVoices.length}`),
        h("p", { class: "small muted", style: "margin:0" }, nat.length ? `Естественных (★): ${nat.length}. Они выбираются автоматически, а у каждого собеседника в диалоге свой голос.` : "Естественных голосов нет: звучание будет механическим."),
        h("div", { class: "list" }, deVoices.slice(0, 30).map(v => h("div", { class: "li" }, h("div", { class: "grow" }, v.name, h("span", { class: "small muted" }, " · " + v.lang)),
          isNatural(v) ? h("span", { class: "chip ok" }, "естественный") : h("span", { class: "chip" }, "обычный"), h("span", { class: "chip" }, voiceGender(v) === "m" ? "муж." : voiceGender(v) === "f" ? "жен." : "?"))))));
  };
  box._refresh = fill; fill();
  return h("div", { class: "wrap narrow" },
    crumbs(h("a", { href: "#home" }, "Главная"), "Голос"),
    h("h1", null, "Голос диктора"),
    h("p", { class: "lead", style: "margin:0" }, "Озвучка идёт через голоса вашего браузера. Самые живые голоса, почти как на экзамене:"),
    h("div", { class: "note info" }, h("b", null, "Mac: "), "Системные настройки → Универсальный доступ → Устной контент → Системный голос → Управлять голосами → Немецкий: скачайте Anna (Premium), Petra (Premium) или Markus/Yannick (Premium), затем перезапустите браузер. Лучше всего в Safari или Chrome. ", h("b", null, "Windows: "), "Microsoft Edge, голоса «Katja Online (Natural)», «Seraphina», «Conrad», «Killian». ", h("b", null, "Chrome: "), "«Google Deutsch». ", h("b", null, "iPhone / Mac: "), "скачайте улучшенный голос Anna или Helena в настройках «Устной контент». ", h("b", null, "Android: "), "Google TTS → Deutsch, скачайте голос высокого качества."),
    box);
}

/* ---------- mock exam ---------- */
function newExam() {
  TRY_SEEDS.clear();
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const bq = pick(DB.B.filter(b => b.qs.length));
  const steps = [
    { sec: "l1", it: pick(DB.L1), part: "Lesen", t: "Lesen 1", per: 3 },
    { sec: "l2", it: pick(DB.L2.filter(x => x.part === 1)), part: "Lesen", t: "Lesen 2 · Text 1", per: 3 },
    { sec: "l2", it: pick(DB.L2.filter(x => x.part === 2)), part: "Lesen", t: "Lesen 2 · Text 2", per: 3 },
    { sec: "l3", it: pick(DB.L3), part: "Lesen", t: "Lesen 3", per: 3 },
    { sec: "l4", it: pick(DB.L4), part: "Lesen", t: "Lesen 4", per: 3 },
    { sec: "b", it: bq, only: "quiz", part: "Lesen", t: "Beschwerde 19–20", per: 3 },
    { sec: "bw", it: bq, only: "write", part: "Schreiben", t: "Письмо 21", write: true },
    { sec: "h1", it: pick(DB.H1), part: "Hören", t: "Hören 1", per: 3 },
    { sec: "h2", it: pick(DB.H2), part: "Hören", t: "Hören 2", per: 3 },
    { sec: "h3", it: pick(DB.H3), part: "Hören", t: "Hören 3", per: 3 },
    { sec: "h4", it: pick(DB.H4), part: "Hören", t: "Hören 4", per: 3 },
    { sec: "n", it: pick(DB.N), part: "Notiz", t: "Telefonnotiz" },
    { sec: "s1", it: pick(DB.S1), part: "Schreiben", t: "Sprachbausteine 1", per: 0.5 },
    { sec: "s2", it: pick(DB.S2), part: "Schreiben", t: "Sprachbausteine 2", per: 0.5 },
    { sec: "f", it: pick(DB.F), part: "Schreiben", t: "Форум 58", write: true },
  ];
  return { steps, i: -1, res: {} };
}
function examScore(E) {
  const P = { Lesen: 0, "Hören": 0, Schreiben: 0 };
  const notes = [];
  E.steps.forEach((s, i) => {
    const r = E.res[i]; if (!r) { if (s.write) notes.push(s.t + ": не оценено"); return; }
    if (s.part === "Notiz") { if (r.pts) { P["Hören"] += r.pts.h; P.Schreiben += r.pts.s; } else { const f = r.sc / r.mx; P["Hören"] += 3 * f; P.Schreiben += 6 * f; } }
    else if (s.write) P.Schreiben += r.sc;
    else P[s.part] += r.sc * s.per;
  });
  Object.keys(P).forEach(k => P[k] = Math.round(P[k] * 10) / 10);
  return { P, notes };
}
// the written exam runs in three timed blocks (telc DTB B2): Lesen 65 min, Hören 25 min, Sprachbausteine und Schreiben 35 min
const EXAM_BLOCKS = { A: ["Lesen · Lesen und Schreiben", 65], B: ["Hören · Hören und Schreiben", 25], C: ["Sprachbausteine und Schreiben", 35] };
const blockOf = (sec) => /^(l|b)/.test(sec) ? "A" : /^(h|n)/.test(sec) ? "B" : "C";
function blockTimer(E, sec) {
  const k = blockOf(sec), [name, min] = EXAM_BLOCKS[k];
  E.t0 = E.t0 || {}; if (!E.t0[k]) E.t0[k] = Date.now();
  const out = h("span", { class: "mono" });
  const box = h("div", { class: "examtimer" }, h("span", null, name), out);
  const tick = () => {
    if (box._shown && !box.isConnected) return clearInterval(iv); // page left: stop
    box._shown = box.isConnected;
    const left = Math.round((E.t0[k] + min * 60000 - Date.now()) / 1000);
    out.textContent = left > 0 ? `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}` : "Zeit ist um";
    box.classList.toggle("over", left <= 0); box.classList.toggle("soon", left > 0 && left <= 300);
  };
  const iv = setInterval(tick, 1000); tick();
  return box;
}
// cover page of the Antwortbogen S30: before the exam the candidate fills in the data fields
function coverEl() {
  const c = cand();
  const inp = (k, label) => { const i = h("input", { class: "in", value: c[k] || "", maxlength: 20, autocomplete: "off", "aria-label": label, oninput: () => { const x = cand(); x[k] = i.value; store.set("cand", x); } }); return h("label", { class: "cv-f" }, i, h("small", null, label)); };
  return h("div", { class: "cover" },
    h("div", { class: "cv-head" }, h("b", null, "Deutsch-Test für den Beruf"), h("span", null, "Antwortbogen S30")),
    h("p", { class: "small", style: "margin:0" }, "Как на экзамене: перед началом заполните данные на бланке ответов. Они появятся в шапке каждой страницы бланка."),
    inp("fam", "Familienname · Surname · Nom · Cognome · Soyadı · Фамилия"),
    inp("vor", "Vorname · First Name · Prénom · Nome · Adı · Имя"));
}
function viewExam() {
  if (!EXAM) EXAM = newExam();
  const E = EXAM;
  const steps = h("div", { class: "examsteps" }, E.steps.map((s, i) => h("span", { class: i === E.i ? "on" : E.res[i] ? "done" : "" }, s.t)));
  if (E.i < 0) {
    return h("div", { class: "wrap narrow" },
      crumbs(h("a", { href: "#home" }, "Главная"), "Пробный экзамен"),
      h("h1", null, "Пробный экзамен"),
      h("p", { class: "lead", style: "margin:0" }, "Случайный вариант каждой части, как на настоящем экзамене: ответы проверяются в конце части, каждое аудио звучит один раз, транскрипт скрыт. Письма проверяет ИИ; если нет времени, письмо можно пропустить."),
      steps,
      h("div", { class: "card stack" }, h("div", { class: "eyebrow" }, "Время на экзамене"),
        h("p", { style: "margin:0" }, "Lesen + Lesen und Schreiben: 65 минут · Hören + Hören und Schreiben: 25 минут · Sprachbausteine + Schreiben: 35 минут. Всего 125 минут. Таймер блока идёт с первой части блока, паузу между блоками можно делать."),
        coverEl(),
        h("div", { class: "row" }, h("button", { class: "btn primary", onclick: () => { E.i = 0; render(); } }, "Начать экзамен"), h("button", { class: "btn", onclick: () => { EXAM = newExam(); render(); } }, "🎲 Другие варианты"))));
  }
  if (E.i >= E.steps.length) return examResult(E, steps);
  const s = E.steps[E.i];
  const done = !!E.res[E.i];
  const last = E.i === E.steps.length - 1;
  const label = (d) => last ? (d ? "Посмотреть результат →" : "Пропустить и посмотреть результат →") : d ? "Следующая часть →" : "Пропустить часть →";
  const nexts = [0, 1].map(() => h("button", { class: "btn " + (done ? "primary" : ""), onclick: () => { E.i++; render(); } }, label(done)));
  const mark = (sc, mx, pts) => { E.res[E.i] = { sc, mx, pts }; nexts.forEach(b => { b.className = "btn primary"; b.textContent = label(true); }); };
  const ctx = { onDone: mark, onWriteDone: mark, onSkip: () => { E.i++; render(); } };
  const S = SEC[s.sec];
  const timer = blockTimer(E, s.sec);
  LAST_QZ = null;
  const shown = shuffleForAttempt(s.sec, s.it, attemptSeed(vidOf(s.sec, s.it)));
  const body = s.only ? rBeschwerde(shown, "exam", ctx, s.only) : RENDER[s.sec](shown, "exam", ctx);
  const qz = LAST_QZ;
  return h("div", { class: "wrap" },
    crumbs(h("a", { href: "#home" }, "Главная"), "Пробный экзамен", `часть ${E.i + 1} из ${E.steps.length}`),
    steps, timer,
    h("div", { class: "spread" }, h("div", { class: "stack", style: "gap:4px" }, h("div", { class: "eyebrow" }, `${S.grp} · задания ${s.only === "quiz" ? "19–20" : s.only === "write" ? "21" : S.nums}`), h("h1", null, s.t)), nexts[0]),
    h("p", { class: "lead", style: "margin:0" }, s.only === "quiz" ? "Прочитайте записку и письмо клиента и ответьте на вопросы 19–20. Письмо напишете на следующем шаге." : S.task),
    paperOn(s.sec === "b" || !s.only ? s.sec : "x") ? sheetEl(s.sec, S, shown, body, qz) : body,
    h("div", { class: "row", style: "justify-content:flex-end" }, nexts[1]));
}
function examResult(E, steps) {
  const { P, notes } = examScore(E);
  const cls = (v) => v >= 36 ? "ok" : v >= 24 ? "warn" : "bad";
  const parts = Object.entries(P);
  const strong = parts.filter(([, v]) => v >= 36).length, mid = parts.filter(([, v]) => v >= 24 && v < 36).length;
  const sum = Math.round(parts.reduce((a, [, v]) => a + v, 0) * 10) / 10;
  const pass = strong === 3 || (strong === 2 && mid === 1);
  const rows = E.steps.map((s, i) => { const r = E.res[i]; const pts = !r ? null : s.write ? r.sc : s.part === "Notiz" ? (r.pts ? Math.round((r.pts.h + r.pts.s) * 10) / 10 : Math.round(9 * r.sc / r.mx * 10) / 10) : r.sc * s.per;
    const mx = s.write ? (s.sec === "f" ? 29 : 19) : s.part === "Notiz" ? 9 : (r ? r.mx : 0) * s.per;
    return h("tr", null, h("td", null, s.t), h("td", null, SEC[s.sec].label(s.it)), h("td", { class: "mono" }, pts == null ? "—" : `${pts}${mx ? " / " + mx : ""}`)); });
  return h("div", { class: "wrap narrow" },
    crumbs(h("a", { href: "#home" }, "Главная"), "Пробный экзамен", "Результат"),
    steps,
    h("h1", null, "Результат пробного экзамена"),
    h("div", { class: "card stack" },
      h("div", { class: "stats" }, parts.map(([k, v]) => h("div", { class: "stat" }, h("div", { class: "v" }, `${v}`, h("span", { class: "small muted" }, " / 60")), h("div", { class: "l" }, h("span", { class: "chip " + cls(v) }, k))))),
      h("div", { class: "note " + (pass ? "info" : "") }, pass ? `Письменная часть сдана: ${sum} из 180. Так держать!` : `Пока ${sum} из 180. Нужно от 36 баллов в каждой части (одна может быть 24–36). Посмотрите «Ошибки» и повторите слабые части.`),
      notes.length ? h("p", { class: "small muted", style: "margin:0" }, notes.join(" · ") + ". Неоценённые письма считаются как 0.") : null,
      h("p", { class: "small muted", style: "margin:0" }, "Sprechen (ещё 60 баллов) здесь не считается: тренируйте его в разделе Sprechen с ИИ.")),
    h("div", { class: "card tw" }, h("table", { class: "score" }, h("tr", null, h("th", null, "Часть"), h("th", null, "Вариант"), h("th", null, "Баллы")), rows)),
    h("div", { class: "row" }, h("button", { class: "btn primary", onclick: () => { EXAM = newExam(); render(); } }, "Новый пробный экзамен"), h("a", { class: "btn", href: "#review" }, "Мои ошибки")));
}

/* ---------- router ---------- */
function updateNav() {
  const n = Object.keys(store.get("wrong", {})).length;
  const a = document.querySelector('.nav a[href="#review"]'); if (!a) return;
  let c = a.querySelector(".cnt");
  if (!n) { if (c) c.remove(); return; }
  if (!c) { c = h("span", { class: "cnt" }); a.append(c); }
  c.textContent = n;
}
/* ---------- candidate data: the cover page of the Antwortbogen S30, filled in on the first visit ----------
   Stored only in this browser (localStorage), never sent anywhere. */
const LANG_CODES = [["001", "Deutsch"], ["002", "English"], ["003", "Français"], ["004", "Español"], ["005", "Italiano"], ["006", "Português"], ["007", "Magyar"],
  ["008", "Polski"], ["009", "Русский язык"], ["010", "Český jazyk"], ["011", "Türkçe"], ["012", "عربي"], ["013", "汉语"], ["000", "andere/other"]];
const L7 = (de, en, fr, it, tr, ru) => [de, en, fr, it, tr, ru].join(" · ");
function viewProfile(first) {
  const c = cand();
  const dm = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(c.geb || ""); // older entries were typed as TT.MM.JJJJ
  if (dm) c.geb = `${dm[3]}-${dm[2].padStart(2, "0")}-${dm[1].padStart(2, "0")}`;
  const boxIn = (k, label, n, extra) => h("label", { class: "cv-row" }, h("input", { class: "boxin", name: k, value: c[k] || "", maxlength: n, autocomplete: "off", spellcheck: "false", style: `--n:${n}`, ...extra }), h("small", null, label));
  const dateIn = (k, label) => h("label", { class: "cv-row" }, h("input", { class: "datein", type: "date", name: k, value: c[k] || "" }), h("small", null, label));
  const lang = h("select", { class: "datein", name: "sprache" }, h("option", { value: "" }, "—"), LANG_CODES.map(([v, l]) => h("option", { value: v, selected: c.sprache === v }, `${v} - ${l}`)));
  const sex = ["m", "w"].map(v => h("label", { class: "cv-sex" }, h("input", { type: "radio", name: "geschl", value: v, checked: c.geschl === v }),
    v === "m" ? L7("männlich", "male", "masculin", "maschile", "erkek", "мужской") : L7("weiblich", "female", "féminin", "femminile", "kadın", "женский")));
  const err = h("p", { class: "cv-err", hidden: true }, "Укажите фамилию и имя.");
  const form = h("form", { class: "s30", autocomplete: "off" },
    h("div", { class: "s30-top" }, h("span", { class: "s30-code" }, "1 0 1 3"), h("span", { class: "s30-bar", "aria-hidden": "true" })),
    h("div", { class: "s30-title" }, "Deutsch-Test für den Beruf"),
    h("div", { class: "s30-ver" }, h("span", { class: "boxes4" }), h("b", null, "-S10-"), h("span", { class: "boxes6" }), h("small", null, L7("Testversion", "Test Version", "Version d'examen", "Versione d'esame", "Sınav sürümü", "Тестовая версия"))),
    h("div", { class: "s30-data" },
      boxIn("fam", L7("Familienname", "Surname", "Nom", "Cognome", "Soyadı", "Фамилия"), 30, { required: true }),
      boxIn("vor", L7("Vorname", "First Name", "Prénom", "Nome", "Adı", "Имя"), 30, { required: true }),
      dateIn("geb", L7("Geburtsdatum", "Date of Birth", "Date de naissance", "Data di nascita", "Doğum tarihi", "Дата рождения")),
      boxIn("gort", L7("Geburtsort", "Place of Birth", "Lieu de naissance", "Luogo di nascita", "Doğum yeri", "Место рождения"), 30),
      h("label", { class: "cv-row" }, lang, h("small", null, L7("Erstsprache", "First Language", "Langue maternelle", "Madrelingua", "Anadili", "Родной язык"))),
      h("div", { class: "cv-row" }, h("div", { class: "cv-sexes" }, sex), h("small", null, L7("Geschlecht", "Sex", "Sexe", "Sesso", "Cinsiyeti", "Пол"))),
      boxIn("str", L7("Straße und Hausnummer", "Street and number", "Rue et numéro", "Via e numero civico", "Sokak ve numara", "Улица и дом"), 30),
      boxIn("ort", L7("Postleitzahl und Ort", "Postcode and town", "Code postal et ville", "CAP e città", "Posta kodu ve şehir", "Индекс и город"), 30),
      boxIn("zentrum", L7("Prüfungszentrum", "Examination Centre", "Centre d'examen", "Centro d'esame", "Sınav merkezi", "Экзаменационное учреждение"), 30),
      dateIn("datum", L7("Prüfungsdatum", "Date of Examination", "Date d'examen", "Data dell'esame", "Sınav tarihi", "Дата экзамена"))),
    h("label", { class: "cv-row" }, h("input", { class: "datein", type: "password", name: "pw", autocomplete: "new-password", placeholder: "••••••", minlength: 6 }), h("small", null, "Kennwort zum Speichern in der Cloud (optional, mindestens 6 Zeichen)")),
    err,
    h("div", { class: "s30-foot" }, h("b", null, "Antwortbogen S30"), h("span", null, "www.telc.net")));
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form), x = {};
    for (const [k, v] of fd.entries()) x[k] = String(v).trim();
    const pw = x.pw || ""; delete x.pw;
    if (!x.fam || !x.vor) { err.textContent = "Укажите фамилию и имя."; err.hidden = false; return; }
    if (pw && pw.length < 6) { err.textContent = "Das Kennwort ist zu kurz (mindestens 6 Zeichen)."; err.hidden = false; return; }
    store.set("cand", { ...x, done: true });
    if (pw) {
      err.hidden = true; const btn = document.querySelector(".btn.primary"); if (btn) btn.disabled = true;
      try { await cloudConnect({ ...x }, pw); }
      catch (ex) { if (btn) btn.disabled = false; err.textContent = cloudErrText(ex); err.hidden = false; if (ex.msg === "PW") { store.set("cand", { ...cand(), done: false }); return; } await new Promise(r => setTimeout(r, 2500)); }
    }
    location.hash = first ? (location.hash && location.hash !== "#profile" ? location.hash : "#home") : "#home";
    render();
  };
  const del = first ? null : h("button", { type: "button", class: "btn ghost", onclick: () => { cloudOff(cloudOn()); store.set("cand", { fam: "", vor: "" }); render(); } }, "Сменить участника");
  return h("div", { class: "wrap narrow" },
    first ? null : crumbs(h("a", { href: "#home" }, "Главная"), "Данные участника"),
    h("p", { class: "lead", style: "margin:0" }, "Как на экзамене: заполните данные участника. Без пароля они и ваш прогресс хранятся только в этом браузере. С паролем прогресс сохраняется в облаке, и на другом устройстве достаточно ввести те же фамилию, имя, дату рождения и пароль."),
    form,
    h("div", { class: "row" }, h("button", { class: "btn primary", onclick: () => form.requestSubmit() }, first ? "Начать тренировку" : "Сохранить"), del));
}
// header badge: who is signed in on this device
function updateWho() {
  const top = document.querySelector(".top-in"); if (!top) return;
  let a = top.querySelector(".who");
  const c = cand();
  if (!c.done) { if (a) a.remove(); return; }
  if (!a) { a = h("a", { class: "who", href: "#profile", title: "Данные участника" }); top.insertBefore(a, top.querySelector(".langsw")); }
  const kids = [h("span", { class: "who-ico", "aria-hidden": "true" }, "👤"), h("span", null, `${c.vor} ${c.fam}`)];
  if (cloudOn()) kids.push(h("span", { class: "who-ico", title: "Cloud", "aria-hidden": "true" }, "☁"));
  a.replaceChildren(...kids);
}
function render() {
  stopAll();
  const r = (location.hash || "#home").slice(1);
  const [sec, idx] = r.split(".");
  let v;
  if (!cand().done && sec !== "profile") v = viewProfile(true);
  else if (sec === "profile") v = viewProfile(false);
  else if (sec === "review") v = viewReview();
  else if (sec === "exam") v = viewExam();
  else if (sec === "voice") v = viewVoice();
  else if (sec === "learn") v = viewLearn();
  else if (sec === "progress") v = viewProgress();
  else if (sec === "leaderboard") v = viewLeaderboard();
  else if (SEC[sec]) v = idx ? viewItem(sec, +idx) : viewSec(sec);
  else v = viewHome();
  app().replaceChildren(v);
  const top = ["home", "review", "exam", "voice", "learn", "progress", "leaderboard"].includes(sec) ? sec : "home";
  document.querySelectorAll(".nav a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + (SEC[sec] ? "" : top)));
  refreshAI(); updateNav(); updateWho();
}
let lastHash = location.hash;
window.addEventListener("hashchange", () => { render(); if (location.hash !== lastHash) window.scrollTo(0, 0); lastHash = location.hash; });
try { localStorage.removeItem("dtb.mode"); } catch {}
initTheme();
initLang();
cloudBoot(() => render());
audioReady.then(render);
})();
