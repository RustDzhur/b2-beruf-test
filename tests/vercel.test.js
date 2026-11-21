// The Vercel deployment uses one function (api/router.js) for every routed API path (Hobby plan: max 12 functions).
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { vercelPath } = require("../api/_router.js");

test("rewritten URLs map back to the real API path", () => {
  assert.deepStrictEqual(vercelPath("/api/router?__p=admin/dashboard&group=BERLIN"), { path: "/api/admin/dashboard", url: "/api/admin/dashboard?group=BERLIN" });
  assert.deepStrictEqual(vercelPath("/api/router?__p=groups"), { path: "/api/groups", url: "/api/groups" });
  assert.deepStrictEqual(vercelPath("/api/admin/login"), { path: "/api/admin/login", url: "/api/admin/login" });
  assert.strictEqual(vercelPath("/api/router?group=X&__p=access").path, "/api/access");
});

test("at most 12 serverless functions", () => {
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [e.name]);
  const fns = walk(path.join(__dirname, "..", "api")).filter(n => n.endsWith(".js") && !n.startsWith("_"));
  assert.ok(fns.length <= 12, fns.join(", "));
});
