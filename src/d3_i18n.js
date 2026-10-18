
/* ---------- interface language: RU (default) / EN / DE ----------
   The Russian strings stay in the source. A DOM pass swaps text and attributes for the chosen language,
   so every page, dynamic message and tooltip follows the switch without touching each renderer. */
const LANGS = { ru: "RU", en: "EN", de: "DE" };
const CYR = /[А-Яа-яЁё]/;
const EXTRA = { "Ответ на жалобу": ["Reply to a complaint", "Antwort auf eine Beschwerde"], "Форум": ["Forum", "Forum"], "Начать": ["Start", "Start"] };
const PREFIX_KEYS = ["Неверно · правильно:", "Нет ответа · правильно:", "Правильно:", "Ответ:", "Уровень текста:", "Уровень:", "Правильная записка ·", "Чаще всего ошибки в заданиях №", "Ошибки в №"];
const RULES = [
  [/^прослушано: (\d+)$/, (m) => [`played: ${m[1]}`, `abgespielt: ${m[1]}`]],
  [/^(\d+)% · (.+) из (.+) баллов$/, (m) => [`${m[1]}% · ${m[2]} of ${m[3]} points`, `${m[1]} % · ${m[2]} von ${m[3]} Punkten`]],
  [/^Без ответа: (\d+)\. Всё равно проверить$/, (m) => [`Unanswered: ${m[1]}. Check anyway`, `Ohne Antwort: ${m[1]}. Trotzdem prüfen`]],
  [/^№(.+) \(новый\)$/, (m) => [`№${m[1]} (new)`, `Nr. ${m[1]} (neu)`]],
  [/^· набор (.+)$/, (m) => [`· set ${m[1]}`, `· Satz ${m[1]}`]],
  [/^(\d+) слов$/, (m) => [`${m[1]} words`, `${m[1]} Wörter`]],
  [/^· цель (.+)$/, (m) => [`· target ${m[1]}`, `· Ziel ${m[1]}`]],
  [/^⏱ (\d+) мин$/, (m) => [`⏱ ${m[1]} min`, `⏱ ${m[1]} Min.`]],
  [/^Ваш текст · ошибок: (\d+)$/, (m) => [`Your text · mistakes: ${m[1]}`, `Ihr Text · Fehler: ${m[1]}`]],
  [/^Вариант (.+)$/, (m) => [`Variant ${m[1]}`, `Variante ${m[1]}`]],
  [/^Образец (\d+\w*)$/, (m) => [`Sample ${m[1]}`, `Muster ${m[1]}`]],
  [/^Все темы форума из файла \((\d+)\)$/, (m) => [`All forum topics from the file (${m[1]})`, `Alle Forumsthemen aus der Datei (${m[1]})`]],
  [/^Ситуация (.+)$/, (m) => [`Situation ${m[1]}`, `Situation ${m[1]}`]],
  [/^№(\d+): верно (\d+) из (\d+)$/, (m) => [`No. ${m[1]}: correct ${m[2]} of ${m[3]}`, `Nr. ${m[1]}: richtig ${m[2]} von ${m[3]}`]],
  [/^№(\d+): ещё не решали$/, (m) => [`No. ${m[1]}: not tried yet`, `Nr. ${m[1]}: noch nicht bearbeitet`]],
  [/^Мои ошибки · (\d+)$/, (m) => [`My mistakes · ${m[1]}`, `Meine Fehler · ${m[1]}`]],
  [/^Вариантов: (\d+) · задания (.+)$/, (m) => [`Variants: ${m[1]} · tasks ${m[2]}`, `Varianten: ${m[1]} · Aufgaben ${m[2]}`]],
  [/^(Lesen|Hören|Schreiben|Sprechen) · задания (.+)$/, (m) => [`${m[1]} · tasks ${m[2]}`, `${m[1]} · Aufgaben ${m[2]}`]],
  [/^Немецкие голоса в этом браузере: (\d+)$/, (m) => [`German voices in this browser: ${m[1]}`, `Deutsche Stimmen in diesem Browser: ${m[1]}`]],
  [/^Естественных \(★\): (\d+)\. .*$/, (m) => [`Natural voices (★): ${m[1]}. They are chosen automatically, and each speaker in a dialogue gets their own voice.`, `Natürliche Stimmen (★): ${m[1]}. Sie werden automatisch gewählt, und jede Person im Dialog hat ihre eigene Stimme.`]],
  [/^часть (\d+) из (\d+)$/, (m) => [`part ${m[1]} of ${m[2]}`, `Teil ${m[1]} von ${m[2]}`]],
  [/^Письменная часть сдана: (.+) из 180\. Так держать!$/, (m) => [`Written part passed: ${m[1]} of 180. Keep it up!`, `Schriftlicher Teil bestanden: ${m[1]} von 180. Weiter so!`]],
  [/^Пока (.+) из 180\. .*$/, (m) => [`So far ${m[1]} of 180. You need at least 36 points in each part (one may be 24–36). Look at "Mistakes" and repeat the weak parts.`, `Bisher ${m[1]} von 180. Sie brauchen in jedem Teil mindestens 36 Punkte (einer darf 24–36 haben). Sehen Sie sich „Fehler“ an und wiederholen Sie die schwachen Teile.`]],
  [/^Образец письма (\d+)$/, (m) => [`Sample letter ${m[1]}`, `Musterbrief ${m[1]}`]],
  [/^Ответ ([a-hxA-HXRF])$/, (m) => [`Answer ${m[1]}`, `Antwort ${m[1]}`]],
  [/^цель (.+)$/, (m) => [`target ${m[1]}`, `Ziel ${m[1]}`]],
  [/^набор (.+)$/, (m) => [`set ${m[1]}`, `Satz ${m[1]}`]],
  [/^Высказывания (.+)$/, (m) => [`Statements ${m[1]}`, `Aussagen ${m[1]}`]],
  [/^(.*): не оценено$/, (m, t) => [`${t(m[1])}: not rated`, `${t(m[1])}: nicht bewertet`]],
];
const curLang = () => store.get("lang", "ru");

function trText(s, lang) {
  if (lang === "ru" || !CYR.test(s)) return s;
  const li = lang === "en" ? 0 : 1;
  const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
  const core = s.trim();
  if (!core) return s;
  const hit = (c) => { const e = I18N[c] || EXTRA[c]; if (e) return e[li]; for (const [rx, fn] of RULES) { const m = c.match(rx); if (m) return fn(m, (x) => trText(x, lang))[li]; } return null; };
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
    Object.entries(LANGS).forEach(([k, v]) => sw.append(h("button", { "data-l": k, title: k === "ru" ? "Русский" : k === "en" ? "English" : "Deutsch", onclick: () => { store.set("lang", k); paint(); render(); applyLang(document.body); } }, v)));
    paint(); top.append(sw);
  }
  applyLang(document.body);
}
