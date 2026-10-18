
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
    fb.replaceChildren(thinking("Claude проверяет письмо по критериям экзамена… обычно 30–90 секунд"));
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
  const genBtn = t.gen ? aiButton("Пример от Claude", async () => {
    genBox.hidden = false; genBox.replaceChildren(thinking("Claude пишет пример…")); genBtn.disabled = true;
    try { await askText(t.gen, { cache: false, onText: ({ text }) => { genBox.textContent = text; } }); } catch (e) { genBox.textContent = e.text || errText(e); }
    genBtn.disabled = false;
  }, "") : null;
  const skip = t.onSkip ? h("button", { class: "btn ghost", onclick: t.onSkip }, "Пропустить письмо") : null;
  return h("div", { class: "stack" },
    h("div", { class: "card stack" }, h("div", { class: "spread" }, h("h2", null, t.title), h("div", { class: "row" }, tb, tl)), t.taskEl),
    h("div", { class: "two" },
      h("div", { class: "stack" }, ta, h("div", { class: "spread" }, counter, h("div", { class: "row" }, checkBtn, stopBtn, modelBtn, genBtn, skip)),
        noAiNote("Проверка письма через Claude недоступна в этом просмотре. Сравните текст с образцом и пройдитесь по Redemittel."), models, genBox),
      h("div", { class: "card sticky" }, rm)),
    fb);
}
function feedbackPrompt(t, text) {
  const mx = WMAX[t.kind];
  const task = t.kind === "praesentation" ? PRAES_TASK : t.kind === "beschwerde"
    ? `Aufgabe 21 (DTB B2 Beruf): Antwort auf eine Kundenbeschwerde im Auftrag der Vorgesetzten. Bewertet wird vor allem, ob ALLE Aufträge aus der Notiz der Vorgesetzten umgesetzt sind, ob nichts Unpassendes versprochen wird (z. B. kein Rabatt, wenn er nicht erwähnt ist), ob das Register formell und höflich ist und ob die Textsorte stimmt (Anrede, Bezug, Entschuldigung, Erklärung, Lösung, Schluss, Gruß).\n\n${t.context}`
    : `Aufgabe 58 (DTB B2 Beruf): Forumsbeitrag im Intranet zu folgender Situation. Erwartet werden: kurze Einleitung zum Thema, Vorteile, Nachteile, eigene begründete Meinung, passender Schluss; einheitliches Register (du/ihr oder Sie, nicht gemischt); ca. 150 Wörter.\n\n${t.context}`;
  return `Du bist ein erfahrener, strenger, aber ermutigender Prüfer für telc Deutsch B2 Beruf (DTB). Bewerte den Text eines Lernenden (Muttersprache Russisch).

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
- Alle Kommentare, Erklärungen, das Fazit und die Tipps auf Russisch.
- "leitpunkte": ${t.kind === "beschwerde" ? "jeder einzelne Auftrag aus der Notiz der Vorgesetzten als eigener Punkt (auf Deutsch kurz benannt)" : t.kind === "praesentation" ? "Einleitung mit Gliederung, jeder Stichpunkt des Themas, eigene Meinung, Schluss" : "Einleitung, Vorteile, Nachteile, eigene Meinung, Schluss"}; "status" ist "ja", "teilweise" oder "nein".
- "original" muss wörtlich und exakt im Text des Lernenden vorkommen (1–6 Wörter), "korrektur" ist die korrigierte Form desselben Ausschnitts.
- "typ" ist eines von: Grammatik, Wortschatz, Rechtschreibung, Zeichensetzung, Stil.
- Alle echten Fehler auflisten (höchstens 30), keine Geschmacksfragen.
- "niveau": ehrliche Einschätzung, auf welchem GER-Niveau der Text insgesamt geschrieben ist (A2, B1, B2 oder C1) und warum: Satzbau (Nebensätze, Konnektoren, Satzvielfalt), Wortschatz, Register, Textaufbau. Kommentar auf Russisch.
- "satzbau": 3–6 Sätze aus dem Text, die grammatisch richtig, aber zu einfach für B2 sind (nur Hauptsätze, Wiederholungen, einfache Wörter). "original" wörtlich aus dem Text, "besser" eine elegantere B2-Formulierung (z. B. Nebensatz, Passiv, Nominalisierung, Konnektor), "warum" kurz auf Russisch.
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
    h("div", { class: "spread" }, h("h2", null, "Оценка Claude"), h("span", { class: "ai" }, "ориентировочно")),
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
    gen: `Schreibe einen Musterbeitrag (ca. 150 Wörter, Niveau B2) für ein firmeninternes Forum zum Thema "${it.title}": ${it.desc || ""}\nAufbau: Anrede (Liebe Kolleginnen und Kollegen,), Einleitung, Vorteile, Nachteile, eigene Meinung mit Begründung, Schluss, Gruß. Einheitlich ihr/euch. Nur der Text, ohne Überschrift, ohne Markdown. Danach eine Leerzeile und 5 nützliche Wendungen aus dem Text mit russischer Übersetzung, eine pro Zeile.`,
    models: [DB.F_MODEL], modelNote: "Пример из файла (тема «фитнес-зал») показывает структуру. Для своей темы нажмите «Пример от Claude».",
    onDone: ctx.onWriteDone, onSkip: ctx.onSkip });
}

/* ---------- Telefonnotiz ---------- */
function rNotiz(it, mode, ctx) {
  const segs = [{ who: it.who, t: it.text, g: it.g }];
  const tr = transcript(segs, mode === "learn");
  const pl = makePlayer(segs, { title: "Telefonnachricht", once: mode === "exam", onLine: (i) => tr.highlight(i) });
  const f = {
    name: h("input", { class: "in", id: `n-${it.id}-name`, autocomplete: "off" }),
    phone: h("input", { class: "in", id: `n-${it.id}-phone`, autocomplete: "off", inputmode: "tel" }),
    info: h("textarea", { class: "in", id: `n-${it.id}-info`, rows: 5, placeholder: "• …\n• …" }),
    todo: h("input", { class: "in", id: `n-${it.id}-todo`, autocomplete: "off" }),
  };
  const out = h("div", { class: "stack" });
  const typeSel = h("span", { class: "chip" }, it.type);
  if (mode === "learn") { f.name.value = it.name; f.phone.value = it.phone; f.info.value = it.info.map(i => "• " + i.t).join("\n"); f.todo.value = it.todo; }
  const has = (txt, kw) => kw.every(g => g.split("|").some(a => norm(txt).includes(norm(a))));
  const checkBtn = h("button", { class: "btn primary", onclick: () => {
    const res = [
      { l: "Name: " + it.name, ok: norm(f.name.value).includes(norm(it.name)), n: 42 },
      { l: "Telefon: " + it.phone, ok: f.phone.value.replace(/\D/g, "") === it.phone.replace(/\D/g, ""), n: 43 },
      ...it.info.map(i => ({ l: i.t, ok: has(f.info.value, i.kw), n: 44 })),
      { l: "Zu erledigen: " + it.todo, ok: has(f.todo.value + " " + f.info.value, it.todo_kw), n: 45 },
    ];
    const sc = res.filter(r => r.ok).length;
    saveRes(it.id, sc, res.length);
    trackItems(res.map((r, i) => ({ key: `${it.id}:${i}`, n: r.n, ok: r.ok, vid: it.id, sec: "n" })));
    const pct = sc / res.length;
    out.replaceChildren(h("div", { class: "result" }, h("span", { class: "big" }, `${sc}/${res.length}`), h("span", { class: "chip " + (pct >= .6 ? "ok" : pct >= .4 ? "warn" : "bad") }, Math.round(pct * 100) + "%"),
      h("span", { class: "small muted", style: "flex:1;min-width:200px" }, "Проверка по ключевым словам и цифрам. Формулировка может быть своей, главное — смысл и числа."),
      h("button", { class: "btn", onclick: () => render() }, "↻ Заново")),
      h("div", { class: "card stack" }, h("div", { class: "eyebrow" }, "Правильная записка · " + it.type), res.map(r => h("div", { class: "check " + (r.ok ? "ok" : "no") }, h("span", { class: "m" }, r.ok ? "✓" : "✗"), h("span", null, r.l)))),
      ...(mode === "exam" ? [h("div", { class: "row" }, tr.btn), tr.box] : []));
    checkBtn.disabled = true;
    ctx.onDone && ctx.onDone(sc, res.length);
  } }, "Проверить записку");
  return h("div", { class: "stack" },
    srcNote(it.src),
    pl, mode === "exam" ? null : h("div", { class: "row" }, tr.btn), tr.box,
    h("div", { class: "notiz" },
      h("div", { class: "full spread" }, h("b", null, "Telefonnotiz"), typeSel),
      h("label", { for: f.name.id }, "Name"), f.name,
      h("label", { for: f.phone.id }, "Telefonnummer"), f.phone,
      h("label", { for: f.info.id, class: "full" }, "Weitere Informationen"), h("div", { class: "full" }, f.info),
      h("label", { for: f.todo.id }, "Zu erledigen"), f.todo),
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

// generic practice chat: Claude plays the partner / examiner, then rates the learner's contributions
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
    fb.replaceChildren(thinking("Claude оценивает разговор…")); rateBtn.disabled = true;
    try {
      const d = await askJSON(`${cfg.rateIntro}\nGesprächsverlauf (A = ich, der Lernende; B = Gesprächspartner/in):\n${turns.map(t => (t.role === "user" ? "A: " : "B: ") + t.content).join("\n")}\n\nBewerte nur die Beiträge von A. Antworte NUR mit JSON: {"punkte":0,"max":${cfg.max},"fazit":"...","niveau":{"stufe":"B1","kommentar":"..."},"staerken":["..."],"fehler":[{"original":"...","korrektur":"...","erklaerung":"..."}],"satzbau":[{"original":"...","besser":"...","warum":"..."}],"redemittel":["..."]}\nRegeln: Kommentare, Fazit, Erklärungen und Stärken auf Russisch. "original" wörtlich aus A. "niveau" = geschätztes GER-Niveau von A (A2, B1, B2, C1). "satzbau" = 2–4 richtige, aber zu einfache Sätze von A mit besserer B2-Formulierung. "redemittel" = 3–5 nützliche deutsche Wendungen für dieses Thema.`);
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
    noAiNote("Разговор с Claude здесь недоступен. Потренируйтесь вслух по пунктам и Redemittel и сравните с образцом."),
    startBtn, chat, h("div", { class: "stack", "data-ai": "", hidden: !SAMPLE }, box, h("div", { class: "row" }, sendBtn, rateBtn, h("span", { class: "small muted" }, "Ctrl+Enter — отправить"))), fb);
  return el;
}
const rmCard = (key) => h("div", { class: "card sticky stack" }, h("div", { class: "eyebrow" }, "Redemittel"), SP_REDE[key].map((g, i) => h("details", { class: "rm", open: i < 2 }, h("summary", null, g.h), h("ul", null, g.items.map(s => h("li", null, s))))));
const RULES_COMMON = "Antworte immer nur auf Deutsch, in 2–4 kurzen Sätzen, natürlich gesprochen auf B2-Niveau. Keine Korrekturen, keine Erklärungen, keine Aufzählungen, nur das Gespräch.";

function rSprechen3(it) {
  const m = modelBlock(it.model, "Образец диалога", "A — это вы, B — ваш партнёр. Это один из возможных вариантов: берите структуру и фразы, но говорите своими словами.");
  const chat = chatPartner({
    id: it.id, title: "Разговор с партнёром (Claude)", partnerName: "Партнёр (Claude)", startLabel: "Начать разговор", max: 10,
    rules: () => `Wir üben die mündliche Prüfung telc DTB B2 Beruf, Teil 3 ("Gemeinsam eine Lösung finden"). Du bist meine Gesprächspartnerin, eine freundliche Kollegin. Situation: ${it.text}\nStichpunkte: ${it.points.join("; ")}\nRegeln: ${RULES_COMMON} Mach eigene konkrete Vorschläge, reagiere auf meine Ideen (zustimmen, nachfragen oder höflich widersprechen) und bringe das Gespräch Schritt für Schritt zu einer gemeinsamen Lösung, sodass alle Stichpunkte besprochen werden. Wenn wir uns einigen, bestätige das kurz.`,
    start: "Beginne du das Gespräch: Begrüße mich kurz, beschreibe das Problem in 2 Sätzen und frage mich, was wir tun sollen.",
    rateIntro: `Bewerte meine Beiträge in einem Übungsgespräch für telc DTB B2 Beruf, Sprechen Teil 3 (gemeinsam Lösungen finden, 10 Punkte). Situation: ${it.text}. Stichpunkte: ${it.points.join("; ")}. Kriterien: alle Stichpunkte behandelt, eigene Vorschläge, auf die Partnerin eingehen, Einigung erzielen, Sprache.`,
  });
  return h("div", { class: "two" },
    h("div", { class: "stack" },
      h("div", { class: "card stack" }, h("div", { class: "eyebrow" }, "Situation " + it.n), h("p", { class: "qt", style: "margin:0" }, it.text), h("div", { class: "eyebrow" }, "Diese Stichpunkte helfen Ihnen"), h("ul", { style: "margin:0;padding-left:20px" }, it.points.map(p => h("li", null, p))),
        h("div", { class: "row" }, m.btn)), m.box, chat),
    rmCard("sp3"));
}

function rSprechen2(it) {
  const m = modelBlock(it.model, "Образец разговора", "A — это вы, B — собеседник. Берите фразы и структуру, а ответы делайте про себя.");
  const chat = chatPartner({
    id: it.id, title: "Разговор с собеседником (Claude)", partnerName: "Собеседник (Claude)", startLabel: "Начать разговор", max: 8,
    rules: () => `Wir üben die mündliche Prüfung telc DTB B2 Beruf, Teil 2 (Smalltalk, ca. 3 Minuten, entspannte Alltagsunterhaltung unter Kollegen). Du bist mein Gesprächspartner / meine Gesprächspartnerin. Thema: ${it.title}. Situation: ${it.situation}\nMögliche Aspekte: ${it.points.join("; ")}\nRegeln: ${RULES_COMMON} Stelle immer wieder eine kurze Frage zu meiner Antwort, erzähle auch selbst etwas Kurzes über dich, bleib freundlich und locker.`,
    start: "Beginne du das Gespräch mit einem natürlichen Einstieg zum Thema.",
    rateIntro: `Bewerte meine Beiträge in einem Smalltalk-Übungsgespräch für telc DTB B2 Beruf, Sprechen Teil 2 (8 Punkte). Thema: ${it.title}. Kriterien: auf den Partner eingehen, Gespräch am Laufen halten, Fragen stellen, eigene Erfahrungen erzählen, Wortschatz und Grammatik.`,
  });
  return h("div", { class: "two" },
    h("div", { class: "stack" },
      h("div", { class: "card stack" }, h("div", { class: "eyebrow" }, "Thema " + it.n + " · " + it.title), h("p", { class: "qt", style: "margin:0" }, it.situation), h("ul", { style: "margin:0;padding-left:20px" }, it.points.map(p => h("li", null, p))),
        h("div", { class: "row" }, m.btn)), m.box, chat),
    rmCard("sp2"));
}

function rSprechen1(it, mode, ctx) {
  const m = modelBlock(it.model, "Образец презентации", "Пример структуры: приветствие и план, основная часть с примерами, мнение, заключение. Ваш текст должен быть про вас.");
  const write = writeTask({
    id: "w-" + it.id, kind: "praesentation", title: "Teil 1 · " + it.title, minutes: 6, target: [150, 260],
    taskEl: h("div", { class: "stack" }, h("p", { style: "margin:0" }, "Подготовьте выступление на ~2 минуты (150–260 слов) по теме и этим пунктам. Потом прочитайте его вслух, на экзамене вы говорите свободно. Claude проверит текст, затем задаст вопросы, как экзаменатор."),
      h("ul", { style: "margin:0;padding-left:20px" }, it.points.map(p => h("li", null, p)))),
    context: `Thema: ${it.title}\nStichpunkte: ${it.points.join("; ")}`,
    models: [it.model.map(s => s.t).join("\n\n")], modelNote: "Один из возможных вариантов. Ниже можно ещё послушать его.", onDone: ctx && ctx.onWriteDone,
  });
  const ta = () => (document.getElementById("ta-w-" + it.id) || {}).value || "";
  const qa = chatPartner({
    id: it.id + "-q", title: "Вопросы экзаменатора (2 минуты)", partnerName: "Экзаменатор (Claude)", startLabel: "Задать вопросы по моей презентации", max: 6,
    rules: () => `Wir üben die mündliche Prüfung telc DTB B2 Beruf, Teil 1: Der Prüfling hat eine Präsentation gehalten, danach stellt die Prüferin zwei bis drei Fragen. Du bist die freundliche Prüferin. Thema: ${it.title}. Text der Präsentation:\n"""\n${ta() || "(Der Prüfling hat keinen Text eingegeben; stelle allgemeine Fragen zum Thema.)"}\n"""\nRegeln: ${RULES_COMMON} Stelle genau eine Frage pro Nachricht, die sich auf die Präsentation bezieht, und reagiere kurz auf meine Antwort, bevor du die nächste Frage stellst. Nach drei Fragen bedanke dich und beende das Gespräch.`,
    start: "Stelle jetzt die erste Frage zur Präsentation.",
    rateIntro: `Bewerte meine Antworten auf die Fragen nach einer Präsentation (telc DTB B2 Beruf, Sprechen Teil 1, Thema: ${it.title}). Kriterien: Frage beantwortet, Begründung und Beispiele, flüssig und verständlich, Wortschatz und Grammatik.`,
  });
  const audio = h("div", { class: "stack" }, h("div", { class: "row" }, m.btn), m.box);
  return h("div", { class: "stack" }, write, audio, qa);
}
