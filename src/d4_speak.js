/* ---------- Sprechen: speak the answer, the browser turns it into text (Web Speech API, de-DE) ----------
   The recognition runs in the browser and its own service (Google in Chrome, Microsoft in Edge, Apple in Safari).
   No audio is ever sent to our server: the page only receives the recognised text. Firefox has no SpeechRecognition,
   so there the learner types the answer by hand. */
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition || null;
const SR_FATAL = { "not-allowed": 1, "service-not-allowed": 1, "audio-capture": 1, "network": 1, "language-not-supported": 1 };
const SR_ERR = {
  "not-allowed": "Доступ к микрофону запрещён. Разрешите микрофон для этого сайта (значок замка или микрофона в адресной строке) и нажмите кнопку ещё раз.",
  "service-not-allowed": "Браузер не разрешил распознавание речи. На iPhone и Mac включите диктовку (Настройки → Клавиатура → Диктовка) или введите ответ вручную.",
  "audio-capture": "Микрофон не найден. Подключите микрофон или закройте программу, которая его занимает.",
  "network": "Распознавание речи сейчас не работает: нет связи с сервисом браузера. В Brave, Opera и некоторых других браузерах оно отключено. Откройте Chrome, Edge или Safari или введите ответ вручную.",
  "no-speech": "Ничего не слышно. Говорите громче или ближе к микрофону.",
  "language-not-supported": "Браузер не распознаёт немецкий язык. Откройте Chrome, Edge или Safari.",
  other: "Распознавание остановилось с ошибкой. Нажмите на микрофон ещё раз или введите ответ вручную.",
};
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// Microphone bar for a textarea: press, speak German, the text is appended to the field and stays editable.
// opts.onTime(seconds) gets the total time spoken into this field (used for words per minute); opts.compact hides the hint.
function dictation(ta, opts = {}) {
  const msg = h("div", { class: "note", hidden: true, role: "status" });
  const say = (t, cls) => { msg.className = "note" + (cls ? " " + cls : ""); msg.textContent = t; msg.hidden = !t; };
  if (!SpeechRec) {
    return { el: h("div", { class: "note mic-off" }, "Этот браузер не умеет превращать речь в текст (например, Firefox). Откройте страницу в Chrome, Edge или Safari, а пока введите ответ вручную."), stop() {}, supported: false, seconds: () => 0 };
  }
  const android = /Android/i.test(navigator.userAgent);
  const live = h("span", { class: "mic-live", "aria-live": "polite", lang: "de" });
  const clock = h("span", { class: "mic-time mono" }, "0:00");
  const label = h("span", null, "Говорить");
  const btn = h("button", { type: "button", class: "btn primary mic", "aria-pressed": "false" }, h("span", { class: "mic-ico", "aria-hidden": "true" }), label);
  let rec = null, want = false, total = 0, since = 0, tick = null, quick = 0, startedAt = 0;
  const spoken = () => total + (since ? (Date.now() - since) / 1000 : 0);
  const show = () => { clock.textContent = mmss(spoken()); };
  const append = (piece) => {
    piece = piece.replace(/\s+/g, " ").trim();
    if (!piece) return;
    const v = ta.value, sep = !v || /\s$/.test(v) ? "" : " ";
    if (!v.trim() || /[.!?]\s*$/.test(v)) piece = piece[0].toUpperCase() + piece.slice(1);
    ta.value = v + sep + piece;
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    ta.scrollTop = ta.scrollHeight;
  };
  const setUi = (on) => {
    btn.classList.toggle("on", on); btn.setAttribute("aria-pressed", on ? "true" : "false");
    label.textContent = on ? "Стоп" : "Говорить";
    if (!on) live.textContent = "";
  };
  const finish = () => {
    if (since) { total += (Date.now() - since) / 1000; since = 0; }
    clearInterval(tick); tick = null; show(); setUi(false);
    opts.onTime && opts.onTime(total);
  };
  const begin = () => {
    rec = new SpeechRec();
    rec.lang = "de-DE";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = !android; // Android Chrome repeats phrases in continuous mode: restart after each phrase instead
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) append(r[0].transcript); else interim += r[0].transcript;
      }
      live.textContent = interim;
    };
    rec.onerror = (e) => {
      if (e.error === "aborted") return;
      say(SR_ERR[e.error] || SR_ERR.other, e.error === "no-speech" ? "info" : "");
      if (SR_FATAL[e.error]) want = false;
    };
    rec.onend = () => {
      live.textContent = "";
      // Chrome ends a session after a pause; keep listening until the learner presses Stop
      if (want && document.body.contains(btn)) {
        quick = Date.now() - startedAt < 1500 ? quick + 1 : 0;
        if (quick < 4) { try { startedAt = Date.now(); rec.start(); return; } catch {} }
      }
      want = false; finish();
    };
    startedAt = Date.now();
    rec.start();
  };
  const start = () => {
    say("");
    if (window.speechSynthesis) speechSynthesis.cancel(); // do not record the page's own voice
    want = true; quick = 0;
    try { begin(); } catch { want = false; say(SR_ERR.other); return; }
    since = Date.now(); setUi(true);
    tick = setInterval(() => { if (!document.body.contains(btn)) { stop(); return; } show(); }, 500);
  };
  const stop = () => { want = false; if (rec) { try { rec.stop(); } catch { finish(); } } else finish(); };
  btn.onclick = () => (want ? stop() : start());
  const el = h("div", { class: "stack mic-box" },
    h("div", { class: "row mic-row" }, btn, clock, live),
    opts.compact ? null : h("p", { class: "small muted", style: "margin:0" }, "Нажмите «Говорить» и отвечайте по-немецки. Текст появится в поле, его можно исправить. Знаки препинания браузер почти не ставит. Аудио на наш сервер не отправляется: речь распознаёт сам браузер."),
    msg);
  return { el, stop, supported: true, seconds: spoken };
}

