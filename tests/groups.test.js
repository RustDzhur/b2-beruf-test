// Groups: organizer request -> main teacher approves -> organizer cabinet sees only the own group.
const fs = require("fs"), os = require("os"), path = require("path");
const { makeUsers } = require("./fixtures.js");
const file = path.join(os.tmpdir(), "dtb-groups-fixture-" + process.pid + ".json");
const users = makeUsers();
fs.writeFileSync(file, JSON.stringify(users));
process.env.ADMIN_FIXTURES = file;
process.env.ADMIN_PASSWORD = "main-teacher-pw";
process.env.ADMIN_SECRET = "test-secret";
delete process.env.VERCEL; delete process.env.AI_OPEN;
delete process.env.FIREBASE_SERVICE_ACCOUNT; delete process.env.FIREBASE_SERVICE_ACCOUNT_B64;

const test = require("node:test");
const assert = require("node:assert/strict");
const admin = require("../api/_admin.js");
const verify = require("../api/_verify.js");
const router = require("../api/_router.js");

const call = (method, p, body, cookie, extra) => router.handle({ method, path: p.split("?")[0], body: body ? JSON.stringify(body) : "",
  headers: Object.assign({ host: "x", "x-url": p }, cookie ? { cookie } : {}, extra || {}), ip: "1.2.3." + Math.floor(Math.random() * 200) });
const cookieOf = r => String(r.headers["Set-Cookie"] || "").split(";")[0];

test("organizer asks for a group, the main teacher approves it, the organizer sees only the own students", async () => {
  const orgUid = users[0].uid;
  verify._hooks.lookupUid = async () => orgUid;
  let r = await call("POST", "/api/group-request", { name: "Berlin Oktober", email: "org@example.com" }, null, { authorization: "Bearer " + "t".repeat(40) });
  assert.equal(r.status, 200);
  const code = r.json.group.code;
  assert.equal(r.json.group.status, "pending");

  // not yet visible in the sign-up list, organizer cannot sign in yet
  r = await call("GET", "/api/groups");
  assert.ok(!r.json.groups.some(g => g.code === code));
  admin.orgAuth.uid = async () => orgUid;
  r = await call("POST", "/api/admin/login", { email: "org@example.com", password: "secret1" });
  assert.equal(r.status, 403); assert.equal(r.json.code, "group_pending");

  // main teacher approves
  r = await call("POST", "/api/admin/login", { password: "main-teacher-pw" });
  assert.equal(r.json.role, "super");
  const superCookie = cookieOf(r);
  r = await call("POST", "/api/admin/groups", { code, status: "ok" }, superCookie);
  assert.equal(r.status, 200);
  r = await call("GET", "/api/groups");
  assert.ok(r.json.groups.some(g => g.code === code && g.name === "Berlin Oktober"));

  // two students join the new group
  users[1].data.cand.group = code; users[2].data.cand.group = code;
  fs.writeFileSync(file, JSON.stringify(users));

  r = await call("POST", "/api/admin/login", { email: "org@example.com", password: "secret1" });
  assert.equal(r.status, 200); assert.equal(r.json.role, code);
  const orgCookie = cookieOf(r);
  r = await call("GET", "/api/admin/dashboard", null, orgCookie);
  assert.deepEqual(r.json.students.map(s => s.uid).sort(), [users[1].uid, users[2].uid].sort());
  assert.equal(r.json.groups.length, 1);

  // the organizer cannot touch students of another group, nor manage groups
  r = await call("POST", "/api/admin/verify", { uid: users[5].uid, verified: true }, orgCookie);
  assert.equal(r.status, 403);
  r = await call("POST", "/api/admin/delete", { uids: [users[5].uid] }, orgCookie);
  assert.equal(r.status, 403);
  r = await call("POST", "/api/admin/groups", { code, status: "pending" }, orgCookie);
  assert.equal(r.status, 403);
  r = await call("POST", "/api/admin/admit", { uid: users[1].uid, admitted: true }, orgCookie);
  assert.equal(r.status, 200);

  // the main teacher still sees everybody, or one group on request
  r = await call("GET", "/api/admin/dashboard", null, superCookie);
  assert.equal(r.json.students.length, users.length);
  r = await call("GET", "/api/admin/dashboard?group=" + code, null, superCookie);
  assert.equal(r.json.students.length, 2);

  // leaderboards are per group
  const lbNew = await admin.buildLeaderboard("all", users[1].uid, Date.now() + 61000);
  const lbMain = await admin.buildLeaderboard("all", users[6].uid, Date.now() + 61000);
  assert.ok(lbNew.participants <= 2);
  assert.ok(lbMain.participants > 2);
  fs.rmSync(file, { force: true });
});

test("a forged group cookie is rejected", () => {
  const good = admin.createSession(Date.now(), "ABC123");
  assert.equal(admin.sessionRole("dtb_admin=" + good), "ABC123");
  assert.equal(admin.sessionRole("dtb_admin=" + good.replace("ABC123", "MAIN")), null);
  assert.equal(admin.sessionRole("dtb_admin=" + admin.createSession()), "super");
});
