// Subscriptions: a paid month or a 2-3 day trial, closed by the server when it ends, letters from the daily check.
const fs = require("fs"), os = require("os"), path = require("path");
const { makeUsers } = require("./fixtures.js");
const file = path.join(os.tmpdir(), "dtb-subs-fixture-" + process.pid + ".json");
const users = makeUsers();
users[0].data.cand = Object.assign({}, users[0].data.cand, { email: "anna@example.com", vor: "Anna" });
fs.writeFileSync(file, JSON.stringify(users));
process.env.ADMIN_FIXTURES = file;
process.env.ADMIN_PASSWORD = "main-teacher-pw";
process.env.ADMIN_SECRET = "test-secret";
delete process.env.VERCEL; delete process.env.AI_OPEN; delete process.env.ADMIN_EMAILS;
delete process.env.FIREBASE_SERVICE_ACCOUNT; delete process.env.FIREBASE_SERVICE_ACCOUNT_B64;

const test = require("node:test");
const assert = require("node:assert/strict");
const verify = require("../api/_verify.js");
const router = require("../api/_router.js");
const subs = require("../api/_subs.js");

const call = (method, p, body, cookie, extra) => router.handle({ method, path: p.split("?")[0], body: body ? JSON.stringify(body) : "",
  headers: Object.assign({ host: "x", "x-url": p }, cookie ? { cookie } : {}, extra || {}), ip: "1.2.4." + Math.floor(Math.random() * 200) });
const cookieOf = r => String(r.headers["Set-Cookie"] || "").split(";")[0];
const BEARER = "Bearer " + "t".repeat(40);
const DAY = subs.DAY;

test("a month is one calendar month, also at the end of a month", () => {
  assert.equal(new Date(subs.addMonth(Date.UTC(2026, 0, 31, 10))).toISOString().slice(0, 10), "2026-02-28");
  assert.equal(new Date(subs.addMonth(Date.UTC(2026, 10, 21, 10))).toISOString().slice(0, 10), "2026-12-21");
});

test("admitting starts a month; when it is over, the trainer and the AI close by themselves; no term = unlimited", async () => {
  const uid = users[0].uid;
  verify._hooks.lookupUid = async () => uid;
  verify._hooks.isAdmitted = async () => true;
  verify._hooks.isVerified = async () => true;
  subs._mem.clear();
  let [, a] = await verify.access(BEARER);
  assert.equal(a.verified, true); assert.equal(a.sub, null); // old students: no term

  let r = await call("POST", "/api/admin/login", { password: "main-teacher-pw" });
  const su = cookieOf(r);
  r = await call("POST", "/api/admin/admit", { uid, admitted: true }, su);
  assert.equal(r.status, 200); assert.ok(r.json.sub.until > Date.now() + 27 * DAY);
  [, a] = await verify.access(BEARER);
  assert.equal(a.verified, true); assert.equal(a.sub.plan, "basic");

  subs._mem.set(uid, Object.assign(subs._mem.get(uid), { until: Date.now() - 1000 })); // the month is over
  [, a] = await verify.access(BEARER);
  assert.equal(a.verified, false); assert.equal(a.expired, true);
  assert.equal((await verify.check(BEARER)).code, "expired");

  r = await call("POST", "/api/admin/sub", { uid, action: "month", plan: "ai" }, su); // paid again, with AI
  assert.equal(r.status, 200); assert.equal(r.json.sub.plan, "ai");
  [, a] = await verify.access(BEARER);
  assert.equal(a.verified, true);
  assert.equal((await verify.check(BEARER)).ok, true);

  r = await call("POST", "/api/admin/sub", { uid, action: "unlimited" }, su);
  [, a] = await verify.access(BEARER);
  assert.equal(a.sub, null);
});

test("a trial of 2 or 3 days only once per account, then a paid month replaces it", async () => {
  const uid = users[1].uid;
  subs._mem.clear();
  let r = await call("POST", "/api/admin/login", { password: "main-teacher-pw" });
  const su = cookieOf(r);
  r = await call("POST", "/api/admin/sub", { uid, action: "trial", days: 5 }, su);
  assert.equal(r.status, 400);
  r = await call("POST", "/api/admin/sub", { uid, action: "trial", days: 3, plan: "ai" }, su);
  assert.equal(r.status, 200); assert.equal(r.json.sub.trial, true);
  assert.ok(Math.abs(r.json.sub.until - (Date.now() + 3 * DAY)) < 5000);
  r = await call("POST", "/api/admin/sub", { uid, action: "trial", days: 2 }, su);
  assert.equal(r.status, 409);
  r = await call("POST", "/api/admin/sub", { uid, action: "month", plan: "basic" }, su);
  assert.equal(r.json.sub.trial, false); assert.ok(r.json.sub.until > Date.now() + 27 * DAY);
  assert.equal((await subs.get(uid)).trialUsed, true);

  // without the main administrator's session nothing changes
  r = await call("POST", "/api/admin/sub", { uid, action: "unlimited" });
  assert.equal(r.status, 401);
});

test("daily check: reminder 3 days before, notice after the end, each once; needs CRON_SECRET", async () => {
  const uid = users[0].uid;
  subs._mem.clear();
  const sent = [];
  const old = { ready: subs.mailer.ready, send: subs.mailer.send };
  subs.mailer.ready = () => true;
  subs.mailer.send = async (to, m) => { sent.push([to, m.subject, m.text]); };
  try {
    delete process.env.CRON_SECRET;
    let r = await call("GET", "/api/cron/subs");
    assert.equal(r.status, 501);
    process.env.CRON_SECRET = "cron-secret-123";
    r = await call("GET", "/api/cron/subs", null, null, { authorization: "Bearer wrong" });
    assert.equal(r.status, 401);

    subs._mem.set(uid, { plan: "basic", until: Date.now() + 2 * DAY, warned: 0, ended: 0, trial: false, trialUsed: false });
    r = await call("GET", "/api/cron/subs", null, null, { authorization: "Bearer cron-secret-123" });
    assert.equal(r.status, 200); assert.equal(r.json.warned, 1);
    assert.equal(sent[0][0], "anna@example.com"); assert.match(sent[0][2], /Anna/); assert.match(sent[0][2], /5 €/);
    r = await call("GET", "/api/cron/subs", null, null, { authorization: "Bearer cron-secret-123" });
    assert.equal(r.json.warned, 0); // only once

    subs._mem.set(uid, Object.assign(subs._mem.get(uid), { until: Date.now() - 1000 }));
    r = await call("GET", "/api/cron/subs", null, null, { authorization: "Bearer cron-secret-123" });
    assert.equal(r.json.ended, 1); assert.match(sent[1][1], /закончилась/);
    r = await call("GET", "/api/cron/subs", null, null, { authorization: "Bearer cron-secret-123" });
    assert.equal(r.json.ended, 0);

    subs._mem.set(uid, { plan: "ai", until: Date.now() - 1000, warned: 0, ended: 0, trial: true, trialUsed: true });
    r = await call("GET", "/api/cron/subs", null, null, { authorization: "Bearer cron-secret-123" });
    assert.equal(r.json.ended, 1); assert.match(sent[2][1], /Пробный период/); assert.match(sent[2][2], /10 €/);
  } finally {
    Object.assign(subs.mailer, old);
    delete process.env.CRON_SECRET;
  }
});
