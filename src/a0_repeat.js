/* ---------- spaced repetition of mistakes (pure logic, unit-tested in tests/repeat.test.js) ----------
   A mistake in localStorage "wrong" is {vid, sec, n, ts, ok, due}. It leaves the list only after REPEAT_NEED correct answers on
   separate days: the first counts from day +1 after the mistake, the second 2 days later (day 3), the third 4 days later (day 7).
   A wrong answer starts the cycle over. A correct answer before `due` is shown to the student but does not count.
   Old entries without ok/due are treated as ok = 0, due = day after the mistake, so nothing stored earlier is lost. */
const REPEAT_GAPS = [1, 2, 4];
const REPEAT_NEED = REPEAT_GAPS.length;
const rpPad = (n) => String(n).padStart(2, "0");
const rpDay = (ts) => { const d = new Date(ts == null ? Date.now() : ts); return d.getFullYear() + "-" + rpPad(d.getMonth() + 1) + "-" + rpPad(d.getDate()); };
function rpAddDays(day, n) {
  const [y, m, d] = day.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.getUTCFullYear() + "-" + rpPad(t.getUTCMonth() + 1) + "-" + rpPad(t.getUTCDate());
}
function rpState(w) {
  const ok = Math.max(0, Math.min(REPEAT_NEED - 1, +(w && w.ok) || 0));
  const due = w && /^\d{4}-\d{2}-\d{2}$/.test(w.due || "") ? w.due : rpAddDays(rpDay(w && w.ts), REPEAT_GAPS[0]);
  return { ok, due };
}
/* One answer to a question. w: stored entry or undefined, day: today as YYYY-MM-DD, nowTs: Date.now(), q: {vid, sec, n}.
   Returns {entry, status, ok, due}; entry === null means "remove from the list".
   status: none (right, nothing to repeat) | wrong (new or restarted) | early (right, but not its day yet) | step (counted) | fixed (3 of 3) */
function rpAnswer(w, correct, day, nowTs, q) {
  if (!correct) {
    const due = rpAddDays(day, REPEAT_GAPS[0]);
    return { entry: { vid: q.vid, sec: q.sec, n: q.n, ts: nowTs, ok: 0, due }, status: "wrong", ok: 0, due };
  }
  if (!w) return { entry: null, status: "none", ok: 0, due: "" };
  const s = rpState(w);
  if (day < s.due) return { entry: Object.assign({}, w, { ok: s.ok, due: s.due }), status: "early", ok: s.ok, due: s.due };
  const ok = s.ok + 1;
  if (ok >= REPEAT_NEED) return { entry: null, status: "fixed", ok: REPEAT_NEED, due: "" };
  const due = rpAddDays(day, REPEAT_GAPS[ok]);
  return { entry: Object.assign({}, w, { ok, due }), status: "step", ok, due };
}
if (typeof module !== "undefined" && module.exports) module.exports = { REPEAT_GAPS, REPEAT_NEED, rpDay, rpAddDays, rpState, rpAnswer };
