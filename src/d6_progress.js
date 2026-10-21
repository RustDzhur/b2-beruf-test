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
  const nstat = store.get("nstat", {}) || {};
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
  let answersCorrect = 0, answersTotal = 0;
  for (const v of Object.values(nstat)) {
    if (!Array.isArray(v)) continue;
    const total = Math.max(0, pgNum(v[1]));
    if (!total) continue;
    answersTotal += total;
    answersCorrect += Math.max(0, Math.min(total, pgNum(v[0])));
  }
  const answers = { correct: answersCorrect, total: answersTotal, pct: answersTotal ? Math.round(answersCorrect / answersTotal * 100) : null };

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
  return { days: days.length, firstDay: days[0] || null, tasks, attempts, answers, scorePct, bestPct, success, mid, fail, failures: wrongArr.length, sections, parts, weak, recentWrong: wrongArr.slice(0, 5), activity, trend, streak: st, achievements, earned: achievements.filter(a => a.earned).length };
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
            h("span", null, h("i", { style: "background:var(--bad)" }), T("Слабо") + " · " + d.fail))))),
    d.answers.total ? h("p", { class: "sub", style: "margin:8px 0 0" }, T("Верных ответов") + ": " + d.answers.correct + " / " + d.answers.total + (d.answers.pct != null ? " · " + d.answers.pct + "%" : "")) : null);
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
