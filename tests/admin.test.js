process.env.ADMIN_PASSWORD = "test-password";
process.env.ADMIN_SECRET = "test-secret";
delete process.env.FIREBASE_SERVICE_ACCOUNT;
delete process.env.FIREBASE_SERVICE_ACCOUNT_B64;

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const admin = require("../api/_admin.js");
const { makeUsers } = require("./fixtures.js");

test("partOf maps every task family to the right exam section", () => {
  assert.deepEqual(admin.partOf("L1V3"), { key: "L1", section: "lesen", label: "Lesen 1" });
  assert.deepEqual(admin.partOf("L2T1V4"), { key: "L2", section: "lesen", label: "Lesen 2" });
  assert.deepEqual(admin.partOf("BV2"), { key: "B", section: "lesen", label: "Lesen 19–20" });
  assert.deepEqual(admin.partOf("w-BV2"), { key: "BW", section: "schreiben", label: "Письмо · Beschwerde" });
  assert.equal(admin.partOf("S1V1").section, "schreiben");
  assert.equal(admin.partOf("H2V2a").section, "hoeren");
  assert.equal(admin.partOf("N4").section, "hoeren");
  assert.equal(admin.partOf("SP1-3").section, "sprechen");
  assert.equal(admin.partOf("w-SP1-3").section, "sprechen");
  assert.equal(admin.partOf("w-F12").section, "schreiben");
  assert.equal(admin.partOf("unknown-42").section, "other");
});

test("computeStudent derives names, percentages, mistakes and streaks", () => {
  const now = Date.parse("2026-10-21T12:00:00Z");
  const day = n => new Date(now - n * 86400000).toISOString().slice(0, 10);
  const user = {
    uid: "u1",
    updated: now,
    data: {
      cand: { fam: "Иванов", vor: "Иван", done: true },
      days: [day(2), day(1), day(0)],
      res: {
        L1V1: { best: 15, last: 12, max: 15, n: 2, ts: now - 3600000 },
        H1V1: { best: 6, last: 6, max: 10, n: 1, ts: now - 7200000 },
        "w-F3": { best: 18, last: 15, max: 20, n: 3, ts: now - 10800000 },
      },
      wrong: {
        "L1V1:4": { vid: "L1V1", sec: "l", n: 4, ts: now - 3600000 },
        "H1V1:2": { vid: "H1V1", sec: "h", n: 2, ts: now - 7200000 },
      },
      log: [
        { t: now - 3600000, vid: "L1V1", sc: 12, mx: 15 },
        { t: now - 7200000, vid: "H1V1", sc: 6, mx: 10 },
      ],
    },
  };
  const s = admin.computeStudent(user, now);
  assert.equal(s.name, "Иван Иванов");
  assert.equal(s.initials, "ИИ");
  assert.equal(s.days, 3);
  assert.equal(s.tasks, 3);
  assert.equal(s.attempts, 6);
  assert.equal(s.scorePct, 71.7); // (80 + 60 + 75) / 3
  assert.equal(s.bestPct, 83.3); // (100 + 60 + 90) / 3
  assert.equal(s.failures, 2);
  assert.equal(s.successTasks, 2);
  assert.equal(s.failTasks, 0);
  assert.equal(s.streak.current, 3);
  assert.equal(s.streak.longest, 3);
  assert.equal(s.sections.lesen.pct, 80);
  assert.equal(s.sections.hoeren.pct, 60);
  assert.equal(s.sections.schreiben.pct, 75);
  assert.equal(s.sections.sprechen.pct, null);
  assert.ok(s.achievements.find(a => a.id === "first").earned);
  assert.ok(s.achievements.find(a => a.id === "perfect").earned);
  assert.ok(s.weak.some(w => w.key === "L1" && w.count === 1));
});

test("dashboard aggregates totals, sections, activity and weak tasks", () => {
  const users = makeUsers(14);
  const d = admin.dashboard(users);
  assert.equal(d.totals.students, 14);
  assert.equal(d.students.length, 14);
  assert.ok(d.totals.tests > 0);
  assert.ok(d.totals.days > 0);
  assert.ok(d.totals.avgScore > 0 && d.totals.avgScore <= 100);
  assert.equal(d.sections.length, 4);
  assert.equal(d.activity.length, 30);
  assert.equal(d.distribution.length, 4);
  assert.ok(d.weak.length > 0);
  assert.ok(d.top.length > 0);
  assert.ok(d.students.every(s => s.uid && s.name));
  assert.ok(d.students.some(s => !s.hasName), "fixture includes one unnamed student");
});

