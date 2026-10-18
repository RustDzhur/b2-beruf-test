
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
    box.replaceChildren(thinking("Claude разбирает вопрос…"));
    const s = st[it.key];
    const p = `Ты — опытный преподаватель немецкого, готовишь ученика (родной язык русский) к экзамену telc DTB B2 Beruf.
Объясни по-русски, почему в задании ниже правильный ответ «${optLabel(it, it.ans)}».
${s.val && s.val !== it.ans ? `Ученик выбрал «${optLabel(it, s.val)}» — объясни, почему это неверно.` : ""}
Процитируй дословно немецкую фразу из текста, которая доказывает ответ, и переведи её. В конце дай 2–3 полезных немецких слова или выражения из этого места с переводом.
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
    h("span", { class: "modehint" }, MODE_HINT[cur]));
}
const srcNote = (src) => src === "derived" ? h("p", { class: "small muted", style: "margin:0" }, "Ответы определены по тексту и транскрипту: в присланном файле выделение правильных ответов не сохранилось.")
  : src === "recon" ? h("p", { class: "small muted", style: "margin:0" }, "Часть этого задания реконструирована: в файле был только пересказ, поэтому текст записан заново по смыслу.") : null;