/* ---------- free check without AI: rules on the transcribed answer ---------- */
const SP_STOP = new Set(("aber alle allem allen aller alles als also am an andere anderen auch auf aus bei beim bin bis bist bitte da dabei dafuer damit dann darauf darueber das dass dein deine dem den denn der des dich die dies diese diesem diesen dieser dieses dir doch dort du durch ein eine einem einen einer eines er es etwas euch euer fuer gab gibt ganz gar gern gerne gewesen hab habe haben hast hat hatte hatten hier ich ihm ihn ihnen ihr ihre ihrem ihren ihrer im immer in ins ist ja jetzt kann kannst koennen koennte kein keine man mehr mein meine meinem meinen meiner mich mir mit muss muessen nach nicht nichts noch nun nur ob oder ohne schon sehr sein seine sich sie sind so soll sollen sollte sondern ueber um und uns unser unsere unter viel viele vom von vor war waren was weil wenn wer werde werden wie wieder will wir wird wo wollen wuerde wuerden zu zum zur zwar sieht macht machen gemacht geht gehen kommt finden finde sagen gut neue neuen neues erste ersten welche welcher welches woher wohin wann warum").split(" "));
const SP_CONN = ["weil", "da", "denn", "dass", "obwohl", "trotzdem", "deshalb", "deswegen", "darum", "daher", "ausserdem", "zudem", "sodass", "so dass", "damit", "wenn", "falls", "als", "waehrend", "bevor", "nachdem", "sobald", "seitdem", "einerseits", "andererseits", "zum beispiel", "zuerst", "zunaechst", "danach", "anschliessend", "schliesslich", "zum schluss", "allerdings", "jedoch", "sondern", "ob", "statt", "ansonsten", "sonst", "dennoch", "erstens", "zweitens"];
const SP_SUB = new Set(["weil", "da", "dass", "obwohl", "sodass", "so dass", "damit", "wenn", "falls", "als", "waehrend", "bevor", "nachdem", "sobald", "seitdem", "ob"]);
const SP_SYN = { gut: "toll, sinnvoll, hilfreich, gelungen", machen: "erledigen, organisieren, durchführen", sagen: "erklären, betonen, erwähnen", sehr: "besonders, wirklich, ziemlich", wichtig: "entscheidend, wesentlich", viel: "zahlreiche, eine Menge", problem: "Schwierigkeit, Herausforderung", schoen: "angenehm, toll, gelungen", finde: "meine, halte … für, bin der Meinung", denke: "meine, glaube, bin überzeugt" };
// Each rule: pattern on the original text (case kept), a short Russian hint (translated by the language pass) and a German example
const SP_RULES = [
  { rx: /\b(?:habe|hast|hat|haben|habt)\b(?:\s+(?!bin\b|ist\b|sind\b)\S+){0,5}?\s+(?:gegangen|gekommen|geflogen|geblieben|gewesen|geworden|passiert|aufgestanden|umgezogen|gelaufen|angekommen|eingeschlafen|aufgewacht|eingestiegen|ausgestiegen|gestorben)\b/gi,
    hint: "Глаголы движения и изменения состояния образуют Perfekt с sein.", ex: "Ich bin gegangen. Es ist passiert." },
  { rx: /\b(?:weil|dass|obwohl|wenn|damit|nachdem|bevor|ob)\s+(?:ich|du|er|sie|es|wir|ihr|man)\s+(?:bin|bist|ist|sind|seid|habe|hast|hat|haben|habt|kann|kannst|können|muss|musst|müssen|will|willst|wollen|möchte|möchten|werde|wird|werden|gehe|geht|arbeite|arbeitet|mache|macht|finde|findet|denke|glaube|weiß)(?=[\s,.!?]+\S)/gi,
    hint: "В придаточном предложении (weil, dass, obwohl, wenn …) спрягаемый глагол стоит в конце.", ex: "…, weil ich müde bin. …, dass wir mehr Zeit haben." },
  { rx: /\b(?:möchte|möchten|kann|können|muss|müssen|will|wollen|soll|sollen|darf|dürfen)\s+(?:\S+\s+){0,3}?zu\s+(?!(?:ihnen|einen|meinen|deinen|seinen|unseren|ihren|den|denen|diesen|allen|vielen|anderen|guten|beiden|jeden|welchen|keinen)\b)[a-zäöüß]+en\b/g,
    hint: "После модальных глаголов инфинитив идёт без zu.", ex: "Ich möchte das erklären. Wir müssen anrufen." },
  { rx: /\bich\s+(?:freue|interessiere|ärgere|erinnere|kümmere|bewerbe|beschwere|entschuldige|melde|beeile|konzentriere)\s+(?:auf|für|über|an|um|bei|nicht|sehr|schon|gern|gerne)\b/gi,
    hint: "Здесь нужен возвратный глагол: ich freue mich, ich interessiere mich.", ex: "Ich freue mich auf …, ich interessiere mich für …" },
  { rx: /\bmehr\s+(?:besser|schneller|größer|einfacher|schöner|billiger|teurer|wichtiger|interessanter|leichter|schwieriger|länger|kürzer)\b/gi,
    hint: "Сравнительная степень уже значит «больше»: mehr здесь не нужно.", ex: "besser, schneller" },
  { rx: /\bin\s+(?:Internet|Moment|Büro|Lager|Team|Betrieb|Krankenhaus)\b/gi,
    hint: "Здесь нужен артикль: in + dem = im (или ins).", ex: "im Internet, im Moment, im Büro" },
  { rx: /\bfür\s+(?:\S+\s+)?Jahren\b/gi,
    hint: "Для срока в прошлом говорят seit или vor: seit zwei Jahren, vor zwei Jahren.", ex: "Ich arbeite seit drei Jahren hier." },
  { rx: /\bwenn\s+ich\s+(?:noch\s+)?(?:ein\s+)?(?:Kind|jung|klein|Schüler|Schülerin|Student|Studentin)\s+war\b/gi,
    hint: "Об одном периоде в прошлом говорят als, а не wenn.", ex: "Als ich ein Kind war, …" },
];
const spWords = (s) => (norm(s).replace(/[^a-z0-9\s-]/g, " ").match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) || []);
const spStem = (w) => w.length <= 5 ? w : w.slice(0, Math.max(5, w.length - 3));
// key words of a task point: content words of four letters or more, without question words
const spKeys = (p) => [...new Set(spWords(p.replace(/\*innen\b/g, "").replace(/\*in\b/g, "")).filter(w => w.length >= 4 && !SP_STOP.has(w)))];
function spHas(ans, w) { const st = spStem(w); return ans.some(a => a.startsWith(st) || (st.length >= 5 && a.includes(st))); }
// the most telling part of a Redemittel phrase: its longest segment between "…" or commas, at most four words
function rmCore(s) {
  const segs = s.split(/…|\.\.\.|\/|,/).map(x => spWords(x)).filter(x => x.length);
  if (!segs.length) return null;
  const best = segs.sort((a, b) => b.length - a.length)[0].slice(0, 4);
  return best.length >= 2 || (best[0] && best[0].length >= 7) ? best.join(" ") : null;
}