test("session cookies round-trip, reject tampering and expiry", () => {
  const token = admin.createSession();
  assert.equal(admin.verifySession("dtb_admin=" + token), true);
  assert.equal(admin.verifySession("dtb_admin=" + token + "x"), false);
  assert.equal(admin.verifySession("dtb_admin=9999999999999.deadbeef"), false);
  assert.equal(admin.verifySession(""), false);
  const expired = admin.createSession(Date.now() - admin.SESSION_MS - 1000);
  assert.equal(admin.verifySession("dtb_admin=" + expired), false);
  assert.deepEqual(admin.parseCookies("a=1; dtb_admin=xyz; b=2"), { a: "1", dtb_admin: "xyz", b: "2" });
});

test("password check uses the configured ADMIN_PASSWORD", () => {
  assert.equal(admin.passwordMatches("test-password"), true);
  assert.equal(admin.passwordMatches("wrong"), false);
  assert.equal(admin.passwordMatches(""), false);
});

test("loadUsers signs a service-account JWT and parses Firestore documents", async () => {
  const { privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({
    type: "service_account", project_id: "test-project", private_key: privateKey,
    client_email: "admin@test-project.iam.gserviceaccount.com", token_uri: "https://oauth2.googleapis.com/token",
  });
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, opt) => {
    const u = String(url);
    calls.push(u);
    if (u.includes("oauth2.googleapis.com/token")) {
      const assertion = new URLSearchParams(String(opt.body)).get("assertion");
      assert.equal(String(assertion).split(".").length, 3, "JWT has three parts");
      return { ok: true, status: 200, json: async () => ({ access_token: "test-token", expires_in: 3600 }) };
    }
    if (u.includes("firestore.googleapis.com")) {
      assert.equal(opt.headers.authorization, "Bearer test-token");
      return {
        ok: true, status: 200,
        json: async () => ({
          documents: [{
            name: "projects/test-project/databases/(default)/documents/users/u1",
            fields: {
              data: { stringValue: JSON.stringify({ cand: { fam: "Иванов", vor: "Иван" }, days: ["2026-10-20"], res: { L1V1: { best: 10, last: 10, max: 10, n: 1, ts: Date.now() } } }) },
              updated: { integerValue: "1760000000000" },
            },
          }],
        }),
      };
    }
    throw new Error("unexpected fetch " + u);
  };
  try {
    const out = await admin.loadUsers();
    assert.equal(out.source, "firestore");
    assert.equal(out.users.length, 1);
    assert.equal(out.users[0].uid, "u1");
    assert.equal(out.users[0].data.cand.fam, "Иванов");
    const d = admin.dashboard(out.users);
    assert.equal(d.students[0].name, "Иван Иванов");
    assert.ok(calls.some(u => u.includes("projects/test-project")));
  } finally {
    global.fetch = originalFetch;
    delete process.env.FIREBASE_SERVICE_ACCOUNT;
  }
});

test("service-account parser tolerates literal \\n and an extra JSON-string wrapper", () => {
  const sa = {
    type: "service_account",
    project_id: "prufung-6e9b1",
    private_key: "-----BEGIN PRIVATE KEY-----\nABC\nDEF\n-----END PRIVATE KEY-----\n",
    client_email: "firebase-adminsdk@example.iam.gserviceaccount.com",
  };
  const pretty = JSON.stringify(sa, null, 2);
  const broken = pretty.replace(/\n/g, "\\n");
  const a = admin.parseServiceAccount(broken);
  assert.equal(a.project_id, "prufung-6e9b1");
  assert.ok(a.private_key.includes("\n"));

  const quoted = JSON.stringify(pretty);
  const b = admin.parseServiceAccount(quoted);
  assert.equal(b.client_email, sa.client_email);
  assert.ok(b.private_key.includes("\n"));
});
