/* Teacher cabinet at /admin. Standalone (not part of the student bundle): login, dashboard, charts, drawer. */
(() => {
"use strict";

const ROOT = document.getElementById("admin-root");
const DAY = 86400000;
const NS = "http://www.w3.org/2000/svg";
const NARROW = typeof window !== "undefined" && window.matchMedia("(max-width: 700px)").matches;

const S = {
  me: null,
  data: null,
  error: null,
  loading: true,
  loginError: "",
  loginBusy: false,
  query: "",
  filter: "all",
  sort: "rating",
  range: 30,
  selectedUid: null,
  lastLoaded: 0,
  picked: new Set(), // students ticked for deletion
  group: "", // main teacher: "" = all groups, otherwise one group code
  loginMode: "super", // "super" (main teacher password) | "org" (group organizer e-mail + password)
};

/* ------------------------------------------------------------------ dom ---- */
function el(tag, attrs, ...kids) {
  const node = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "style") node.style.cssText = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat(Infinity)) if (c != null && c !== false) node.append(c.nodeType ? c : String(c));
  return node;
}

function svgEl(tag, attrs, ...kids) {
  const node = document.createElementNS(NS, tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat(Infinity)) if (c != null && c !== false) node.append(c.nodeType ? c : String(c));
  return node;
}

