
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
  { id: "bw", grp: "Schreiben", t: "Письмо клиенту (Beschwerde)", ru: "Пишете сами, Claude проверяет", nums: "21", list: () => DB.B, label: (it) => `№${String(it.v).replace("b", " (новый)")}` + (it.topic ? ` · ${it.topic}` : ""), min: 25, write: true,
    task: "Прочитайте записку шефа и письмо клиента и напишите ответ клиенту сами. Claude проверит грамматику, построение предложений и уровень B2." },
  { id: "f", grp: "Schreiben", t: "Forumsbeitrag", ru: "Мнение на форуме: пишете сами", nums: "58", list: () => DB.F, label: (it) => `${it.n}. ${it.title}`, min: 30, write: true,
    task: "Напишите сообщение на внутреннем форуме: что произошло, плюсы, минусы, ваше мнение. Claude проверит текст." },
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
    task: "Подготовьте и произнесите короткую презентацию по теме (около 2 минут), затем ответьте на вопросы экзаменатора. Claude проверяет ваш текст и играет экзаменатора." },
  { id: "sp2", grp: "Sprechen", t: "Sprechen Teil 2", ru: "Smalltalk (3 мин)", nums: "T2", list: () => DB.SP2, label: (it) => `${it.n}. ${it.title}`,
    task: "Непринуждённый разговор с коллегой на бытовую тему. Посмотрите образец разговора, затем поговорите с Claude." },
  { id: "sp3", grp: "Sprechen", t: "Sprechen Teil 3", ru: "Вместе найти решение (4 мин)", nums: "T3", list: () => DB.SP3, label: (it) => `${it.n}. ${it.text.slice(0, 40)}…`,
    task: "Вы с партнёром обсуждаете проблему на работе и вместе ищете решение. Посмотрите образец диалога, затем поговорите с Claude." },
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
      models: it.models.map(m => m.join("\n")), modelNote: it.model_recon ? "Образец адаптирован под новые имена в задании." : null, onDone: ctx.onWriteDone,  onSkip: ctx.onSkip,
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
    m.q.recon ? h("p", { class: "small muted", style: "margin:0" }, "В файле был только правильный вариант; неверные варианты дописаны.") : null, qz.el(String(m.n)))), qz.footer);
}