// the data of the free report; spReport() draws it. cfg: {points, rede, model, target:[lo,hi], seconds, conn}
function spCheck(text, cfg) {
  const ans = spWords(text), flat = " " + ans.join(" ") + " ";
  const n = ans.length;
  const points = (cfg.points || []).map(p => {
    const keys = spKeys(p), hit = keys.filter(k => spHas(ans, k));
    const st = !keys.length ? "warn" : hit.length / keys.length >= 0.5 ? "ok" : hit.length ? "warn" : "bad";
    return { p, st };
  });
  const rede = (cfg.rede || []).map(g => {
    const used = g.items.filter(s => { const c = rmCore(s); return c && flat.includes(" " + c + " "); });
    return { h: g.h, used, sample: g.items[0] };
  });
  const conn = SP_CONN.filter(c => flat.includes(" " + c + " "));
  const sub = conn.filter(c => SP_SUB.has(c));
  const freq = {};
  ans.forEach(w => { if ((w.length >= 4 && !SP_STOP.has(w)) || SP_SYN[w]) freq[w] = (freq[w] || 0) + 1; });
  const reps = Object.entries(freq).filter(([w, c]) => c >= (SP_SYN[w] ? 3 : 4)).sort((a, b) => b[1] - a[1]).slice(0, 5);
  // no lookbehind here: older Safari cannot parse it, and a parse error would blank the whole page
  const doubles = [...new Set([...text.matchAll(/(^|[^\p{L}])(\p{L}{2,})\s+\2(?![\p{L}])/giu)].map(m => (m[2] + " " + m[2]).toLowerCase()))].filter(s => !/^(die die|das das|sie sie)$/.test(s)).slice(0, 5);
  const fillers = ans.filter(w => /^(aeh+m*|aehm|hm+|ehm|halt|irgendwie|sozusagen|quasi)$/.test(w)).length;
  const errs = [];
  for (const r of SP_RULES) {
    r.rx.lastIndex = 0;
    const found = [...text.matchAll(r.rx)].map(m => m[0].replace(/\s+/g, " ")).slice(0, 3);
    if (found.length) errs.push({ found, hint: r.hint, ex: r.ex });
  }
  // words of the model answer that would help: long content words the learner did not use
  const modelWords = [];
  if (cfg.model) {
    const seen = new Set();
    for (const raw of cfg.model.match(/[\p{L}-]{6,}/gu) || []) {
      const w = spWords(raw)[0];
      if (!w || SP_STOP.has(w) || seen.has(spStem(w)) || spHas(ans, w)) continue;
      seen.add(spStem(w)); modelWords.push(raw);
      if (modelWords.length >= 10) break;
    }
  }
  const [lo, hi] = cfg.target;
  const connGoal = cfg.conn || 4;
  const sPts = points.length ? points.reduce((s, x) => s + (x.st === "ok" ? 1 : x.st === "warn" ? 0.5 : 0), 0) / points.length : 1;
  const sLen = Math.min(1, n / lo);
  const sRede = rede.length ? rede.filter(g => g.used.length).length / rede.length : 1;
  const sConn = Math.min(1, conn.length / connGoal);
  const sErr = Math.max(0, 1 - errs.length * 0.25);
  const score = Math.round(100 * (0.35 * sPts + 0.2 * sLen + 0.15 * sRede + 0.15 * sConn + 0.15 * sErr));
  const wpm = cfg.seconds >= 15 ? Math.round(n / (cfg.seconds / 60)) : 0;
  return { n, lo, hi, points, rede, conn, sub, connGoal, reps, doubles, fillers, errs, modelWords, score, wpm, seconds: cfg.seconds || 0 };
}

