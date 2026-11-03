const test = require("node:test");
const assert = require("node:assert/strict");
const { rpAnswer, rpAddDays, rpState } = require("../src/a0_repeat.js");

const Q = { vid: "L1V1", sec: "l1", n: 4 };
const D0 = "2026-11-03";

test("a mistake starts the cycle and becomes due on the next day", () => {
  const r = rpAnswer(undefined, false, D0, 1, Q);
  assert.equal(r.status, "wrong");
  assert.deepEqual([r.entry.ok, r.entry.due], [0, "2026-11-04"]);
});

test("a right answer without a recorded mistake changes nothing", () => {
  assert.equal(rpAnswer(undefined, true, D0, 1, Q).status, "none");
});

test("a right answer the same day does not close the mistake", () => {
  const w = rpAnswer(undefined, false, D0, 1, Q).entry;
  const r = rpAnswer(w, true, D0, 2, Q);
  assert.equal(r.status, "early");
  assert.equal(r.entry.ok, 0);
  assert.equal(r.entry.due, "2026-11-04");
});

test("three right answers on day 1, 3 and 7 close the mistake", () => {
  let w = rpAnswer(undefined, false, D0, 1, Q).entry;
  let r = rpAnswer(w, true, "2026-11-04", 2, Q);
  assert.deepEqual([r.status, r.ok, r.due], ["step", 1, "2026-11-06"]);
  r = rpAnswer(r.entry, true, "2026-11-05", 3, Q);
  assert.equal(r.status, "early");
  r = rpAnswer(r.entry, true, "2026-11-06", 4, Q);
  assert.deepEqual([r.status, r.ok, r.due], ["step", 2, "2026-11-10"]);
  r = rpAnswer(r.entry, true, "2026-11-10", 5, Q);
  assert.equal(r.status, "fixed");
  assert.equal(r.entry, null);
});

test("coming late does not let the student cram: the next step still waits", () => {
  const w = rpAnswer(undefined, false, D0, 1, Q).entry;
  const r = rpAnswer(w, true, "2026-11-20", 2, Q);
  assert.deepEqual([r.status, r.due], ["step", "2026-11-22"]);
});

test("a wrong answer in the middle restarts the cycle", () => {
  let w = rpAnswer(undefined, false, D0, 1, Q).entry;
  w = rpAnswer(w, true, "2026-11-04", 2, Q).entry;
  const r = rpAnswer(w, false, "2026-11-06", 3, Q);
  assert.deepEqual([r.status, r.entry.ok, r.entry.due], ["wrong", 0, "2026-11-07"]);
});

test("entries saved before this feature (no ok/due) are kept and treated as step 0", () => {
  const old = { vid: "L1V1", sec: "l1", n: 4, ts: new Date(2026, 10, 1, 12).getTime() };
  assert.deepEqual(rpState(old), { ok: 0, due: "2026-11-02" });
  assert.equal(rpAnswer(old, true, "2026-11-03", 1, Q).status, "step");
});

test("rpAddDays crosses month and year borders", () => {
  assert.equal(rpAddDays("2026-12-30", 4), "2027-01-03");
  assert.equal(rpAddDays("2026-02-27", 2), "2026-03-01");
});
