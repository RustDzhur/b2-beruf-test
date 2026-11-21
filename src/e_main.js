
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
  const fp = pgData().scorePct; // first attempts, same number as in Progress and in the teacher cabinet
  const avg = fp == null ? "—" : Math.round(fp) + "%";
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
    h("div", { class: "spread" }, h("div", { class: "stack", style: "gap:4px" }, h("div", { class: "eyebrow" }, `${s.grp} · задания ${s.nums} · ${T("Попыток")}: ${(resOf(vid)?.n || 0) + 1}`), h("h1", null, s.t + " · " + s.label(it))),
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
    h("div", null, boxes(c.fam.toUpperCase(), 20), h("small", null, L7("Familienname", "Surname", "Nom", "Cognome", "Soyadı", "Фамилия"))),
    h("div", null, boxes(c.vor.toUpperCase(), 20), h("small", null, L7("Vorname", "First Name", "Prénom", "Nome", "Adı", "Имя"))));
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
  const w = store.get("wrong", {}), day = rpDay();
  const by = {};
  Object.values(w).forEach(x => { if (!SEC[x.sec]) return; const g = (by[x.vid] = by[x.vid] || { sec: x.sec, qs: [] }); g.qs.push(Object.assign({ n: x.n }, rpState(x))); });
  const entries = Object.entries(by).map(([vid, g]) => {
    const list = SEC[g.sec].list(); const i = list.findIndex(it => vidOf(g.sec, it) === vid);
    if (i < 0) return null;
    const qs = g.qs.sort((a, b) => a.n - b.n);
    const due = qs.map(q => q.due).sort()[0];
    return { vid, sec: g.sec, idx: i + 1, it: list[i], qs, due, ready: due <= day };
  }).filter(Boolean).sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0) || SECS.indexOf(SEC[a.sec]) - SECS.indexOf(SEC[b.sec]));
  const weak = Object.entries(store.get("nstat", {})).filter(([, s]) => s[1] >= 2 && s[0] / s[1] < .5).map(([n]) => +n).sort((a, b) => a - b);
  const dots = (q) => "●".repeat(q.ok) + "○".repeat(REPEAT_NEED - q.ok);
  const row = (e) => h("a", { class: "li", href: `#${e.sec}.${e.idx}` }, h("span", { class: "num" }, SEC[e.sec].nums),
    h("div", { class: "grow" }, h("div", { class: "pt" }, `${SEC[e.sec].t} · ${SEC[e.sec].label(e.it)}`),
      h("div", { class: "ps small muted" }, e.qs.map(q => "№" + q.n + " " + dots(q)).join(" · "))),
    h("span", { class: "chip " + (e.ready ? "bad" : "") }, e.ready ? "Повторить сегодня" : "Можно с " + rpPretty(e.due)));
  const ready = entries.filter(e => e.ready), later = entries.filter(e => !e.ready);
  return h("div", { class: "wrap narrow" },
    crumbs(h("a", { href: "#home" }, "Главная"), "Ошибки"),
    h("h1", null, "Повторить ошибки"),
    h("p", { class: "lead", style: "margin:0" }, "Ошибка не исчезает после одного верного ответа: так легко угадать. Она закрывается, когда вы ответили на этот вопрос правильно 3 раза в разные дни."),
    h("div", { class: "note info rp-how" }, h("b", null, "Как это работает"),
      h("div", null, "1️⃣ ", h("span", null, "1-й повтор: через 1 день после ошибки")),
      h("div", null, "2️⃣ ", h("span", null, "2-й повтор: через 3 дня после ошибки")),
      h("div", null, "3️⃣ ", h("span", null, "3-й повтор: через 7 дней после ошибки")),
      h("div", null, "Ответ раньше срока засчитывается как тренировка, но ошибка остаётся в списке. Неверный ответ начинает отсчёт заново."),
      h("div", null, "Серия ●○○ показывает, сколько повторов уже засчитано."),
      h("div", { class: "small muted" }, "Если вы видите ошибку здесь после верного ответа, это не сбой: ещё не наступил срок или нужно повторить ещё раз.")),
    weak.length ? h("div", { class: "note info" }, "Чаще всего ошибки в заданиях №", weak.join(", "), ". Начните с них.") : null,
    ready.length ? h("h3", null, "Пора повторить · " + ready.length) : null,
    ready.length ? h("div", { class: "card list" }, ready.map(row)) : null,
    later.length ? h("h3", null, "Ждут своего дня · " + later.length) : null,
    later.length ? h("div", { class: "card list" }, later.map(row)) : null,
    entries.length ? null : h("div", { class: "card" }, h("p", { style: "margin:0" }, "Ошибок пока нет. Решите несколько вариантов, и здесь появятся вопросы для повторения."), h("p", null, h("a", { class: "btn primary", href: "#exam" }, "Пробный экзамен"))));
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
    inp("fam", L7("Familienname", "Surname", "Nom", "Cognome", "Soyadı", "Фамилия")),
    inp("vor", L7("Vorname", "First Name", "Prénom", "Nome", "Adı", "Имя")));
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
// official German label plus its translation into the chosen interface language (none for German); Arabic is not on the printed form, so it is added here
const L7_AR = { "E-Mail *": "البريد الإلكتروني *", "Kennwort * (mindestens 6 Zeichen)": "كلمة المرور * (6 أحرف على الأقل)", "Kennwort (nur zum Wechseln des Kontos)": "كلمة المرور (لتغيير الحساب فقط)", "männlich": "ذكر", "weiblich": "أنثى", "Testversion": "نسخة الاختبار", "Familienname": "اللقب", "Vorname": "الاسم الأول", "Geburtsdatum": "تاريخ الميلاد", "Geburtsort": "مكان الميلاد",
  "Erstsprache": "اللغة الأولى", "Geschlecht": "الجنس", "Straße und Hausnummer": "الشارع ورقم المنزل", "Postleitzahl und Ort": "الرمز البريدي والمدينة", "Prüfungszentrum": "مركز الامتحان", "Prüfungsdatum": "تاريخ الامتحان" };