function spReport(d) {
  const chip = (st, t) => h("span", { class: "chip " + st }, t);
  const row = (st, mark, ...kids) => h("div", { class: "err sp-row" }, h("div", { class: "sp-line" }, chip(st, mark), h("div", { class: "grow" }, kids)));
  const lenSt = d.n < d.lo * 0.6 ? "bad" : d.n < d.lo || d.n > d.hi + 60 ? "warn" : "ok";
  const sec = (title, ...kids) => h("div", { class: "stack" }, h("div", { class: "eyebrow" }, title), kids);
  const verdict = d.score >= 75 ? ["ok", "Хороший ответ"] : d.score >= 50 ? ["warn", "Можно лучше"] : ["bad", "Нужно доработать"];
  return h("div", { class: "card stack sp-report" },
    h("div", { class: "spread" }, h("h2", null, "Бесплатная проверка"), h("span", { class: "chip" }, "без ИИ · ориентировочно")),
    h("div", { class: "result" }, h("span", { class: "big" }, d.score + "%"), chip(verdict[0], verdict[1]),
      h("span", { class: "small muted", style: "flex:1;min-width:200px" }, "Проверка по правилам: пункты задания, Redemittel, связки, длина, повторы и типичные ошибки. Всю грамматику она не проверяет: это делает ИИ.")),
    sec("Длина ответа",
      h("div", { class: "errlist" },
        row(lenSt, lenSt === "ok" ? "✓" : "!", h("b", null, String(d.n)), " ", h("span", null, "слов"), " · ", h("span", null, "цель"), " " + d.lo + "–" + d.hi),
        d.wpm ? row(d.wpm >= 70 && d.wpm <= 170 ? "ok" : "warn", "⏱", h("span", null, "Время речи"), " " + mmss(d.seconds) + " · " + d.wpm + " ", h("span", null, "слов в минуту"),
          d.wpm < 70 ? h("div", { class: "small muted" }, "Говорите свободнее: длинные паузы на экзамене стоят баллов.") : null) : null)),
    d.points.length ? sec("Пункты задания (по ключевым словам)",
      h("div", { class: "errlist" }, d.points.map(x => row(x.st, x.st === "ok" ? "✓" : x.st === "warn" ? "~" : "✗", h("span", { lang: "de" }, x.p),
        x.st === "bad" ? h("div", { class: "small muted" }, "Этого пункта нет в ответе. Скажите о нём хотя бы 1–2 предложения.") : null)))) : null,
    d.rede.length ? sec("Redemittel",
      h("div", { class: "errlist" }, d.rede.map(g => g.used.length
        ? row("ok", "✓", h("b", null, g.h), h("div", { class: "small", lang: "de" }, g.used.join(" · ")))
        : row("warn", "–", h("b", null, g.h), h("div", { class: "small muted" }, h("span", null, "Попробуйте, например:"), " ", h("span", { lang: "de" }, g.sample)))))) : null,
    sec("Связки и придаточные",
      h("div", { class: "errlist" }, row(d.conn.length >= d.connGoal ? "ok" : "warn", String(d.conn.length),
        d.conn.length ? h("span", { lang: "de" }, d.conn.join(", ")) : h("span", null, "Связок пока нет."),
        d.sub.length ? null : h("div", { class: "small muted" }, "Добавьте придаточные: weil, dass, obwohl, wenn. Это признак уровня B2."),
        d.conn.length < d.connGoal ? h("div", { class: "small muted" }, h("span", null, "Цель для B2:"), " " + d.connGoal + "+") : null))),
    d.errs.length ? sec("Возможные ошибки (проверьте)",
      h("div", { class: "errlist" }, d.errs.map(e => h("div", { class: "err" }, h("span", { lang: "de" }, h("s", null, e.found.join(" · "))), h("span", { class: "small" }, e.hint), h("span", { class: "small muted", lang: "de" }, "→ " + e.ex))))) : null,
    d.reps.length || d.doubles.length || d.fillers ? sec("Повторы",
      h("div", { class: "errlist" },
        d.reps.map(([w, c]) => row("warn", "×" + c, h("b", { lang: "de" }, w), SP_SYN[w] ? h("div", { class: "small muted" }, h("span", null, "Синонимы:"), " ", h("span", { lang: "de" }, SP_SYN[w])) : null)),
        d.doubles.length ? row("warn", "2×", h("span", null, "Слово дважды подряд:"), " ", h("span", { lang: "de" }, d.doubles.join(", "))) : null,
        d.fillers ? row("warn", "äh", h("span", null, "Слова-паразиты:"), " " + d.fillers) : null)) : null,
    d.modelWords.length ? sec("Слова из образца, которые пригодятся",
      h("div", { class: "row sp-words", lang: "de" }, d.modelWords.map(w => h("span", { class: "chip" }, w)))) : null);
}

// the model answer as plain text: the whole monologue (Teil 1) or the lines of speaker A (Teil 2 and 3)
const spModel = (model, who) => (model || []).filter(s => !who || s.who === who).map(s => s.t).join(" ");
