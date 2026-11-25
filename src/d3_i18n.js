
/* ---------- interface language: RU (default) / EN / DE / FR / TR / AR / IT / UK ----------
   The Russian strings stay in the source. A DOM pass swaps text and attributes for the chosen language,
   so every page, dynamic message and tooltip follows the switch without touching each renderer. */
const LANGS = { ru: "RU", en: "EN", de: "DE", fr: "FR", tr: "TR", ar: "AR", it: "IT", uk: "UK" };
const LANG_IDX = { en: 0, de: 1, fr: 2, tr: 3, ar: 4, it: 5, uk: 6 };
const LANG_TITLE = { ru: "Русский", en: "English", de: "Deutsch", fr: "Français", tr: "Türkçe", ar: "العربية", it: "Italiano", uk: "Українська" };
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
    // compact language control: the closed state shows only the code (DE, UK, …), the native list shows full names
    const code = h("span", { class: "langsw-code", "aria-hidden": "true" }, LANGS[curLang()] || "DE");
    const sel = h("select", { class: "langsel", "aria-label": "Language / Sprache / Мова / Язык", title: "Language / Sprache / Мова / Язык",
      onchange: (e) => { store.set("lang", e.target.value); code.textContent = LANGS[e.target.value]; render(); applyLang(document.body); } },
      Object.entries(LANGS).map(([k, v]) => h("option", { value: k, "data-l": k }, LANG_TITLE[k])));
    sel.value = curLang();
    top.append(h("label", { class: "langsw", translate: "no" }, h("span", { class: "langsw-ico", "aria-hidden": "true" }, "🌐"), code, sel));
  }
  applyLang(document.body);
}