const ICONS = {
  users: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8", "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  calendar: ["M8 2v4", "M16 2v4", "M3 10h18", "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"],
  target: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z", "M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"],
  check: ["M22 11.08V12a10 10 0 1 1-5.93-9.14", "M22 4 12 14.01l-3-3"],
  alert: ["M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", "M12 9v4", "M12 17h.01"],
  chart: ["M3 3v18h18", "M18 17V9", "M13 17V5", "M8 17v-3"],
  search: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.35-4.35"],
  refresh: ["M23 4v6h-6", "M1 20v-6h6", "M3.51 9a9 9 0 0 1 14.85-3.36L23 10", "M1 14l4.64 4.36A9 9 0 0 0 20.49 15"],
  download: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  close: ["M18 6 6 18", "M6 6l12 12"],
  chevron: ["M9 18l6-6-6-6"],
  clock: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 6v6l4 2"],
  trophy: ["M8 21h8", "M12 17v4", "M7 4h10v4a5 5 0 0 1-10 0V4z", "M7 6H4a2 2 0 0 0 2 2h1", "M17 6h3a2 2 0 0 1-2 2h-1"],
  spark: ["M12 2v4", "M12 18v4", "M2 12h4", "M18 12h4", "M4.9 4.9l2.8 2.8", "M16.3 16.3l2.8 2.8", "M4.9 19.1l2.8-2.8", "M16.3 7.7l2.8-2.8"],
  db: ["M12 8c4.97 0 9-1.34 9-3s-4.03-3-9-3-9 1.34-9 3 4.03 3 9 3z", "M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5", "M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"],
  lock: ["M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z", "M7 11V7a5 5 0 0 1 10 0v4"],
  sun: ["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M12 2v2", "M12 20v2", "M4.93 4.93l1.41 1.41", "M17.66 17.66l1.41 1.41", "M2 12h2", "M20 12h2", "M4.93 19.07l1.41-1.41", "M17.66 6.34l1.41-1.41"],
  moon: ["M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"],
};
function icon(name, size = 18) {
  const box = svgEl("svg", { viewBox: "0 0 24 24", width: size, height: size, fill: "none", stroke: "currentColor", "stroke-width": 1.8, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" });
  for (const d of ICONS[name] || []) box.append(svgEl("path", { d }));
  return box;
}

/* ---------------------------------------------------------- theme + locale */
function adminTheme() {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}
function themeButton() {
  return el("button", { class: "adm-icon-btn adm-theme-btn", type: "button", onclick: toggleAdminTheme });
}
function paintAdminTheme() {
  const light = adminTheme() === "light";
  const label = light ? "Тёмная тема" : "Светлая тема";
  document.querySelectorAll(".adm-theme-btn").forEach(b => {
    b.replaceChildren(icon(light ? "moon" : "sun"));
    b.title = label;
    b.setAttribute("aria-label", label);
    if (typeof applyAdminLang === "function") applyAdminLang(b);
  });
  document.documentElement.style.colorScheme = light ? "light" : "dark";
}
function toggleAdminTheme() {
  const next = adminTheme() === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  try { localStorage.setItem("dtb.theme", JSON.stringify(next)); } catch {}
  paintAdminTheme();
}
function initAdminTheme() {
  const root = document.documentElement;
  if (!root.getAttribute("data-theme")) {
    let saved = "dark";
    try { const raw = localStorage.getItem("dtb.theme"); saved = raw ? JSON.parse(raw) : "dark"; } catch { saved = "dark"; }
    root.setAttribute("data-theme", saved === "light" ? "light" : "dark");
  }
  document.documentElement.style.colorScheme = adminTheme();
  paintAdminTheme();
}
function langSelect() {
  const sel = el("select", { class: "adm-lang", "aria-label": "Язык", title: "Язык" },
    Object.keys(ADM_LANGS).map(code => el("option", { value: code, selected: code === ADM_LANG, title: ADM_LANG_TITLE[code] }, ADM_LANGS[code])));
  sel.value = ADM_LANG;
  // the selector itself is skipped by the language pass, so its label is translated here
  const label = () => { const t = admTr("Язык"); sel.setAttribute("aria-label", t); sel.title = t; };
  label();
  sel.onchange = () => {
    setAdminLang(sel.value);
    label();
    document.title = admTr(S.me && S.me.ok ? cabTitle() + " · DTB B2 Beruf" : "Вход · " + cabTitle());
  };
  return sel;
}

/* --------------------------------------------------------------- format ---- */
const isoDay = ts => new Date(ts).toISOString().slice(0, 10);
const todayIso = () => isoDay(Date.now());
const dayStart = iso => Date.parse(iso + "T00:00:00Z");
const daysAgo = n => isoDay(Date.now() - n * DAY);
const fmt = n => Number(n || 0).toLocaleString("ru-RU");
const pctText = v => (v == null ? "—" : Math.round(v) + "%");
function plural(n, one, few, many) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso + "T12:00:00Z").toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function shortDate(iso) {
  if (!iso) return "";
  return new Date(iso + "T12:00:00Z").toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}
function relDay(iso) {
  if (!iso) return "—";
  const diff = Math.round((dayStart(todayIso()) - dayStart(iso)) / DAY);
  if (diff <= 0) return "сегодня";
  if (diff === 1) return "вчера";
  if (diff < 7) return diff + " " + plural(diff, "день", "дня", "дней") + " назад";
  if (diff < 30) { const w = Math.floor(diff / 7); return w + " " + plural(w, "неделю", "недели", "недель") + " назад"; }
  return fmtDate(iso);
}
function timeText(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}
function hue(str) {
  let h = 0;
  for (const ch of String(str || "?")) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}
function avatarStyle(name) {
  const h = hue(name);
  return "background:linear-gradient(140deg, hsl(" + h + " 64% 48%), hsl(" + ((h + 42) % 360) + " 62% 38%))";
}
function scoreTone(v) {
  if (v == null) return "";
  return v >= 75 ? "ok" : v >= 50 ? "warn" : "bad";
}

/* ------------------------------------------------------------------ api ---- */
async function api(path, opts = {}) {
  const init = Object.assign({ credentials: "same-origin" }, opts);
  init.headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
  let r;
  try { r = await fetch(path, init); }
  catch { throw Object.assign(new Error("Нет связи с сервером."), { code: "network", status: 0 }); }
  let body = null;
  try { body = await r.json(); } catch {}
  if (!r.ok) {
    const e = new Error((body && body.message) || ("HTTP " + r.status));
    e.code = body && body.code;
    e.status = r.status;
    throw e;
  }
  return body || {};
}

/* --------------------------------------------------------------- toggle ---- */
function showTip(evt, text) {
  let tip = document.querySelector(".adm-tip");
  if (!tip) { tip = el("div", { class: "adm-tip" }); document.body.append(tip); }
  tip.textContent = text;
  tip.style.left = evt.clientX + "px";
  tip.style.top = evt.clientY + "px";
  tip.classList.add("on");
}
function hideTip() {
  const tip = document.querySelector(".adm-tip");
  if (tip) tip.classList.remove("on");
}

/* ---------------------------------------------------------------- charts --- */
function activityChart(activity, days, compact) {
  const data = (activity || []).slice(-days);
  if (!data.length || !data.some(d => d.tests || d.students)) return el("div", { class: "adm-chart-empty" }, "Нет данных за этот период.");
  const W = compact ? 500 : (NARROW ? 420 : 780), H = compact ? 128 : (NARROW ? 186 : 218);
  const pad = compact ? { l: 26, r: 8, t: 10, b: 20 } : { l: 34, r: 10, t: 14, b: 28 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const maxT = Math.max(1, ...data.map(d => d.tests));
  const maxS = Math.max(1, ...data.map(d => d.students || 0));
  const bw = iw / data.length;
  const yT = v => pad.t + ih - (v / maxT) * ih;
  const yS = v => pad.t + ih - (v / maxS) * ih;
  const svg = svgEl("svg", { class: "adm-chart", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Активность: " + data.length + " дней" });

  for (let i = 0; i <= 3; i++) {
    const val = maxT * i / 3, y = yT(val);
    svg.append(svgEl("line", { class: "grid", x1: pad.l, x2: W - pad.r, y1: y, y2: y }));
    svg.append(svgEl("text", { x: pad.l - 6, y: y + 3, "text-anchor": "end" }, String(Math.round(val))));
  }
  const step = Math.max(1, Math.ceil(data.length / (compact ? 4 : (NARROW ? 5 : 6))));
  data.forEach((d, i) => {
    if (i % step === 0 || i === data.length - 1) {
      svg.append(svgEl("text", { x: pad.l + i * bw + bw / 2, y: H - 7, "text-anchor": "middle" }, shortDate(d.date)));
    }
  });
  const gap = Math.max(2, bw * .24);
  data.forEach((d, i) => {
    const top = yT(d.tests);
    const h = Math.max(d.tests ? 2 : 0, ih - (top - pad.t));
    const rect = svgEl("rect", { class: "admbar", x: pad.l + i * bw + gap / 2, y: top, width: Math.max(1, bw - gap), height: h, rx: Math.min(3, bw / 3) });
    rect.append(svgEl("title", {}, fmtDate(d.date) + ": " + d.tests + " " + plural(d.tests, "задание", "задания", "заданий") + ", " + (d.students || 0) + " " + plural(d.students || 0, "ученик", "ученика", "учеников")));
    rect.addEventListener("mousemove", e => showTip(e, fmtDate(d.date) + " · " + d.tests + " " + plural(d.tests, "задание", "задания", "заданий") + " · " + (d.students || 0) + " " + plural(d.students || 0, "ученик", "ученика", "учеников")));
    rect.addEventListener("mouseleave", hideTip);
    svg.append(rect);
  });
  if (data.some(d => d.students)) {
    const pts = data.map((d, i) => [pad.l + i * bw + bw / 2, yS(d.students || 0)]);
    const dPath = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    svg.append(svgEl("path", { d: dPath, fill: "none", stroke: "var(--c-hoeren)", "stroke-width": compact ? 1.4 : 1.7, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: .75 }));
  }
  return svg;
}

function levelDonut() {
  const bands = (S.data && S.data.distribution) || [];
  const total = bands.reduce((a, b) => a + b.students, 0);
  const colors = ["var(--c-low)", "var(--c-mid)", "var(--c-good)", "var(--c-high)"];
  const R = 54, C = 2 * Math.PI * R;
  const svg = svgEl("svg", { viewBox: "0 0 140 140", role: "img", "aria-label": "Распределение по успеваемости" });
  svg.append(svgEl("circle", { cx: 70, cy: 70, r: R, stroke: "var(--soft)", "stroke-width": 14, fill: "none" }));
  let offset = 0;
  bands.forEach((b, i) => {
    const len = total ? (b.students / total) * C : 0;
    if (len <= 0) return;
    svg.append(svgEl("circle", { cx: 70, cy: 70, r: R, stroke: colors[i], "stroke-width": 14, "stroke-dasharray": len + " " + (C - len), "stroke-dashoffset": -offset, "stroke-linecap": "butt" }));
    offset += len;
  });
  const avg = S.data && S.data.totals ? S.data.totals.avgScore : null;
  const donut = el("div", { class: "adm-donut" }, svg, el("div", { class: "adm-donut-center" }, el("b", null, pctText(avg)), el("span", null, "средний успех")));
  const legend = el("div", { class: "adm-legend" }, bands.map((b, i) => el("div", { class: "adm-legend-row" }, el("i", { style: "background:" + colors[i] }), b.label, el("b", null, b.students))));
  const t = (S.data && S.data.totals) || {};
  const totalTasks = Math.max(1, (t.successTasks || 0) + (t.midTasks || 0) + (t.failTasks || 0));
  const share = n => Math.round((n || 0) / totalTasks * 100);
  const split = el("div", { class: "adm-split" },
    el("div", { class: "adm-split-title" }, el("span", null, "Задания по результату"), el("span", null, fmt(t.tasks) + " " + plural(t.tasks || 0, "задание", "задания", "заданий"))),
    el("div", { class: "adm-split-bar", role: "img", "aria-label": "Успешно " + share(t.successTasks) + "%, средне " + share(t.midTasks) + "%, слабо " + share(t.failTasks) + "%" },
      el("i", { class: "ok", style: "width:" + share(t.successTasks) + "%" }),
      el("i", { class: "mid", style: "width:" + share(t.midTasks) + "%" }),
      el("i", { class: "bad", style: "width:" + share(t.failTasks) + "%" })),
    el("div", { class: "adm-split-legend" },
      el("span", null, el("i", { style: "background:var(--ok)" }), "успешно 80%+ · " + share(t.successTasks) + "%"),
      el("span", null, el("i", { style: "background:var(--warn)" }), "средне · " + share(t.midTasks) + "%"),
      el("span", null, el("i", { style: "background:var(--bad)" }), "слабо <50% · " + share(t.failTasks) + "%")));
  return el("div", null, el("div", { class: "adm-donut-wrap" }, donut, legend), split);
}

function sectionBars(sections) {
  return el("div", { class: "adm-bars" }, sections.map(s => el("div", { class: "adm-bar-row " + s.id },
    el("div", { class: "adm-bar-top" }, el("b", null, s.name), el("span", null, s.pct == null ? "нет данных" : Math.round(s.pct) + "% · " + fmt(s.attempts) + " " + plural(s.attempts, "попытка", "попытки", "попыток"))),
    el("div", { class: "adm-track" }, el("i", { "data-w": s.pct == null ? 0 : Math.round(s.pct) }))
  )));
}

function weakList(weak, compact) {
  if (!weak || !weak.length) return el("div", { class: "adm-chart-empty" }, "Ошибок нет — отличная работа!");
  const max = Math.max(1, ...weak.map(w => w.count));
  return el("div", { class: "adm-weak" }, weak.slice(0, compact ? 5 : 6).map(w =>
    el("div", { class: "adm-weak-row" },
      el("span", { class: "adm-weak-name", title: w.label }, w.label),
      el("span", { class: "adm-weak-count" }, fmt(w.count)),
      el("div", { class: "adm-weak-bar" }, el("i", { style: "width:" + Math.round(w.count / max * 100) + "%" }))
    )
  ));
}

function trendChart(points) {
  if (!points || points.length < 2) return el("div", { class: "adm-chart-empty" }, "Нужно хотя бы два результата, чтобы увидеть динамику.");
  const W = 500, H = 132, pad = { l: 28, r: 10, t: 12, b: 22 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const n = points.length;
  const x = i => pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = v => pad.t + ih - (v / 100) * ih;
  const svg = svgEl("svg", { class: "adm-chart", viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Динамика последних результатов" });
  svg.append(svgEl("defs", {}, svgEl("linearGradient", { id: "admArea", x1: "0", y1: "0", x2: "0", y2: "1" }, svgEl("stop", { offset: "0", "stop-color": "var(--accent)", "stop-opacity": ".22" }), svgEl("stop", { offset: "1", "stop-color": "var(--accent)", "stop-opacity": "0" }))));
  [0, 50, 100].forEach(v => {
    svg.append(svgEl("line", { class: "grid", x1: pad.l, x2: W - pad.r, y1: y(v), y2: y(v) }));
    svg.append(svgEl("text", { x: pad.l - 5, y: y(v) + 3, "text-anchor": "end" }, v + "%"));
  });
  const line = points.map((p, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(p.pct).toFixed(1)).join(" ");
  const area = line + " L" + x(n - 1).toFixed(1) + " " + y(0) + " L" + x(0).toFixed(1) + " " + y(0) + " Z";
  svg.append(svgEl("path", { class: "area", d: area }));
  svg.append(svgEl("path", { class: "line", d: line }));
  points.forEach((p, i) => {
    const dot = svgEl("circle", { class: "dot", cx: x(i), cy: y(p.pct), r: 3.2 });
    dot.append(svgEl("title", {}, p.date + ": " + Math.round(p.pct) + "%"));
    dot.addEventListener("mousemove", e => showTip(e, shortDate(p.date) + " · " + Math.round(p.pct) + "%"));
    dot.addEventListener("mouseleave", hideTip);
    svg.append(dot);
  });
  svg.append(svgEl("text", { x: x(0), y: H - 5, "text-anchor": "start" }, shortDate(points[0].date)));
  svg.append(svgEl("text", { x: x(n - 1), y: H - 5, "text-anchor": "end" }, shortDate(points[n - 1].date)));
  return svg;
}

/* -------------------------------------------------------------- ui parts --- */
function avatar(name, initials, cls) {
  return el("span", { class: "adm-avatar" + (cls ? " " + cls : ""), style: avatarStyle(name), "aria-hidden": "true" }, initials || "?");
}

function kpi(label, value, note, iconName, tone) {
  return el("div", { class: "adm-kpi", style: "--tone:" + tone },
    el("div", { class: "adm-kpi-top" }, el("div", { class: "adm-kpi-ico" }, icon(iconName, 16)), el("span", { class: "adm-kpi-label" }, label)),
    el("div", { class: "adm-kpi-value" }, value),
    el("div", { class: "adm-kpi-note" }, note)
  );
}

function progress(v, best) {
  return el("div", { class: "adm-progress", title: best == null ? "Текущий результат: " + pctText(v) : "Текущий: " + pctText(v) + " · лучший: " + pctText(best) },
    el("div", { class: "adm-track" }, el("i", { class: "score-" + scoreTone(v), "data-w": v == null ? 0 : Math.round(v) })),
    el("b", { class: "score-" + scoreTone(v) }, pctText(v))
  );
}

function studentCell(s) {
  const sub = s.hasName
    ? (s.firstDay ? "с нами с " + fmtDate(s.firstDay) : "облачный прогресс") + (s.streak && s.streak.current >= 2 ? " · 🔥 " + s.streak.current : "")
    : "не заполнил(а) анкету · " + s.uid.slice(0, 8) + "…";
  return el("div", { class: "adm-student" }, avatar(s.name, s.initials),
    el("div", { class: "adm-student-name" }, el("b", null, s.name), el("span", null, sub), s.email ? el("span", { class: "adm-email" }, s.email) : null, s.phone ? el("span", { class: "adm-email", dir: "ltr" }, "📱 " + s.phone) : null,
      isSuper() && !S.group && S.data && S.data.groups && S.data.groups.length > 1 ? el("span", { class: "adm-email" }, "👥 " + groupName(s.group)) : null));
}

/* access to the trainer (and the AI): the teacher confirms a student by hand after the WhatsApp request (stored server-side in Firestore `verified`) */
async function toggleVerify(s, reopen) {
  const want = !s.verified;
  let r;
  try {
    r = await api("/api/admin/verify", { method: "POST", body: JSON.stringify({ uid: s.uid, verified: want }) });
  } catch (e) { alert(e.message || "Не удалось сохранить."); return; }
  s.verified = want;
  setSubLocal(s, r && r.sub);
  renderStudentList(); syncFilterButtons();
  if (reopen) renderDrawerFor(s.uid);
}
// two separate things: admission to the trainer (new sign-ups wait for it; old accounts have it automatically)
// and the paid AI (opened by hand for students who contribute)
async function toggleAdmit(s, reopen) {
  let r;
  try { r = await api("/api/admin/admit", { method: "POST", body: JSON.stringify({ uid: s.uid, admitted: !s.admitted }) }); }
  catch (e) { alert(e.message || "Не удалось сохранить."); return; }
  s.admitted = !s.admitted;
  if (r && r.sub) setSubLocal(s, r.sub);
  renderStudentList(); syncFilterButtons();
  if (reopen) renderDrawerFor(s.uid);
}
/* subscriptions: a paid month (5 € trainer, 10 € with AI) or a 2-3 day trial; the server closes access when it ends */
const DAY_MS = 24 * 3600 * 1000;
function setSubLocal(s, t) {
  const now = Date.now();
  s.sub = t ? { plan: t.plan, until: t.until || 0, trial: !!t.trial, trialUsed: !!t.trialUsed,
    days: t.until > 0 ? Math.max(0, Math.ceil((t.until - now) / DAY_MS)) : null, expired: t.until > 0 && t.until <= now } : null;
}
const subDate = ms => new Date(ms).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
// short state for the list: "до 21.12", "пробный · 2 дн.", "срок истёк"; nothing for unlimited access
function subChip(s) {
  const t = s.sub;
  if (!t || !(t.until > 0)) return null;
  if (t.expired) return el("span", { class: "adm-chip warn" }, t.trial ? "Пробный закончился" : "Срок истёк");
  return el("span", { class: "adm-chip" + (t.days <= 3 ? " warn" : "") }, el("span", null, t.trial ? "Пробный" : "до"), " ", t.trial ? String(t.days) : subDate(t.until).slice(0, 5), t.trial ? " " : null, t.trial ? el("span", null, "дн.") : null);
}
async function subAction(s, body, reopen) {
  let r;
  try { r = await api("/api/admin/sub", { method: "POST", body: JSON.stringify(Object.assign({ uid: s.uid }, body)) }); }
  catch (e) { alert(e.message || "Не удалось сохранить."); return; }
  setSubLocal(s, r && r.sub);
  if (body.action !== "unlimited") { s.admitted = true; s.verified = body.plan === "ai"; }
  renderStudentList(); syncFilterButtons();
  if (reopen) renderDrawerFor(s.uid);
}
function giveTrial(s, days, reopen) {
  const ai = confirm("Пробный период на " + days + " дн. для " + s.name + ".\nОК: с ИИ. Отмена: без ИИ.");
  subAction(s, { action: "trial", days, plan: ai ? "ai" : "basic" }, reopen);
}
function subBlock(s) {
  const t = s.sub, has = t && t.until > 0;
  const state = !has ? el("p", null, el("b", null, "Подписка:"), " ", el("span", null, "бессрочно"))
    : t.expired ? el("p", { class: "adm-sub-end" }, el("b", null, t.trial ? "Пробный период закончился" : "Подписка закончилась"), " ", subDate(t.until))
    : el("p", null, el("b", null, t.trial ? "Пробный период до" : "Оплачено до"), " ", subDate(t.until), " · ",
        el("span", null, t.plan === "ai" ? "Тренажёр + ИИ" : "Тренажёр"), " · ", el("span", null, "осталось дней:"), " " + t.days);
  return el("div", { class: "adm-drawer-note adm-sub" }, state,
    el("div", { class: "adm-sub-btns" },
      el("button", { class: "adm-btn primary", onclick: () => subAction(s, { action: "month", plan: "basic" }, true) }, "+1 месяц · 5 €"),
      el("button", { class: "adm-btn primary", onclick: () => subAction(s, { action: "month", plan: "ai" }, true) }, "+1 месяц с ИИ · 10 €"),
      t && t.trialUsed ? null : el("button", { class: "adm-btn", onclick: () => giveTrial(s, 2, true) }, "Пробный 2 дня"),
      t && t.trialUsed ? null : el("button", { class: "adm-btn", onclick: () => giveTrial(s, 3, true) }, "Пробный 3 дня"),
      has ? el("button", { class: "adm-btn", onclick: () => { if (confirm("Сделать доступ " + s.name + " бессрочным?")) subAction(s, { action: "unlimited" }, true); } }, "Бессрочно") : null),
    el("div", { class: "adm-email" }, "Оплата месяца включает доступ сразу. Когда срок кончится, доступ закроется сам, а ученику придёт письмо."));
}
// what the student can use right now. When the trial or the paid month is over the server closes the whole trainer
// (not only the AI), so the list says so plainly until the administrator confirms a payment.
function accessChip(s) {
  if (!s.admitted) return el("span", { class: "adm-chip warn" }, "Нет доступа");
  if (s.sub && s.sub.expired) return el("span", { class: "adm-chip bad" }, "⛔ ", el("span", null, "Тренажёр закрыт до оплаты"));
  return el("span", { class: "adm-chip " + (s.verified ? "ok" : "") }, s.verified ? "ИИ открыт" : "ИИ закрыт");
}
function verifyControl(s, reopen) {
  // a group teacher only sees the state; every change is made by the main administrator
  if (!isSuper()) return el("span", { class: "adm-verify" },
    accessChip(s), subChip(s));
  if (!s.admitted) return el("span", { class: "adm-verify" },
    el("span", { class: "adm-chip warn" }, "Ждёт допуска"),
    el("button", { class: "adm-btn primary", onclick: e => { e.stopPropagation(); toggleAdmit(s, reopen); } }, "Допустить"));
  return el("span", { class: "adm-verify" },
    accessChip(s), subChip(s),
    el("button", { class: "adm-btn", onclick: e => { e.stopPropagation(); toggleVerify(s, reopen); } }, s.verified ? "Закрыть ИИ" : "Открыть ИИ"),
    reopen ? el("button", { class: "adm-btn danger", onclick: e => { e.stopPropagation(); if (confirm("Заблокировать " + s.name + "? Тренажёр и ИИ закроются, прогресс сохранится.")) toggleAdmit(s, reopen); } }, "Заблокировать") : null);
}

/* removing strangers: tick students, save a backup, then delete progress, approval and the account */
function pickBox(s) {
  if (!isSuper()) return null;
  return el("input", { type: "checkbox", class: "adm-pick", "aria-label": "Выбрать " + s.name, checked: S.picked.has(s.uid),
    onclick: e => e.stopPropagation(), onkeydown: e => e.stopPropagation(),
    onchange: e => { e.target.checked ? S.picked.add(s.uid) : S.picked.delete(s.uid); syncPicked(); } });
}
function syncPicked() {
  const b = document.getElementById("adm-del");
  if (b) { b.disabled = !S.picked.size; b.textContent = "Удалить выбранных · " + S.picked.size; }
  const a = document.getElementById("adm-approve");
  if (a) { a.disabled = !S.picked.size; a.textContent = "Допустить выбранных · " + S.picked.size; }
  const bl = document.getElementById("adm-block");
  if (bl) { bl.disabled = !S.picked.size; bl.textContent = "Заблокировать · " + S.picked.size; }
  const mv = document.getElementById("adm-move");
  if (mv) mv.disabled = !S.picked.size;
  const all = document.getElementById("adm-pick-all");
  if (all) { const list = filteredStudents(); all.checked = list.length > 0 && list.every(s => S.picked.has(s.uid)); }
}
// tick / untick every student in the current filter (e.g. "Ждут допуска")
function pickAll(on) {
  filteredStudents().forEach(s => on ? S.picked.add(s.uid) : S.picked.delete(s.uid));
  document.querySelectorAll(".adm-pick:not(#adm-pick-all)").forEach(b => { b.checked = on; });
  renderStudentList(); syncPicked();
}
// admit many new students at once: they appear in the leaderboard and get the trainer (the AI stays closed)
async function approvePicked() {
  const all = (S.data && S.data.students) || [];
  const chosen = all.filter(s => S.picked.has(s.uid) && !s.admitted);
  if (!chosen.length) { S.picked.clear(); renderStudentList(); syncPicked(); return; }
  if (!confirm("Допустить " + chosen.length + " учеников? Они появятся в рейтинге и получат доступ к тренажёру. ИИ останется закрытым.")) return;
  const btn = document.getElementById("adm-approve"); if (btn) { btn.disabled = true; btn.textContent = "Допускаем…"; }
  let failed = 0;
  for (const s of chosen) {
    try { const r = await api("/api/admin/admit", { method: "POST", body: JSON.stringify({ uid: s.uid, admitted: true }) }); s.admitted = true; setSubLocal(s, r && r.sub); S.picked.delete(s.uid); }
    catch { failed++; }
  }
  if (failed) alert("Не удалось допустить: " + failed);
  renderStudentList(); syncFilterButtons(); syncPicked();
}
// block many students: they lose the trainer and the AI, the progress stays (works for old accounts too)
async function blockPicked() {
  const all = (S.data && S.data.students) || [];
  const chosen = all.filter(s => S.picked.has(s.uid) && s.admitted);
  if (!chosen.length) return;
  if (!confirm("Заблокировать " + chosen.length + " учеников? Тренажёр и ИИ закроются, прогресс сохранится. Вернуть можно кнопкой «Допустить».")) return;
  let failed = 0;
  for (const s of chosen) {
    try { await api("/api/admin/admit", { method: "POST", body: JSON.stringify({ uid: s.uid, admitted: false }) }); s.admitted = false; S.picked.delete(s.uid); }
    catch { failed++; }
  }
  if (failed) alert("Не удалось заблокировать: " + failed);
  renderStudentList(); syncFilterButtons(); syncPicked();
}
// move ticked students to another (approved) group
async function movePicked(sel) {
  const code = sel.value; sel.value = "";
  const chosen = ((S.data && S.data.students) || []).filter(s => S.picked.has(s.uid));
  if (!code || !chosen.length) return;
  if (!confirm("Перенести " + chosen.length + " учеников в группу «" + groupName(code) + "»?")) return;
  try { await api("/api/admin/move", { method: "POST", body: JSON.stringify({ uids: chosen.map(s => s.uid), group: code }) }); }
  catch (e) { alert(e.message || "Не удалось перенести."); return; }
  S.picked.clear();
  loadDashboard();
}
function moveSelect() {
  const open = ((S.data && S.data.groups) || []).filter(g => g.status === "ok");
  if (open.length < 2) return null;
  return el("select", { class: "adm-select", id: "adm-move", "aria-label": "Перенести в группу", disabled: !S.picked.size, onchange: e => movePicked(e.target) },
    el("option", { value: "" }, "Перенести в группу…"), open.map(g => el("option", { value: g.code }, g.name)));
}
// old accounts were made by name + birth date without a real e-mail. The main administrator sets the e-mail and,
// if wanted, a new password right here: then the person signs in at once, no letter needed.
async function linkEmailFor(s) {
  const email = prompt("E-mail для входа: " + s.name, s.email || "");
  if (!email) return;
  const pw = prompt("Новый пароль (не меньше 6 символов).\nОставьте пустым, чтобы только привязать e-mail и потом нажать «Забыли пароль?» на сайте.", "");
  if (pw === null) return;
  try { await api("/api/admin/link-email", { method: "POST", body: JSON.stringify({ uid: s.uid, email: email.trim(), password: pw }) }); }
  catch (e) { alert(e.message || "Не удалось сохранить."); return; }
  alert(pw ? "Готово. Теперь на сайте откройте «Вход» и войдите: " + email.trim() + " и новый пароль. Письмо не нужно."
    : "Готово. Теперь на сайте откройте «Вход», нажмите «Забыли пароль?» и укажите " + email.trim() + ". Придёт письмо для нового пароля.");
}
function saveJson(obj, name) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const a = el("a", { href: URL.createObjectURL(blob), download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
async function deletePicked() {
  const all = (S.data && S.data.students) || [];
  const chosen = all.filter(s => S.picked.has(s.uid));
  if (!chosen.length) return;
  const names = chosen.map(s => "• " + s.name + (s.email ? " <" + s.email + ">" : "") + " — " + fmt(s.allPoints) + " очк.").join("\n");
  if (!confirm("Удалить " + chosen.length + " учеников навсегда?\n\n" + names + "\n\nПрогресс, доступ и аккаунт будут удалены. Резервная копия скачается автоматически.")) return;
  let out;
  try { out = await api("/api/admin/delete", { method: "POST", body: JSON.stringify({ uids: chosen.map(s => s.uid) }) }); }
  catch (e) { alert(e.message || "Не удалось удалить."); return; }
  const info = chosen.map(s => ({ uid: s.uid, name: s.name, fam: s.fam, vor: s.vor, email: s.email, points: s.allPoints }));
  saveJson({ deletedAt: new Date().toISOString(), students: info, documents: out.backup || [] }, "dtb-deleted-" + todayIso() + ".json");
  (out.deleted || []).forEach(u => S.picked.delete(u));
  if (out.failed && out.failed.length) alert("Не удалось удалить " + out.failed.length + ":\n" + out.failed.map(f => f.uid + ": " + f.message).join("\n"));
  loadDashboard();
}

function filterCounts() {
  const all = (S.data && S.data.students) || [];
  const d7 = daysAgo(6), d14 = daysAgo(13);
  return {
    all: all.length,
    active: all.filter(s => s.lastActive && s.lastActive >= d7).length,
    help: all.filter(s => (s.scorePct != null && s.scorePct < 50) || s.failures >= 10).length,
    inactive: all.filter(s => !s.lastActive || s.lastActive < d14).length,
    unverified: all.filter(s => !s.admitted).length,
  };
}

function filteredStudents() {
  const q = S.query.trim().toLowerCase();
  const d7 = daysAgo(6), d14 = daysAgo(13);
  let arr = ((S.data && S.data.students) || []).filter(s => {
    if (q && !(s.name.toLowerCase().includes(q) || s.uid.toLowerCase().includes(q) || String(s.email || "").toLowerCase().includes(q))) return false;
    if (S.filter === "active") return s.lastActive && s.lastActive >= d7;
    if (S.filter === "help") return (s.scorePct != null && s.scorePct < 50) || s.failures >= 10;
    if (S.filter === "inactive") return !s.lastActive || s.lastActive < d14;
    if (S.filter === "unverified") return !s.admitted;
    return true;
  });
  const cmp = {
    name: (a, b) => a.name.localeCompare(b.name, "ru"),
    // same order as the students' leaderboard: total points (rank), people without points last
    rating: (a, b) => (a.allRank == null ? 1e9 : a.allRank) - (b.allRank == null ? 1e9 : b.allRank) || a.name.localeCompare(b.name, "ru"),
    "score-desc": (a, b) => (b.scorePct == null ? -1 : b.scorePct) - (a.scorePct == null ? -1 : a.scorePct) || a.name.localeCompare(b.name, "ru"),
    "days-desc": (a, b) => b.days - a.days || a.name.localeCompare(b.name, "ru"),
    "tests-desc": (a, b) => b.attempts - a.attempts || a.name.localeCompare(b.name, "ru"),
    "fail-desc": (a, b) => b.failures - a.failures || a.name.localeCompare(b.name, "ru"),
    "active-desc": (a, b) => String(b.lastActive || "").localeCompare(String(a.lastActive || "")) || a.name.localeCompare(b.name, "ru"),
  };
  const base = cmp[S.sort] || cmp.name;
  arr.sort((a, b) => (a.hasName === b.hasName ? base(a, b) : a.hasName ? -1 : 1));
  return arr;
}

/* ------------------------------------------------------------------ login -- */
function renderLogin() {
  document.title = typeof admTr === "function" ? admTr("Вход · " + cabTitle()) : "Вход · " + cabTitle();
  const org = S.loginMode === "org";
  const input = el("input", { class: "adm-input", type: "password", name: "password", autocomplete: "current-password", placeholder: "Пароль", required: true, "aria-label": "Пароль" });
  const email = org ? el("input", { class: "adm-input", type: "email", name: "email", autocomplete: "email", placeholder: "name@example.com", required: true, "aria-label": "E-mail" }) : null;
  const err = el("p", { class: "adm-login-error", role: "alert", hidden: !S.loginError }, S.loginError);
  const btn = el("button", { class: "adm-btn primary adm-block", type: "submit" }, S.loginBusy ? "Проверяем…" : "Войти", icon("lock", 16));
  if (S.loginBusy) btn.disabled = true;
  const mode = el("div", { class: "adm-seg", role: "group", style: "margin-bottom:14px" },
    [["super", "Главный администратор"], ["org", "Организатор группы"]].map(([m, l]) =>
      el("button", { type: "button", class: S.loginMode === m ? "on" : "", "aria-pressed": S.loginMode === m, onclick: () => { S.loginMode = m; S.loginError = ""; renderLogin(); } }, l)));
  const form = el("form", { onsubmit: submitLogin },
    org ? el("div", { class: "adm-field" }, el("label", { for: "adm-em" }, "E-mail организатора"), email) : null,
    el("div", { class: "adm-field" }, el("label", { for: "adm-pw" }, org ? "Пароль от тренажёра" : "Пароль администратора"), input),
    err, btn);
  input.id = "adm-pw"; if (email) email.id = "adm-em";
  const hint = org
    ? el("p", { class: "adm-login-hint" }, "Войдите с тем же e-mail и паролем, с которыми вы зарегистрировались в тренажёре как организатор. Кабинет откроется после того, как главный администратор одобрит группу.")
    : S.me && S.me.configured === false
    ? el("p", { class: "adm-login-hint" }, "ADMIN_PASSWORD не задан на сервере. На Vercel добавьте переменную окружения ", el("code", null, "ADMIN_PASSWORD"), " и сделайте Redeploy. При локальном запуске пароль печатается в консоли.")
    : el("p", { class: "adm-login-hint" }, "Пароль проверяется на сервере, в браузере он не сохраняется. Сессия живёт 8 часов.");
  ROOT.replaceChildren(el("div", { class: "adm-login" },
    el("div", { class: "adm-login-card" },
      el("div", { class: "adm-login-top" },
        el("div", { class: "adm-brand-mark" }, "DTB"),
        el("div", { class: "adm-login-tools" }, langSelect(), themeButton())),
      el("h1", null, cabTitle()),
      el("p", { class: "adm-sub" }, "Прогресс учеников DTB B2 Beruf: дни занятий, решённые задания, ошибки и достижения — в одном месте."),
      mode,
      form,
      hint,
      el("p", { class: "adm-login-foot" }, "Данные читаются из Firebase. Доступ только по паролю."))));
  paintAdminTheme();
  requestAnimationFrame(() => (email || input).focus());
}
async function submitLogin(e) {
  e.preventDefault();
  const input = e.target.querySelector("input[name=password]");
  const pw = input ? input.value : "";
  const em = e.target.querySelector("input[name=email]");
  const email = em ? em.value.trim() : "";
  if (!pw || (em && !email)) { S.loginError = em ? "Введите e-mail и пароль." : "Введите пароль."; renderLogin(); return; }
  S.loginBusy = true; S.loginError = ""; renderLogin();
  try {
    const r = await api("/api/admin/login", { method: "POST", body: JSON.stringify(email ? { email, password: pw } : { password: pw }) });
    S.me = Object.assign({}, S.me || {}, { ok: true, configured: true, role: r.role });
    S.loginBusy = false;
    S.data = null;
    await loadDashboard();
  } catch (err) {
    S.loginBusy = false;
    S.loginError = err.code === "no_password"
      ? "На сервере не задан ADMIN_PASSWORD. Добавьте переменную окружения и перезапустите."
      : (err.message || "Не удалось войти.");
    renderLogin();
  }
}

/* ---------------------------------------------------------------- loading -- */
function renderLoading() {
  document.title = typeof admTr === "function" ? admTr(cabTitle() + " · DTB B2 Beruf") : cabTitle() + " · DTB B2 Beruf";
  ROOT.replaceChildren(el("div", { class: "adm-loading" }, el("div", { class: "adm-spinner" }), "Загружаем прогресс учеников…"));
}

async function boot() {
  try {
    const me = await api("/api/admin/me");
    S.me = me;
    if (me.ok) await loadDashboard();
    else { S.loading = false; renderLogin(); }
  } catch (e) {
    S.loading = false;
    S.me = { ok: false };
    S.loginError = e.code === "network" ? "Сервер не отвечает. Запущен ли npm start?" : (e.message || "Ошибка подключения.");
    renderLogin();
  }
}

async function loadDashboard() {
  S.loading = true;
  if (!S.data) renderLoading();
  try {
    const data = await api("/api/admin/dashboard" + (S.group ? "?group=" + encodeURIComponent(S.group) : ""));
    S.data = data;
    S.error = null;
    S.lastLoaded = Date.now();
  } catch (e) {
    if (e.status === 401) { S.me = Object.assign({}, S.me, { ok: false }); S.loading = false; renderLogin(); return; }
    S.error = e;
  } finally {
    S.loading = false;
  }
  render();
}

/* ---------------------------------------------------------------- dashboard */
function render() {
  if (!S.me || !S.me.ok) return renderLogin();
  if (S.loading && !S.data) return renderLoading();
  if (S.error && !S.data) return renderFatal();
  renderDashboard();
}

function topBar() {
  const fixtureSource = !!(S.data && S.data.source === "fixtures");
  const source = !S.data ? (S.error ? "НЕ НАСТРОЕНО" : "FIRESTORE") : fixtureSource ? "ТЕСТОВЫЕ ДАННЫЕ" : "FIRESTORE";
  const badSource = !S.data || fixtureSource;
  return el("header", { class: "adm-top" },
    el("div", { class: "adm-top-in" },
      el("a", { class: "adm-brand", href: "/admin", style: "text-decoration:none;color:inherit" },
        el("span", { class: "adm-brand-mark" }, "DTB"),
        el("span", { class: "adm-brand-text" }, el("b", null, cabTitle()), el("span", null, "DTB B2 Beruf · прогресс учеников"))),
      el("div", { class: "adm-top-right" },
        el("span", { class: "adm-source" + (badSource ? " test" : "") }, source),
        el("span", { class: "adm-updated", id: "adm-updated" }, updatedText()),
        langSelect(),
        themeButton(),
        el("button", { class: "adm-icon-btn", title: "Обновить данные", "aria-label": "Обновить данные", onclick: () => loadDashboard() }, icon("refresh")),
        el("button", { class: "adm-icon-btn", title: "Выйти", "aria-label": "Выйти", onclick: logout }, icon("logout")))));
}

function updatedText() {
  if (!S.lastLoaded) return "";
  const min = Math.max(0, Math.round((Date.now() - S.lastLoaded) / 60000));
  return min < 1 ? "обновлено только что" : "обновлено " + min + " " + plural(min, "минуту", "минуты", "минут") + " назад";
}

/* ---------------------------------------------------------------- groups -- */
const isSuper = () => !S.data || S.data.role === "super";
// main administrator (ADMIN_PASSWORD) sees "Кабинет администратора"; a group organizer sees "Кабинет преподавателя"
function cabTitle() {
  const role = S.data ? S.data.role : S.me && S.me.ok ? S.me.role : (S.loginMode === "org" ? "org" : "super");
  return role === "super" ? "Кабинет администратора" : "Кабинет преподавателя";
}
function groupName(code) {
  const g = ((S.data && S.data.groups) || []).find(x => x.code === code);
  return g ? g.name : (code || "");
}
function groupPicker() {
  const list = (S.data && S.data.groups) || [];
  if (list.length < 2) return null;
  return el("select", { class: "adm-select", style: "margin-top:10px", "aria-label": "Группа", onchange: e => { S.group = e.target.value; S.picked.clear(); loadDashboard(); } },
    el("option", { value: "", selected: !S.group }, "Все группы"),
    list.map(g => el("option", { value: g.code, selected: S.group === g.code }, g.name + " · " + fmt(g.students || 0))));
}
async function groupAction(body, confirmText) {
  if (confirmText && !confirm(confirmText)) return;
  try { await api("/api/admin/groups", { method: "POST", body: JSON.stringify(body) }); }
  catch (e) { alert(e.message || "Не удалось сохранить."); return; }
  loadDashboard();
}
function groupsCard() {
  const list = (S.data && S.data.groups) || [];
  const pending = list.filter(g => g.status !== "ok").length;
  return el("section", { class: "adm-card", style: "margin-bottom:14px" },
    el("div", { class: "adm-card-head" }, el("div", null, el("h2", null, "Группы"),
      el("p", null, pending ? "Заявки организаторов ждут одобрения · " + pending : "Организатор регистрируется в тренажёре и указывает название группы. Здесь вы одобряете группу, после этого у организатора открывается свой кабинет."))),
    el("div", { class: "adm-table-wrap" }, el("table", { class: "adm-table" },
      el("thead", null, el("tr", null, ["Группа", "Организатор", "Учеников", "Статус", ""].map(h => el("th", null, h)))),
      el("tbody", null, list.map(g => el("tr", null,
        el("td", null, el("b", null, g.name), el("div", { class: "adm-email" }, g.code)),
        el("td", null, g.code === "MAIN" ? "вы" : g.code === "PUBLIC" ? "без учителя" : (g.email || "—")),
        el("td", null, el("span", { class: "adm-num" }, fmt(g.students || 0))),
        el("td", null, el("span", { class: "adm-chip " + (g.status === "ok" ? "ok" : "warn") }, g.status === "ok" ? "Одобрена" : "Ждёт одобрения")),
        el("td", null, el("span", { style: "display:inline-flex;gap:6px;flex-wrap:wrap" },
          g.status !== "ok" ? el("button", { class: "adm-btn primary", onclick: () => groupAction({ code: g.code, status: "ok" }) }, "Одобрить") : null,
          el("button", { class: "adm-btn", onclick: () => { const n = prompt("Новое название группы", g.name); if (n && n.trim()) groupAction({ code: g.code, name: n.trim() }); } }, "Переименовать"),
          g.code === "MAIN" || g.code === "PUBLIC" ? null : el("button", { class: "adm-btn danger", onclick: () => groupAction({ code: g.code, remove: true }, "Удалить группу «" + g.name + "»? Ученики группы останутся в базе и будут видны только вам (в «Все группы»).") }, g.status === "ok" ? "Удалить" : "Отклонить")))))))));
}

function renderDashboard() {
  document.title = typeof admTr === "function" ? admTr(cabTitle() + " · DTB B2 Beruf") : cabTitle() + " · DTB B2 Beruf";
  const d = S.data;
  const t = d.totals;
  const counts = filterCounts();
  const students = filteredStudents();
  const main = el("main", { class: "adm-main" });

  const hero = el("div", { class: "adm-hero" },
    el("div", null,
      el("div", { class: "eyebrow", style: "margin-bottom:6px" }, "DTB B2 Beruf · Lehrerkabinett"),
      el("h1", null, isSuper() ? "Прогресс учеников" : el("span", null, el("span", null, "Группа"), " «" + groupName(d.view) + "»")),
      isSuper() ? groupPicker() : null,
      el("p", null, t.students
        ? fmt(t.students) + " " + plural(t.students, "ученик", "ученика", "учеников") + " в облаке · " + fmt(t.active7d) + " активны за неделю · " + fmt(t.tasks) + " заданий решено"
        : "Здесь появятся ученики, которые сохраняют прогресс в облаке.")),
    el("div", { class: "adm-hero-actions" },
      el("button", { class: "adm-btn", onclick: exportCsv, disabled: !students.length }, icon("download", 16), "CSV"),
      el("button", { class: "adm-btn primary", onclick: () => loadDashboard() }, icon("refresh", 16), "Обновить")));

  main.append(hero);
  if (isSuper()) main.append(groupsCard());
  if (S.data && S.data.verifyError) main.append(el("div", { class: "adm-error-card", style: "margin-bottom:14px" }, el("h3", null, "Не удалось загрузить статусы верификации"), "Все ученики пока показаны как не верифицированные. Нажмите «Обновить» или проверьте ключ Firebase."));
  if (S.error && S.data) main.append(el("div", { class: "adm-error-card", style: "margin-bottom:14px" }, el("h3", null, "Не удалось обновить"), S.error.message || "", el("div", { style: "margin-top:8px" }, el("button", { class: "adm-btn", onclick: () => loadDashboard() }, "Повторить"))));

  main.append(el("div", { class: "adm-kpis" },
    kpi("Ученики", fmt(t.students), fmt(t.withData) + " с прогрессом", "users", "var(--accent)"),
    kpi("Активны 7 дней", fmt(t.active7d), fmt(t.active30d) + " за 30 дней", "clock", "var(--c-hoeren)"),
    kpi("Дней занятий", fmt(t.days), t.students ? "в среднем " + (t.days / t.students).toFixed(1) + " на ученика" : "пока нет данных", "calendar", "var(--c-lesen)"),
    kpi("Попыток решения", fmt(t.tests), fmt(t.tasks) + " заданий · " + fmt(t.successTasks) + " успешных", "target", "var(--c-sprechen)"),
    kpi("Средний успех (с первой попытки)", pctText(t.avgScore), "лучший результат " + pctText(t.avgBest), "check", "var(--c-schreiben)"),
    kpi("Ошибки к повтору", fmt(t.failures), fmt(d.weak.length) + " " + (d.weak.length === 1 ? "слабая тема" : "слабых " + plural(d.weak.length, "тема", "темы", "тем")), "alert", "var(--bad)")
  ));

  if (!t.students) {
    if (S.selectedUid) closeDrawerDom();
    main.append(emptyCloudCard());
    main.append(el("p", { class: "adm-foot" }, "Как только первый ученик сохранит прогресс в облаке, здесь появятся графики и таблица."));
    ROOT.replaceChildren(topBar(), main);
    updateUpdated();
    return;
  }

  main.append(el("div", { class: "adm-grid" },
    el("section", { class: "adm-card span-8" },
      el("div", { class: "adm-card-head" },
        el("div", null, el("h2", null, "Активность"), el("p", null, "Сколько заданий решают ученики каждый день")),
        el("div", { class: "adm-seg", role: "group", "aria-label": "Период" }, [7, 14, 30].map(r => el("button", { class: r === S.range ? "on" : "", onclick: () => { S.range = r; renderActivity(); }, "aria-pressed": r === S.range }, r + " дн.")))),
      el("div", { id: "adm-activity" }, activityChart(d.activity, S.range, false)),
      el("div", { class: "adm-legend-inline" },
        el("span", null, el("i", { style: "background:var(--accent);border-radius:2px" }), "задания"),
        el("span", null, el("i", { style: "background:var(--c-hoeren);height:2px;border-radius:0" }), "ученики"))),
    el("section", { class: "adm-card span-4" },
      el("div", { class: "adm-card-head" }, el("div", null, el("h2", null, "Уровни учеников"), el("p", null, "По среднему результату"))),
      levelDonut()),
    el("section", { class: "adm-card span-4" },
      el("div", { class: "adm-card-head" }, el("div", null, el("h2", null, "По частям экзамена"), el("p", null, "Средний результат по всем ученикам"))),
      sectionBars(d.sections)),
    el("section", { class: "adm-card span-4" },
      el("div", { class: "adm-card-head" }, el("div", null, el("h2", null, "Слабые места"), el("p", null, "Части с наибольшим числом ошибок"))),
      weakList(d.weak, true)),
    el("section", { class: "adm-card span-4" },
      el("div", { class: "adm-card-head" }, el("div", null, el("h2", null, "Общий рейтинг"), el("p", null, "Тот же рейтинг, что видят ученики: очки за всё время"))),
      topList(d.top))
  ));

  main.append(el("section", { class: "adm-card adm-students-card span-12" },
    el("div", { class: "adm-students-head" },
      el("h2", null, "Ученики"), el("span", { class: "adm-count", id: "adm-count" }, fmt(students.length)),
      el("span", { class: "adm-small-note", style: "color:var(--muted);font-size:12px" }, "нажмите на строку, чтобы открыть профиль")),
    el("div", { class: "adm-toolbar" },
      el("div", { class: "adm-search" }, icon("search"), el("input", { type: "search", placeholder: "Имя, e-mail или UID", "aria-label": "Поиск ученика", value: S.query, oninput: onSearch })),
      el("div", { class: "adm-filter", role: "group", "aria-label": "Фильтр" }, [
        ["all", "Все", counts.all], ["active", "Активные", counts.active], ["help", "Нужна помощь", counts.help], ["inactive", "Не заходили", counts.inactive], ["unverified", "Ждут допуска", counts.unverified],
      ].map(([id, label, n]) => el("button", { class: S.filter === id ? "on" : "", "data-filter": id, onclick: () => { S.filter = id; renderStudentList(); syncFilterButtons(); }, "aria-pressed": S.filter === id }, label + " · " + n))),
      el("select", { class: "adm-select", "aria-label": "Сортировка", onchange: e => { S.sort = e.target.value; renderStudentList(); } },
        [["rating", "По рейтингу (общие очки)"], ["score-desc", "По точности (с первой попытки)"], ["active-desc", "Недавно активные"], ["fail-desc", "Больше ошибок"], ["days-desc", "Больше дней"], ["tests-desc", "Больше заданий"], ["name", "По имени"]]
          .map(([v, l]) => el("option", { value: v, selected: S.sort === v }, l))),
      isSuper() ? el("button", { class: "adm-btn primary", id: "adm-approve", disabled: !S.picked.size, onclick: approvePicked }, "Допустить выбранных · " + S.picked.size) : null,
      isSuper() ? el("button", { class: "adm-btn", id: "adm-block", disabled: !S.picked.size, onclick: blockPicked }, "Заблокировать · " + S.picked.size) : null,
      isSuper() ? moveSelect() : null,
      isSuper() ? el("button", { class: "adm-btn danger", id: "adm-del", disabled: !S.picked.size, onclick: deletePicked }, "Удалить выбранных · " + S.picked.size) : null),
    el("div", { id: "adm-students-body" }, studentListBody(students))));

  main.append(el("p", { class: "adm-foot" }, "Показаны только имя, прогресс и активность. Дата рождения, адрес и другие поля анкеты не читаются. Данные обновляются, когда ученик сохраняет прогресс в облаке."));
  ROOT.replaceChildren(topBar(), main);
  paintAdminTheme();
  applyWidths();
  syncStudentCount(students.length);
  const m = /^#student=(.+)$/.exec(location.hash);
  if (m) renderDrawerFor(decodeURIComponent(m[1]));
  updateUpdated();
}

function emptyCloudCard() {
  return el("section", { class: "adm-card", style: "margin-bottom:14px" },
    el("div", { class: "adm-empty" },
      el("div", { class: "adm-empty-ico" }, icon("db", 26)),
      el("h2", null, "Пока нет учеников в облаке"),
      el("p", null, "Ученик появляется здесь после того, как заполнит анкету и придумает пароль — тогда его прогресс сохраняется в Firebase и виден преподавателю."),
      el("p", null, "Попросите учеников открыть «Данные участника» (иконка 👤 в шапке тренажёра) и указать пароль от 6 символов. Без пароля прогресс остаётся только в браузере ученика."),
      el("button", { class: "adm-btn primary", onclick: () => loadDashboard() }, icon("refresh", 16), "Проверить снова")));
}

function onSearch(e) {
  S.query = e.target.value;
  clearTimeout(S._searchTimer);
  S._searchTimer = setTimeout(() => renderStudentList(), 120);
}

function syncFilterButtons() {
  const un = document.querySelector('[data-filter="unverified"]');
  if (un) { const t = "Ждут допуска"; un.textContent = (typeof admTr === "function" ? admTr(t) : t) + " · " + filterCounts().unverified; }
  document.querySelectorAll("[data-filter]").forEach(b => {
    const on = b.getAttribute("data-filter") === S.filter;
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function syncStudentCount(n) {
  const c = document.getElementById("adm-count");
  if (c) c.textContent = fmt(n);
}

function renderStudentList() {
  const body = document.getElementById("adm-students-body");
  if (!body) return;
  const list = filteredStudents();
  body.replaceChildren(studentListBody(list));
  syncStudentCount(list.length);
  applyWidths(body);
}

function studentListBody(list) {
  if (!list.length) {
    return el("div", { class: "adm-table-empty" }, (S.data && S.data.students.length) ? "Никого не нашли. Измените запрос или фильтр." : "Пока нет учеников.");
  }
  const table = el("div", { class: "adm-table-wrap" },
    el("table", { class: "adm-table" },
      el("thead", null, el("tr", null, [isSuper() ? el("input", { type: "checkbox", class: "adm-pick", id: "adm-pick-all", "aria-label": "Выбрать всех", title: "Выбрать всех в списке", checked: list.length > 0 && list.every(s => S.picked.has(s.uid)), onchange: e => pickAll(e.target.checked) }) : "", "Место", "Ученик", "Доступ", "Очки", "Дней", "Попыток / заданий", "Успех", "Ошибки", "Был(а)", ""].map(h => el("th", null, h)))),
      el("tbody", null, list.map(s => el("tr", { tabindex: "0", role: "button", "aria-label": "Открыть профиль " + s.name, onclick: () => openStudent(s.uid), onkeydown: e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openStudent(s.uid); } } },
        el("td", null, pickBox(s)),
        el("td", null, el("span", { class: "adm-num" }, s.allRank ? "#" + s.allRank : "—")),
        el("td", null, studentCell(s)),
        el("td", null, verifyControl(s, false)),
        el("td", null, el("span", { class: "adm-num" }, fmt(s.allPoints))),
        el("td", null, el("span", { class: "adm-num" }, fmt(s.days))),
        el("td", null, el("span", { class: "adm-num", title: fmt(s.attempts) + " " + plural(s.attempts, "попытка", "попытки", "попыток") + ", " + fmt(s.tasks) + " " + plural(s.tasks, "задание", "задания", "заданий") }, fmt(s.attempts), el("small", null, " / " + fmt(s.tasks)))),
        el("td", null, progress(s.scorePct, s.bestPct)),
        el("td", null, el("span", { class: "adm-chip " + (s.failures >= 10 ? "bad" : s.failures ? "warn" : "ok") }, fmt(s.failures))),
        el("td", null, el("span", { class: "adm-num", style: "font-family:var(--f-ui);font-size:12.5px;color:var(--muted)" }, relDay(s.lastActive))),
        el("td", null, el("span", { style: "color:var(--muted);display:inline-flex" }, icon("chevron", 15)))
      )))));
  const mobile = el("div", { class: "adm-row-mobile" }, list.map(s => el("div", { class: "adm-student-row", tabindex: "0", role: "button", "aria-label": "Открыть профиль " + s.name, onclick: () => openStudent(s.uid), onkeydown: e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openStudent(s.uid); } } },
    el("div", { style: "display:flex;gap:10px;align-items:center" }, pickBox(s), studentCell(s)),
    verifyControl(s, false),
    el("div", { class: "adm-mrow-stats" },
      el("span", null, "место: ", el("b", null, s.allRank ? "#" + s.allRank : "—")),
      el("span", null, "очков: ", el("b", null, fmt(s.allPoints))),
      el("span", null, "дней: ", el("b", null, fmt(s.days))),
      el("span", null, "попыток: ", el("b", null, fmt(s.attempts))),
      el("span", null, "ошибок: ", el("b", null, fmt(s.failures)))),
    progress(s.scorePct, s.bestPct))));
  return el("div", null, table, mobile);
}

function topList(top) {
  if (!top || !top.length) return el("div", { class: "adm-chart-empty" }, "Пока нет результатов.");
  return el("div", { class: "adm-toplist" }, top.map((s, i) => el("a", { class: "adm-toprow", href: "#student=" + encodeURIComponent(s.uid), onclick: e => { e.preventDefault(); openStudent(s.uid); } },
    el("span", { class: "adm-rank" }, s.rank || i + 1),
    avatar(s.name, s.initials),
    el("span", { class: "adm-topname" }, el("b", null, s.name), el("small", null, fmt(s.tests) + " попыток · " + fmt(s.days) + " дн. · " + pctText(s.avg) + " с первой попытки")),
    el("span", { class: "adm-topscorescore score-" + scoreTone(s.avg) }, fmt(s.points)))));
}

function renderActivity() {
  const wrap = document.getElementById("adm-activity");
  if (!wrap || !S.data) return;
  wrap.replaceChildren(activityChart(S.data.activity, S.range, false));
  document.querySelectorAll(".adm-seg button").forEach(b => {
    const on = b.textContent === S.range + " дн.";
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function applyWidths(root) {
  requestAnimationFrame(() => (root || document).querySelectorAll("[data-w]").forEach(i => {
    const w = Math.max(0, Math.min(100, Number(i.getAttribute("data-w")) || 0));
    i.style.width = w + "%";
  }));
}

/* ----------------------------------------------------------------- funnel --- */
function renderFatal() {
  document.title = typeof admTr === "function" ? admTr(cabTitle() + " · DTB B2 Beruf") : cabTitle() + " · DTB B2 Beruf";
  const e = S.error || {};
  const box = el("div", { class: "adm-main" });
  const card = el("section", { class: "adm-card", style: "margin-top:20px" });
  if (e.code === "no_service_account" || e.code === "no_password") {
    card.append(el("h2", null, "Осталось подключить Firebase"));
    card.append(el("p", { class: "muted", style: "margin:6px 0 14px" }, "Кабинет уже работает, но серверу нужен ключ доступа к Firestore. Это делается один раз."));
    card.append(setupSteps());
    card.append(el("div", { style: "margin-top:14px" }, el("button", { class: "adm-btn primary", onclick: () => loadDashboard() }, icon("refresh", 16), "Проверить снова")));
  } else {
    card.append(el("h2", null, "Не удалось загрузить данные"));
    card.append(el("p", { class: "adm-error-card", style: "margin:12px 0" }, (e.code ? e.code + ": " : "") + (e.message || "Неизвестная ошибка")));
    card.append(el("button", { class: "adm-btn primary", onclick: () => loadDashboard() }, icon("refresh", 16), "Повторить"));
  }
  box.append(card);
  ROOT.replaceChildren(topBar(), box);
  paintAdminTheme();
}

function setupSteps() {
  return el("div", { class: "adm-setup" },
    el("h3", null, "Что нужно сделать"),
    el("ol", null,
      el("li", null, "Firebase Console → ⚙ Project settings → Service accounts → Generate new private key. Скачается JSON."),
      el("li", null, "Vercel → Project → Settings → Environment Variables: добавьте ", el("code", null, "ADMIN_PASSWORD"), " (ваш пароль) и ", el("code", null, "FIREBASE_SERVICE_ACCOUNT"), " (содержимое JSON, можно base64)."),
      el("li", null, "Redeploy проекта. Страница /admin подхватит ключ автоматически.")),
    el("p", { style: "margin:10px 0 0" }, "Локально: ", el("code", null, "ADMIN_PASSWORD=... FIREBASE_SERVICE_ACCOUNT=\"$(cat key.json)\" npm start"), "."));
}

/* ---------------------------------------------------------------- drawer ---- */
function openStudent(uid) {
  if (!S.data) return;
  const h = "#student=" + encodeURIComponent(uid);
  if (location.hash === h) { renderDrawerFor(uid); return; }
  location.hash = h;
}

function closeDrawer() {
  history.replaceState(null, "", location.pathname + location.search);
  closeDrawerDom();
}

function closeDrawerDom() {
  const overlay = document.querySelector(".adm-overlay");
  const drawer = document.querySelector(".adm-drawer");
  if (overlay) overlay.classList.remove("on");
  if (drawer) drawer.classList.remove("on");
  document.body.classList.remove("adm-lock");
  S.selectedUid = null;
  setTimeout(() => { if (!S.selectedUid) { overlay && overlay.remove(); drawer && drawer.remove(); } }, 240);
}

function renderDrawerFor(uid) {
  const s = (S.data && S.data.students || []).find(x => x.uid === uid);
  if (!s) { closeDrawerDom(); return; }
  S.selectedUid = uid;
  let overlay = document.querySelector(".adm-overlay");
  let drawer = document.querySelector(".adm-drawer");
  if (!overlay) {
    overlay = el("div", { class: "adm-overlay", onclick: closeDrawer });
    document.body.append(overlay);
  }
  if (!drawer) {
    drawer = el("aside", { class: "adm-drawer", role: "dialog", "aria-modal": "true", "aria-label": "Профиль ученика" });
    document.body.append(drawer);
  }
  const closeBtn = el("button", { class: "adm-icon-btn adm-drawer-close", title: "Закрыть", "aria-label": "Закрыть профиль", onclick: closeDrawer }, icon("close"));
  const head = el("div", { class: "adm-drawer-head" },
    avatar(s.name, s.initials),
    el("div", { class: "adm-drawer-title" },
      el("h2", null, s.name),
      el("p", null, "UID " + s.uid.slice(0, 10) + "… · " + (s.lastActive ? "был(а) " + relDay(s.lastActive) : "нет активности"))),
    closeBtn);
  const stat = (v, l, cls) => el("div", { class: "adm-dstat" }, el("b", { class: cls || "" }, v), el("span", null, l));
  const body = el("div", { class: "adm-drawer-body" },
    el("div", { class: "adm-drawer-stats" },
      stat(fmt(s.days), "дней занятий"),
      stat(fmt(s.tasks), "заданий"),
      stat(fmt(s.attempts), "попыток"),
      stat(pctText(s.scorePct), "с первой попытки", "score-" + scoreTone(s.scorePct)),
      stat(fmt(s.failures), "ошибок"),
      stat(fmt(s.streak.longest), "лучшая серия")),
    el("p", { class: "adm-drawer-note" }, "Сейчас (с учётом пересдач): " + pctText(s.currentPct) + " · лучший: " + pctText(s.bestPct) + " · успешных заданий: " + fmt(s.successTasks) + " из " + fmt(s.tasks) + " · ошибок к повтору: " + fmt(s.failures)),
    isSuper() ? subBlock(s) : null,
    isSuper() ? el("div", { class: "adm-drawer-note" }, el("button", { class: "adm-btn", onclick: () => linkEmailFor(s) }, "E-mail и пароль для входа"),
      el("div", { class: "adm-email" }, "Если ученик (или вы сами) не может войти: укажите e-mail и новый пароль, письмо не нужно.")) : null,
    el("div", { class: "adm-drawer-note" }, el("span", null, "Доступ"), ": ", verifyControl(s, true), s.email ? el("div", { class: "adm-email" }, s.email) : null, s.phone ? el("div", { class: "adm-email", dir: "ltr" }, el("a", { href: "https://wa.me/" + s.phone.replace(/\D/g, ""), target: "_blank", rel: "noopener" }, "WhatsApp " + s.phone)) : null),
    el("p", { class: "adm-drawer-note" }, s.allRank ? "Общий рейтинг: #" + s.allRank + " · " + fmt(s.allPoints) + " очков" : "Общий рейтинг: —"),
    s.answers && s.answers.total ? el("p", { class: "adm-drawer-note" }, el("span", null, "Верных ответов"), ": " + fmt(s.answers.correct) + " / " + fmt(s.answers.total) + (s.answers.pct != null ? " · " + pctText(s.answers.pct) : "")) : null,
    el("h3", null, "Достижения · " + s.earned + " из 10"),
    el("div", { class: "adm-achievements" }, s.achievements.map(a => el("div", { class: "adm-badge" + (a.earned ? " earned" : ""), title: a.hint }, el("b", null, a.icon), el("span", null, a.label)))),
    el("h3", null, "По частям экзамена"),
    s.parts.length ? sectionBars(s.parts.map(p => ({ id: p.section, name: p.label, pct: p.pct, attempts: p.attempts }))) : el("div", { class: "adm-drawer-empty" }, "Пока нет результатов по частям."),
    el("h3", null, "Активность · 30 дней"),
    el("div", { class: "adm-chart-wrap" }, activityChart(s.activity, 30, true)),
    el("h3", null, "Динамика результатов"),
    el("div", { class: "adm-chart-wrap" }, trendChart(s.trend), el("div", { class: "adm-trend-legend" }, el("span", null, "последние " + s.trend.length + " результатов"), el("b", null, s.trend.length ? pctText(s.trend[s.trend.length - 1].pct) : "—"))),
    el("h3", null, "Что повторить"),
    s.weak.length ? weakList(s.weak.slice().sort((a, b) => b.count - a.count), false) : el("div", { class: "adm-drawer-empty" }, "Ошибок нет — отличная работа!"),
    el("h3", null, "Последние ошибки"),
    s.recentWrong.length ? el("div", { class: "adm-wrong-list" }, s.recentWrong.map(w => el("div", { class: "adm-wrong-item" }, el("b", null, w.part), " · №" + w.n, el("span", null, w.ts ? relDay(w.ts) : "")))) : el("div", { class: "adm-drawer-empty" }, "Ошибок не зафиксировано."),
    el("p", { class: "adm-foot" }, "Показаны только имя, прогресс и активность. Остальные поля анкеты не читаются."));
  drawer.replaceChildren(head, body);
  requestAnimationFrame(() => {
    overlay.classList.add("on");
    drawer.classList.add("on");
    document.body.classList.add("adm-lock");
    closeBtn.focus();
    applyWidths(drawer);
  });
}

/* ------------------------------------------------------------------ misc ---- */
async function logout() {
  try { await api("/api/admin/logout", { method: "POST" }); } catch {}
  S.me = Object.assign({}, S.me, { ok: false });
  S.data = null;
  S.error = null;
  S.loginError = "";
  renderLogin();
}

function csvCell(v) {
  let s = String(v == null ? "" : v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[;"\n\r]/.test(s) ? "\"" + s.replace(/"/g, "\"\"") + "\"" : s;
}

function exportCsv() {
  const rows = filteredStudents();
  if (!rows.length) return;
  const head = ["Фамилия", "Имя", "Дней", "Заданий", "Попыток", "Средний %", "Лучший %", "Успешных", "Ошибок", "Серия", "Последняя активность", "Достижения"].map(h => (typeof admTr === "function" ? admTr(h) : h));
  const lines = [head].concat(rows.map(s => [
    s.fam, s.vor, s.days, s.tasks, s.attempts,
    s.scorePct == null ? "" : Math.round(s.scorePct),
    s.bestPct == null ? "" : Math.round(s.bestPct),
    s.successTasks, s.failures, s.streak.longest, s.lastActive || "",
    s.achievements.filter(a => a.earned).map(a => a.label).join(", "),
  ]));
  const csv = "\uFEFF" + lines.map(r => r.map(csvCell).join(";")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = el("a", { href: URL.createObjectURL(blob), download: "dtb-students-" + todayIso() + ".csv" });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function updateUpdated() {
  const node = document.getElementById("adm-updated");
  if (node) node.textContent = updatedText();
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && S.selectedUid) closeDrawer();
});

window.addEventListener("hashchange", () => {
  const m = /^#student=(.+)$/.exec(location.hash);
  if (m && S.data) renderDrawerFor(decodeURIComponent(m[1]));
  else if (!m && S.selectedUid) closeDrawerDom();
});

setInterval(updateUpdated, 30000);

initAdminTheme();
if (ROOT) boot();
})();
