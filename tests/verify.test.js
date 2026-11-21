process.env.OPENAI_API_KEY = "test-key-not-real";
process.env.VERIFY_CONTACT = "+49 000 0000000";
process.env.ADMIN_PASSWORD = "test-password";
process.env.ADMIN_SECRET = "test-secret";
delete process.env.AI_OPEN;
delete process.env.FIREBASE_SERVICE_ACCOUNT;
delete process.env.FIREBASE_SERVICE_ACCOUNT_B64;

const test = require("node:test");
const assert = require("node:assert/strict");
const ai = require("../api/_ai.js");
const verify = require("../api/_verify.js");
const admin = require("../api/_admin.js");

const body = JSON.stringify({ messages: [{ role: "user", content: "Hallo" }] });
const BEARER = "Bearer " + "x".repeat(40);
let spent = 0;
global.fetch = async () => { spent++; return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: "ok" } }] }) }; };
const stub = (uid, verified) => { verify._hooks.lookupUid = async () => uid; verify._hooks.isVerified = async () => verified; };

test("no login token: the AI is closed and no money is spent", async () => {
  const before = spent;
  const [code, out] = await ai.handle(body, "1.1.1.1", true, undefined);
  assert.equal(code, 403);
  assert.equal(out.code, "not_verified");
  assert.equal(out.contact, "+49 000 0000000");
  assert.equal(spent, before);
});

test("a forged or expired token is treated as not verified", async () => {
  stub(null, false);
  const [code, out] = await ai.handle(body, "1.1.1.2", true, BEARER);
  assert.equal(code, 403);
  assert.equal(out.code, "not_verified");
});

test("a logged-in but unverified student is refused", async () => {
  stub("uidUnverified1", false);
  const before = spent;
  const [code, out] = await ai.handle(body, "1.1.1.3", true, BEARER);
  assert.equal(code, 403);
  assert.equal(out.code, "not_verified");
  assert.equal(spent, before);
});

test("a verified student gets the answer", async () => {
  stub("uidVerified001", true);
  const before = spent;
  const [code, out] = await ai.handle(body, "1.1.1.4", true, BEARER);
  assert.equal(code, 200);
  assert.equal(out.text, "ok");
  assert.equal(spent, before + 1);
});

test("if the check itself fails, the AI stays closed (no free pass)", async () => {
  verify._hooks.lookupUid = async () => { throw Object.assign(new Error("down"), { status: 502, code: "verify_unavailable" }); };
  const before = spent;
  const [code, out] = await ai.handle(body, "1.1.1.5", true, BEARER);
  assert.equal(code, 502);
  assert.equal(out.code, "verify_unavailable");
  assert.equal(spent, before);
});

test("the teacher cabinet shows e-mail and verification per student", () => {
  const now = Date.now();
  const users = [
    { uid: "uidVerified001", updated: now, data: { cand: { fam: "Test", vor: "Anna", email: "Anna@Example.com" } } },
    { uid: "uidUnverified1", updated: now, data: { cand: { fam: "Test", vor: "Bob", email: "not-an-email" } } },
  ];
  const d = admin.dashboard(users, now, new Set(["uidVerified001"]));
  const a = d.students.find(s => s.uid === "uidVerified001"), b = d.students.find(s => s.uid === "uidUnverified1");
  assert.equal(a.verified, true);
  assert.equal(a.email, "anna@example.com");
  assert.equal(b.verified, false);
  assert.equal(b.email, "");
});

test("uids are validated before they reach Firestore paths", async () => {
  await assert.rejects(() => verify.setVerified("../users/other", true), { code: "bad_uid" });
  await assert.rejects(() => verify.setVerified("", true), { code: "bad_uid" });
});

test("/api/access: approved -> verified true, not approved -> false with the contact, no token -> false", async () => {
  stub("student-ok-1", true);
  let [code, out] = await verify.access(BEARER);
  assert.equal(code, 200); assert.equal(out.verified, true);
  stub("student-new-1", false);
  [code, out] = await verify.access(BEARER);
  assert.equal(code, 200); assert.equal(out.verified, false); assert.equal(out.contact, "+49 000 0000000");
  [code, out] = await verify.access(undefined);
  assert.equal(out.verified, false);
});
