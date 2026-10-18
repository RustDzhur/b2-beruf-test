
/* ---------- «Учить наизусть»: all texts to learn in one place ---------- */
const SRC_FILE = () => h("span", { class: "chip ok" }, "из вашего файла");
const SRC_CLAUDE = (t) => h("span", { class: "chip warn" }, t || "пример от Claude, не из файла");

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
    "Образцы писем из вашего файла. Файл сам предупреждает: дословно заученный текст могут посчитать копипастой. Учите структуру и фразы, а в письме пишите своими словами и только то, о чём просил шеф.",
    DB.B.filter(b => b.models && b.models.length).map(b => acc(`Вариант ${String(b.v)} · ${b.topic || ""}`, SRC_FILE(),
      h("div", { class: "eyebrow" }, "Задание шефа"), h("div", { class: "letterview" }, (b.chef || []).join("\n")),
      b.models.map((m, i) => h("div", { class: "stack" }, h("div", { class: "eyebrow" }, "Образец письма" + (b.models.length > 1 ? " " + (i + 1) : "")), learnText(`Образец ${b.v}`, Array.isArray(m) ? m.join("\n") : m))))));

  const forum = sec("f", "Форум (Forumsbeitrag, №58)",
    "Порядок из файла: приветствие, вступление, аргументы за, аргументы против, ваше мнение, имя. Одним абзацем, один стиль (Sie или du), не смешивать.",
    acc("Образец с шаблоном (тема «фитнес-зал»)", SRC_FILE(), learnText("Образец форума", DB.F_MODEL)),
    rmList(REDEMITTEL.forum, 1),
    acc(`Все темы форума из файла (${DB.F.length})`, SRC_FILE(), h("ol", { class: "small", style: "margin:0;padding-left:22px" }, DB.F.map(f => h("li", null, h("b", null, f.title), " — " + f.desc)))));

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
    "Важно: в вашем файле нет текстов этих тем, там только ссылки в Telegram. Эти 8 тем и образцы я написал сам как пример структуры. Когда пришлёте настоящие 8 тем и «Tipps», заменю.",
    DB.SP1.map(s => acc(`${s.n}. ${s.title}`, SRC_CLAUDE(), h("ul", { class: "small", style: "margin:0;padding-left:20px" }, s.points.map(p => h("li", null, p))), learnText(s.title, s.model.map(m => m.t).join("\n\n")))));

  const sp2 = sec("sp2", "Sprechen Teil 2: Smalltalk",
    "Тут то же самое: 77 тем и диалоги есть только ссылкой в Telegram. Эти 10 ситуаций и диалоги написаны мной как пример.",
    DB.SP2.map(s => acc(`${s.n}. ${s.title}`, SRC_CLAUDE(), h("p", { style: "margin:0" }, s.situation), learnDialog(s.title, s.model))));

  const sp3 = sec("sp3", "Sprechen Teil 3: решение проблемы",
    "Ситуации взяты из вашего файла (стр. 168–172), A и B диалогов написал я как образец. Один из многих возможных вариантов.",
    DB.SP3.map(s => acc(`Ситуация ${s.n}`, h("span", { class: "chip ok" }, "ситуация из файла"), h("p", { style: "margin:0" }, s.text), h("ul", { class: "small", style: "margin:0;padding-left:20px" }, s.points.map(p => h("li", null, p))), learnDialog("Ситуация " + s.n, s.model))));

  return h("div", { class: "wrap narrow" },
    crumbs(h("a", { href: "#home" }, "Главная"), "Учить наизусть"),
    h("div", { class: "stack" }, h("h1", null, "Учить наизусть"),
      h("p", { class: "lead", style: "margin:0" }, "Все тексты, которые стоит выучить, собраны здесь: письма, форум, Notiz, фразы и образцы для Sprechen. У каждого есть кнопка «Копировать» и озвучка."),
      h("div", { class: "row" }, h("span", { class: "chip ok" }, "из вашего файла"), h("span", { class: "chip warn" }, "пример от Claude, не из файла"))),
    h("div", { class: "row" }, secs.map(([id, t]) => h("button", { class: "btn small", onclick: () => { const el = document.getElementById("learn-" + id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); } }, t.replace(/ \(.*/, "")))),
    letters, forum, notes, rede, sp1, sp2, sp3);
}
