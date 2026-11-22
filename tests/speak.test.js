// Sprechen: the free rule-based check of a spoken (transcribed) answer and the translations of its texts
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs"), vm = require("vm");

const util = fs.readFileSync("src/a_util.js", "utf8");
const normSrc = util.match(/const norm = [^\n]+/)[0];
const ctx = vm.createContext({ window: {}, navigator: { userAgent: "" }, h: () => ({}) });
vm.runInContext(normSrc + "\n" + fs.readFileSync("src/d4_speak.js", "utf8") + "\nthis.spCheck = spCheck; this.SR_ERR = SR_ERR; this.SP_RULES = SP_RULES;", ctx);
const REDE = [{ h: "Предложить", items: ["Ich schlage vor, dass wir …", "Als Erstes sollten wir …"] }, { h: "Договориться", items: ["Dann machen wir es so: …", "Sind wir uns einig?"] }];
const POINTS = ["Chef*in: Wie kontaktieren?", "Lager: Was tun?", "Neues Mehl: Woher nehmen? Wo lagern?"];

test("free check: points, Redemittel, connectors and length", () => {
  const text = "Als Erstes sollten wir die Chefin kontaktieren, weil sie entscheiden muss. Das Lager putzen wir heute, obwohl es viel Arbeit ist. Neues Mehl kaufen wir beim Großhändler und lagern es in dichten Dosen.";
  const d = ctx.spCheck(text, { points: POINTS, rede: REDE, target: [30, 80], conn: 3, model: "Wir sollten außerdem die Kundinnen anrufen." });
  assert.deepEqual(d.points.map(p => p.st), ["ok", "ok", "ok"]);
  assert.deepEqual(d.rede.map(g => g.used.length > 0), [true, false]);
  assert.ok(d.conn.includes("weil") && d.conn.includes("obwohl"));
  assert.ok(d.n >= 30 && d.score >= 70, "score " + d.score);
  assert.ok(d.modelWords.includes("Kundinnen"));
  assert.equal(d.errs.length, 0);
});

test("free check: a missing point and typical mistakes are reported", () => {
  const text = "ich habe gestern nach Hause gegangen weil ich bin müde und ich möchte zu anrufen gut gut gut gut";
  const d = ctx.spCheck(text, { points: POINTS, rede: REDE, target: [100, 200] });
  assert.ok(d.points.every(p => p.st === "bad"));
  const hints = d.errs.map(e => e.hint).join(" ");
  assert.match(hints, /sein/); assert.match(hints, /придаточном/); assert.match(hints, /без zu/);
  assert.ok(d.reps.some(([w]) => w === "gut"));
  assert.ok(d.doubles.includes("gut gut"));
  assert.ok(d.score < 50, "score " + d.score);
});

test("free check: correct subordinate clauses are not flagged", () => {
  const d = ctx.spCheck("Ich glaube, dass wir morgen mehr Zeit haben, weil ich heute müde bin. Ich kann zu Ihnen kommen.", { target: [10, 50] });
  assert.equal(d.errs.length, 0, JSON.stringify(d.errs));
});

test("speech texts are translated into every interface language", () => {
  const I18N = vm.runInContext(fs.readFileSync("src/i18n.js", "utf8") + ";I18N", vm.createContext({}));
  const keys = [...Object.values(ctx.SR_ERR), ...ctx.SP_RULES.map(r => r.hint), "Говорить", "Стоп", "Проверить бесплатно", "Проверить с ИИ", "Бесплатная проверка",
    "Этот браузер не умеет превращать речь в текст (например, Firefox). Откройте страницу в Chrome, Edge или Safari, а пока введите ответ вручную."];
  for (const k of keys) {
    const row = I18N[k];
    assert.ok(row && row.length === 7, "missing: " + k);
    row.forEach((t, i) => assert.ok(t && !(i === 6 ? /[ЫыЭэЪъЁё]/ : /[А-Яа-яЁё]/).test(t), i + ": " + k));
  }
});
