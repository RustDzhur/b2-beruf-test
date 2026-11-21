// Removing strangers and the approved-only leaderboard, on local fixtures (no Firebase).
const fs = require("fs"), os = require("os"), path = require("path");
const { makeUsers } = require("./fixtures.js");
const file = path.join(os.tmpdir(), "dtb-delete-fixture-" + process.pid + ".json");
fs.writeFileSync(file, JSON.stringify(makeUsers()));
process.env.ADMIN_FIXTURES = file;
delete process.env.VERCEL; delete process.env.AI_OPEN;
delete process.env.FIREBASE_SERVICE_ACCOUNT; delete process.env.FIREBASE_SERVICE_ACCOUNT_B64;

const test = require("node:test");
const assert = require("node:assert/strict");
const admin = require("../api/_admin.js");
const verify = require("../api/_verify.js");

test("leaderboard shows only students the teacher approved", async () => {
  const { users } = await admin.loadUsers();
  let lb = await admin.buildLeaderboard("all", "", Date.now() + 61000);
  assert.equal(lb.participants, 0);
  const named = users.filter(u => u.data && u.data.cand && u.data.cand.vor);
  await verify.setVerified(named[0].uid, true);
  lb = await admin.buildLeaderboard("all", named[0].uid, Date.now() + 122000);
  assert.ok(lb.participants <= 1);
  lb.entries.forEach(e => assert.equal(e.isMe, true));
});

test("deleteUsers returns a backup and removes the students", async () => {
  const { users } = await admin.loadUsers();
  const pick = users.slice(0, 2).map(u => u.uid);
  const out = await admin.deleteUsers(pick);
  assert.deepEqual(out.deleted.sort(), pick.slice().sort());
  assert.equal(out.backup.length, 2);
  const after = (await admin.loadUsers()).users.map(u => u.uid);
  pick.forEach(u => assert.ok(!after.includes(u)));
  await assert.rejects(() => admin.deleteUsers([]), e => e.code === "bad_uid");
  fs.rmSync(file, { force: true });
});
