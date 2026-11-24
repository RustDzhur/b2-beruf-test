// The page closes the trainer by itself when the trial or the paid month ends (also offline and in a tab left open)
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs"), vm = require("vm");

const src = fs.readFileSync("src/d5_cloud.js", "utf8");
const fn = src.match(/function cloudTermOver\(\) \{[\s\S]*?\n\}/)[0];
function page(state) {
  const saved = {};
  const ctx = vm.createContext({ cloud: Object.assign({ ok: true, expired: false }, state), Date, store: { set: (k, v) => { saved[k] = v; } } });
  vm.runInContext(fn + "\nthis.over = cloudTermOver;", ctx);
  return { ctx, saved };
}

test("an ended trial closes the trainer even without an answer from the server", () => {
  const { ctx, saved } = page({ sub: { until: Date.now() - 1000, trial: true, plan: "basic" } });
  assert.equal(ctx.over(), true);
  assert.equal(ctx.cloud.ok, false);
  assert.equal(ctx.cloud.expired, true);
  assert.equal(saved.approved, false);
});

test("a running term, unlimited access and the owner stay open", () => {
  for (const sub of [{ until: Date.now() + 3600e3, trial: true }, { until: 0 }, null]) {
    const { ctx } = page({ sub });
    assert.equal(ctx.over(), false);
    assert.equal(ctx.cloud.ok, true);
  }
});

test("the page re-checks access while it stays open", () => {
  assert.match(src, /function cloudWatch\(/);
  assert.match(src, /cloudAccess\(\)\.then\(\(\) => \{ cloudWatch\(/);
  const app = fs.readFileSync("assets/app.js", "utf8");
  assert.ok(app.includes("function cloudTermOver()") && app.includes("function cloudWatch("), "assets/app.js is rebuilt");
});
