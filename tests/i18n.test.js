const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs"), vm = require("vm");

const load = (file, names) => {
  const ctx = vm.createContext({ localStorage: { getItem: () => null } });
  vm.runInContext(fs.readFileSync(file, "utf8").split("function admTr")[0] + ";this.out = {" + names + "};", ctx);
  return ctx.out;
};
const LANGS = ["en", "de", "fr", "tr", "ar", "it"];

// every Russian sentence the mistake-repetition feature puts on screen must exist in all six interface languages
const STUDENT_KEYS = [
  "Как закрываются ошибки", "Ошибка закрыта навсегда: 3 верных ответа в разные дни.", "Повторение засчитано.", "Следующее повторение с:",
  "Верно, но срок ещё не наступил, поэтому ошибка остаётся в списке.", "Засчитается с:",
  "Ошибка записана. Вернитесь завтра: нужно 3 верных ответа в разные дни, через 1, 3 и 7 дней после ошибки.",
  "сегодня", "завтра", "Повторить сегодня", "Как это работает", "Пора повторить", "Ждут своего дня", "С первой попытки", "Сейчас",
  "Ошибка не исчезает после одного верного ответа: так легко угадать. Она закрывается, когда вы ответили на этот вопрос правильно 3 раза в разные дни.",
  "1-й повтор: через 1 день после ошибки", "2-й повтор: через 3 дня после ошибки", "3-й повтор: через 7 дней после ошибки",
  "Ответ раньше срока засчитывается как тренировка, но ошибка остаётся в списке. Неверный ответ начинает отсчёт заново.",
  "Серия ●○○ показывает, сколько повторов уже засчитано.",
  "Если вы видите ошибку здесь после верного ответа, это не сбой: ещё не наступил срок или нужно повторить ещё раз.",
];
test("student interface: repetition texts are translated into every language", () => {
  const { I18N } = load("src/i18n.js", "I18N");
  for (const k of STUDENT_KEYS) {
    const row = I18N[k];
    assert.ok(row, "missing key: " + k);
    assert.equal(row.length, 6, k);
    row.forEach((t, i) => assert.ok(t && t.trim() && !/[А-Яа-яЁё]/.test(t), `${LANGS[i]} untranslated: ${k}`));
    for (const i of [2, 3, 4, 5]) assert.notEqual(row[i], row[0], `${LANGS[i]} falls back to English: ${k}`);
  }
});

test("student interface: 'from <date>' rule translates and nests today/tomorrow", () => {
  const { I18N_RULES } = load("src/i18n.js", "I18N_RULES");
  const rule = I18N_RULES.find(([rx]) => rx === "^Можно с (.+)$");
  assert.ok(rule, "rule missing");
  assert.equal(rule[1].length, 6);
  rule[1].forEach(t => assert.ok(t.includes("{~1}")));
});

test("teacher cabinet: new labels are translated into every language", () => {
  const { ADM_I18N, ADM_RULES } = load("src/admin_i18n.js", "ADM_I18N, ADM_RULES");
  for (const k of ["Общий рейтинг", "Тот же рейтинг, что видят ученики: очки за всё время", "с первой попытки", "Средний успех (с первой попытки)", "Общий рейтинг: —"]) {
    assert.ok(ADM_I18N[k] && ADM_I18N[k].length === 6, "missing key: " + k);
    ADM_I18N[k].forEach(t => assert.ok(t && !/[А-Яа-яЁё]/.test(t), k));
  }
  const samples = ["12 попыток · 1 дн. · 80% с первой попытки", "Общий рейтинг: #2 · 433 очков",
    "Сейчас (с учётом пересдач): 98% · лучший: 98% · успешных заданий: 3 из 3 · ошибок к повтору: 0"];
  for (const s of samples) {
    const r = ADM_RULES.find(([rx]) => rx.test(s));
    assert.ok(r, "no rule for: " + s);
    assert.equal(r[1].length, 6);
  }
});

test("teacher cabinet: counted phrases and tooltips lose no Russian in any language, whatever the plural form", () => {
  const samples = ["1 ученик в облаке · 1 активен за неделю · 1 задание решено", "2 ученика в облаке · 2 активны за неделю · 6 заданий решено",
    "05.10.2026: 0 заданий, 1 ученик", "05.10.2026: 3 задания, 2 ученика", "05.10.2026 · 3 задания · 2 ученика", "Успешно 50%, средне 25%, слабо 25%",
    "Активность: 7 дней", "Открыть профиль Many Attempts", "4 попытки, 3 задания", "Текущий: 98% · лучший: 98%", "Текущий результат: 98%", "Язык",
    "Распределение по успеваемости", "Динамика последних результатов", "решить первое задание", "10 разных заданий", "100 попыток решения", "неделя без пропусков",
    "30 активных дней", "100% за задание", "85%+ на 10 заданиях", "80%+ в Hören", "80%+ в Schreiben",
    "Сейчас (с учётом пересдач): 98% · лучший: 98% · успешных заданий: 3 из 3 · ошибок к повтору: 0", "Общий рейтинг: #2 · 433 очков"];
  const src = fs.readFileSync("src/admin_i18n.js", "utf8").split("function admLangNode")[0] + ";this.admTr = admTr; this.setL = (l) => { ADM_LANG = l; };";
  const ctx = vm.createContext({ localStorage: { getItem: () => null } });
  vm.runInContext(src, ctx);
  for (const l of ["en", "de", "fr", "tr", "ar", "it"]) {
    ctx.setL(l);
    for (const s of samples) assert.ok(!/[А-Яа-яЁё]/.test(ctx.admTr(s)), `${l}: ${s} -> ${ctx.admTr(s)}`);
  }
});