const L7 = (de, en, fr, it, tr, ru) => { const t = { en, fr, it, tr, ru, ar: L7_AR[de] }[curLang()]; return t ? de + " · " + t : de; };
// sign-up / sign-in card (and the profile of a signed-in account). Required at sign-up: surname, first name, e-mail, phone, password, group.
// The Antwortbogen fields (birth date, address, …) are optional and only used for the printed answer sheet.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phoneOk = v => /^\+?[\d\s().\/-]{6,24}$/.test(v) && v.replace(/\D/g, "").length >= 7;
let regMode = "reg"; // "reg" (new account) | "login" (existing account)
function viewProfile(first) {
  const c = cand();
  const dm = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(c.geb || ""); // older entries were typed as TT.MM.JJJJ
  if (dm) c.geb = `${dm[3]}-${dm[2].padStart(2, "0")}-${dm[1].padStart(2, "0")}`;
  const signedIn = cloudOn();
  const mode = signedIn ? "edit" : regMode;
  const reg = mode === "reg";
  const fixed = signedIn && c.done && !!c.role; // an existing account keeps its role and group
  const field = (label, input, wide) => h("label", { class: "reg-field" + (wide ? " wide" : "") }, h("span", null, label), input);
  const inp = (name, attrs) => h("input", { class: "reg-input", name, value: c[name] || "", ...attrs });
  const err = h("p", { class: "reg-error", role: "alert", hidden: true });
  const fail = t => { err.textContent = t; err.hidden = false; err.scrollIntoView({ block: "nearest" }); };
  const seg = (items, cur, on) => h("div", { class: "reg-seg", role: "group" }, items.map(([v, l]) =>
    h("button", { type: "button", class: cur === v ? "on" : "", "aria-pressed": cur === v, onclick: () => on(v) }, l)));

  // who are you: a student picks a group; an organizer names a new group (approved by the main administrator)
  let role = c.role || "student";
  const grpSel = h("select", { class: "reg-input", name: "group", disabled: fixed }, h("option", { value: "" }, "— выберите группу —"),
    c.group ? h("option", { value: c.group, selected: true }, c.groupName || c.group) : null);
  const grpRow = field("Ваша группа *", grpSel, true);
  const orgRow = field("Название вашей группы *", inp("gname", { value: c.groupName || "", maxlength: 60, disabled: fixed, placeholder: "Deutsch B2 Berlin" }), true);
  const roleSeg = h("div", { class: "reg-who" });
  const syncWho = () => {
    roleSeg.replaceChildren(h("span", { class: "reg-label" }, "Кто вы? *"), seg([["student", "Я ученик"], ["org", "Я организатор группы"]], role, v => { if (!fixed) { role = v; syncWho(); } }));
    grpRow.hidden = role === "org"; orgRow.hidden = role !== "org";
  };
  syncWho();
  if (!fixed && mode !== "login") fetch("/api/groups").then(r => r.json()).then(j => {
    const list = (j && j.groups) || [];
    // the open group comes first for people without a teacher
    const pub = list.filter(g => g.code === "PUBLIC"), rest = list.filter(g => g.code !== "PUBLIC");
    pub.forEach(g => { if (g.code !== c.group) grpSel.append(h("option", { value: g.code }, "Общая группа: занимаюсь сам, без учителя")); });
    if (rest.length) grpSel.append(h("option", { disabled: true }, "──────────"));
    rest.forEach(g => { if (g.code !== c.group) grpSel.append(h("option", { value: g.code }, g.name)); });
  }).catch(() => {});

  const mail = c.email || (cloud.s && cloud.s.email && !/@dtb-trainer\.app$/.test(cloud.s.email) ? cloud.s.email : "");
  const emailIn = inp("email", { type: "email", value: mail, autocomplete: "email", placeholder: "name@example.com", maxlength: 120, required: true, readonly: signedIn, dir: "ltr" });
  const pwIn = h("input", { class: "reg-input", type: "password", name: "pw", autocomplete: reg ? "new-password" : "current-password", placeholder: "••••••", minlength: 6, dir: "ltr" });
  const lang = h("select", { class: "reg-input", name: "sprache" }, h("option", { value: "" }, "—"), LANG_CODES.map(([v, l]) => h("option", { value: v, selected: c.sprache === v }, `${v} - ${l}`)));
  const sex = h("select", { class: "reg-input", name: "geschl" }, h("option", { value: "" }, "—"),
    h("option", { value: "m", selected: c.geschl === "m" }, L7("männlich", "male", "masculin", "maschile", "erkek", "мужской")),
    h("option", { value: "w", selected: c.geschl === "w" }, L7("weiblich", "female", "féminin", "femminile", "kadın", "женский")));
  const sheet = h("details", { class: "reg-more" }, h("summary", null, "Данные для бланка ответов (необязательно)"),
    h("div", { class: "reg-grid" },
      field(L7("Geburtsdatum", "Date of Birth", "Date de naissance", "Data di nascita", "Doğum tarihi", "Дата рождения"), inp("geb", { type: "date" })),
      field(L7("Geburtsort", "Place of Birth", "Lieu de naissance", "Luogo di nascita", "Doğum yeri", "Место рождения"), inp("gort", { maxlength: 30 })),
      field(L7("Erstsprache", "First Language", "Langue maternelle", "Madrelingua", "Anadili", "Родной язык"), lang),
      field(L7("Geschlecht", "Sex", "Sexe", "Sesso", "Cinsiyeti", "Пол"), sex),
      field(L7("Straße und Hausnummer", "Street and number", "Rue et numéro", "Via e numero civico", "Sokak ve numara", "Улица и дом"), inp("str", { maxlength: 30 })),
      field(L7("Postleitzahl und Ort", "Postcode and town", "Code postal et ville", "CAP e città", "Posta kodu ve şehir", "Индекс и город"), inp("ort", { maxlength: 30 })),
      field(L7("Prüfungszentrum", "Examination Centre", "Centre d'examen", "Centro d'esame", "Sınav merkezi", "Экзаменационное учреждение"), inp("zentrum", { maxlength: 30 })),
      field(L7("Prüfungsdatum", "Date of Examination", "Date d'examen", "Data dell'esame", "Sınav tarihi", "Дата экзамена"), inp("datum", { type: "date" }))));

  const person = h("div", { class: "reg-grid" },
    field("Фамилия *", inp("fam", { maxlength: 30, autocomplete: "family-name", required: true })),
    field("Имя *", inp("vor", { maxlength: 30, autocomplete: "given-name", required: true })),
    field("E-mail *", emailIn),
    field("Телефон (WhatsApp) *", inp("tel", { type: "tel", maxlength: 24, autocomplete: "tel", placeholder: "+49 151 2345678", dir: "ltr" })));
  const form = h("form", { class: "reg-form", autocomplete: "on", novalidate: true },
    mode === "login"
      ? h("div", { class: "reg-grid" }, field("E-mail *", emailIn, true), field("Пароль *", pwIn, true))
      : h("div", null, roleSeg, person, reg ? h("div", { class: "reg-grid" }, field("Пароль * (минимум 6 символов)", pwIn, true)) : null, grpRow, orgRow, sheet),
    reg ? priceBox() : null,
    reg ? h("p", { class: "reg-note" }, "После регистрации на e-mail придёт письмо с подтверждением. Доступ откроется после разрешения администратора: напишите ему в WhatsApp. Пожалуйста, только сообщение, не звоните.") : null,
    err,
    h("button", { class: "reg-btn", type: "submit" }, mode === "login" ? "Войти" : reg ? "Зарегистрироваться" : "Сохранить"));

  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form), x = {};
    for (const [k, v] of fd.entries()) x[k] = String(v).trim();
    const pw = x.pw || ""; delete x.pw;
    x.email = String(emailIn.value || "").trim().toLowerCase();
    if (mode !== "login" && (!x.fam || !x.vor)) return fail("Укажите фамилию и имя.");
    if (!EMAIL_RE.test(x.email)) return fail("Укажите правильный e-mail: по нему проходят регистрация и вход.");
    if (mode !== "login") {
      if (!phoneOk(x.tel || "")) return fail("Укажите номер телефона с WhatsApp, например +49 151 2345678.");
      if (!fixed && role === "org" && !x.gname) return fail("Укажите название группы.");
      if (!fixed && role !== "org" && !x.group) return fail("Выберите свою группу.");
    }
    if (!signedIn && pw.length < 6) return fail("Введите пароль (минимум 6 символов).");
    const who = fixed || mode === "login" ? null : role === "org"
      ? { role: "org", groupName: x.gname }
      : { role: "student", group: x.group, groupName: (grpSel.selectedOptions[0] || {}).textContent || "" };
    delete x.group; delete x.gname;
    const filled = {}; Object.entries(x).forEach(([k, v]) => { if (v) filled[k] = v; });
    const btn = form.querySelector(".reg-btn");
    if (!signedIn) {
      err.hidden = true; btn.disabled = true;
      try { localStorage.removeItem("dtb.cand"); } catch {} // take the name saved in the cloud, if there is one
      try { await cloudConnect({ ...x }, pw, { login: mode === "login" }); }
      catch (ex) { btn.disabled = false; if (mode !== "login") store.set("cand", { ...c, ...x, done: false }); return fail(cloudErrText(ex)); }
    }
    const cc = cand();
    let next = mode === "login" ? { ...cc, email: x.email } : { ...cc, ...filled };
    if (who && !(cc.role && (cc.group || cc.role === "org"))) next = { ...next, ...who }; // an account from the cloud keeps its own group
    if (next.role === "org" && !next.group && next.groupName) {
      try { const g = await cloudGroupRequest(next.groupName, x.email); next.group = g.code; next.groupName = g.name; }
      catch (ex) { btn.disabled = false; store.set("cand", { ...next, done: false }); return fail(ex.message || "Не удалось создать группу."); }
    }
    store.set("cand", { ...next, done: true });
    location.hash = first ? (location.hash && location.hash !== "#profile" ? location.hash : "#home") : "#home";
    render();
  };
  const reset = h("button", { type: "button", class: "reg-link", onclick: async () => {
    const m = String(emailIn.value || "").trim().toLowerCase();
    if (!EMAIL_RE.test(m)) return fail("Сначала укажите e-mail.");
    try { await cloudResetPw(m); err.replaceChildren(h("span", null, "Письмо для сброса пароля отправлено:"), " ", h("b", { dir: "ltr" }, m)); }
    catch { err.textContent = "Не удалось отправить письмо. Проверьте e-mail."; }
    err.hidden = false;
  } }, "Забыли пароль?");
  const out = signedIn ? h("button", { type: "button", class: "reg-link", onclick: () => { cloudOff(true); store.set("cand", { fam: "", vor: "" }); regMode = "login"; render(); } }, "Выйти / сменить аккаунт") : null;
  return h("div", { class: "reg" },
    h("div", { class: "reg-card" },
      h("div", { class: "reg-top" }, h("span", { class: "reg-mark" }, "DTB"), h("span", { class: "reg-brand" }, h("b", null, "DTB B2 Beruf"), h("span", null, "Тренажёр к экзамену telc"))),
      h("h1", null, mode === "login" ? "Вход" : reg ? "Регистрация" : "Данные участника"),
      h("p", { class: "reg-sub" }, mode === "login" ? "Войдите с e-mail и паролем, которые вы указали при регистрации. Прогресс подтянется из облака." : reg ? "Создайте аккаунт: прогресс сохраняется в облаке и доступен на любом устройстве." : "Эти данные видит ваш преподаватель."),
      signedIn ? null : seg([["reg", "Регистрация"], ["login", "Вход"]], mode, v => { regMode = v; render(); }),
      form,
      h("div", { class: "reg-links" }, mode === "edit" ? null : reset, out, first || signedIn ? null : h("a", { class: "reg-link", href: "#home" }, "Назад"))));
}
// prices: the trainer alone, or the trainer with the AI that checks homework
function priceBox() {
  return h("div", { class: "price" },
    h("div", { class: "price-head" }, "Стоимость подписки"),
    h("div", { class: "price-grid" },
      h("div", { class: "price-card" },
        h("div", { class: "price-name" }, "Тренажёр"),
        h("div", { class: "price-sum", dir: "ltr" }, h("b", null, "5 €"), h("span", null, " / ", h("span", null, "месяц"))),
        h("p", null, "Все задания экзамена, проверка ответов, работа над ошибками и рейтинг группы. Без ИИ.")),
      h("div", { class: "price-card best" },
        h("span", { class: "price-tag" }, "Лучшая подготовка"),
        h("div", { class: "price-name" }, "Тренажёр + ИИ"),
        h("div", { class: "price-sum", dir: "ltr" }, h("b", null, "10 €"), h("span", null, " / ", h("span", null, "месяц"))),
        h("p", null, "Всё из тарифа «Тренажёр» и ИИ, который проверяет домашние задания, письма и устные ответы и помогает лучше подготовиться к экзамену."))));
}
// waiting room: the account exists, but the teacher has not admitted it yet
function viewPending() {
  const c = cand(), mail = (cloud.s && cloud.s.email) || c.email || "";
  const sent = store.get("mailsent", "") === mail;
  const msg = h("p", { class: "reg-note", hidden: true });
  if (!cloud.checked) { cloudAccess().then(() => { cloud.checked = true; render(); }); return h("div", { class: "wrap narrow" }, h("p", { class: "lead" }, "Проверяем доступ…")); }
  const org = c.role === "org";
  return h("div", { class: "reg" },
    h("div", { class: "reg-card wide" },
      h("div", { class: "reg-top" }, h("span", { class: "reg-mark" }, "DTB"), h("span", { class: "reg-brand" }, h("b", null, "DTB B2 Beruf"), h("span", null, "Тренажёр к экзамену telc"))),
      h("h1", null, "Ожидает разрешения"),
      h("p", { class: "reg-sub" }, h("span", null, sent ? "Регистрация прошла. Мы отправили письмо с подтверждением на адрес:" : "Вы вошли как:"), " ", h("b", { dir: "ltr" }, mail)),
      org
        ? h("p", null, h("span", null, "Ваша группа ждёт одобрения главного администратора:"), " ", h("b", null, c.groupName || ""), ". ", h("span", null, "После одобрения откроется тренажёр, а кабинет группы будет по адресу /admin (вход «Организатор группы» с вашим e-mail и паролем)."))
        : h("ol", { class: "reg-steps" },
            h("li", null, "Подтвердите e-mail: откройте письмо и нажмите на ссылку."),
            h("li", null, h("b", null, "Напишите администратору в WhatsApp."), " ", h("span", null, "Пожалуйста, не звоните: только сообщение с запросом на доступ. Укажите фамилию, имя, e-mail регистрации и выбранный тариф.")),
            h("li", null, "После оплаты администратор откроет доступ, и тренажёр заработает на всех ваших устройствах.")),
      !org && c.groupName ? h("p", { class: "reg-note" }, h("span", null, "Ваша группа:"), " ", h("b", null, c.groupName)) : null,
      contactBlock(cloud.contact, c, mail),
      org ? null : priceBox(),
      msg,
      h("div", { class: "reg-actions" },
        h("button", { class: "reg-btn", onclick: async () => { msg.hidden = false; msg.textContent = "Проверяем…"; if (await cloudAccess()) render(); else msg.textContent = "Доступ ещё не подтверждён."; } }, "Проверить снова"),
        h("a", { class: "reg-link", href: "#profile" }, "Сменить аккаунт"))));
}
// teacher's WhatsApp from VERIFY_CONTACT, shown in full; the button opens WhatsApp with a ready request (no call button: write, don't call)
function contactBlock(contact, c, mail) {
  contact = String(contact || "").trim();
  if (!contact) return h("p", { class: "reg-note" }, "Номер администратора пока не указан.");
  const m = contact.match(/\+?\d[\d\s().\/-]{5,}\d/), digits = m ? m[0].replace(/\D/g, "") : "";
  c = c || {};
  const text = "Hallo! Ich bitte um Zugang zum DTB-B2-Beruf-Trainer.\nName: " + [c.fam, c.vor].filter(Boolean).join(" ") + "\nE-Mail: " + (mail || "") + (c.groupName ? "\nGruppe: " + c.groupName : "") + "\nTarif: 5 € / 10 € (mit KI)";
  return h("div", { class: "contact-box" },
    h("div", { class: "contact-label" }, "WhatsApp администратора:"),
    h("div", { class: "contact-num", dir: "ltr" }, contact),
    h("div", { class: "contact-warn" }, "📵 ", h("span", null, "Только сообщения, пожалуйста, не звоните.")),
    digits ? h("a", { class: "reg-btn wa", href: "https://wa.me/" + digits + "?text=" + encodeURIComponent(text), target: "_blank", rel: "noopener" }, "Написать в WhatsApp") : null);
}
// header badge: who is signed in on this device
function updateWho() {
  const top = document.querySelector(".top-in"); if (!top) return;
  let a = top.querySelector(".who");
  const c = cand();
  if (!c.done) { if (a) a.remove(); return; }
  if (!a) { a = h("a", { class: "who", href: "#profile", title: "Данные участника" }); top.insertBefore(a, top.querySelector(".langsw")); }
  const kids = [h("span", { class: "who-ico", "aria-hidden": "true" }, "👤"), h("span", null, (c.vor || c.fam) ? `${c.vor || ""} ${c.fam || ""}`.trim() : (c.email || ""))];
  if (cloudOn()) kids.push(h("span", { class: "who-ico", title: "Cloud", "aria-hidden": "true" }, "☁"));
  a.replaceChildren(...kids);
  let cab = top.querySelector(".who-cab");
  if (c.role === "org" && cloud.ok) { if (!cab) { cab = h("a", { class: "who who-cab", href: "/admin" }, "👥 ", h("span", null, "Кабинет группы")); a.after(cab); } }
  else if (cab) cab.remove();
}
function render() {
  stopAll();
  const r = (location.hash || "#home").slice(1);
  const [sec, idx] = r.split(".");
  let v;
  if ((!cand().done || !cloudOn()) && sec !== "profile") v = viewProfile(true);
  else if (sec === "profile") v = viewProfile(!cloudOn());
  else if (!cloud.ok) v = viewPending();
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
