// PayPal: fixed prices, the server checks status, amount, EUR and the account; each capture counts once.
const fs = require("fs"), os = require("os"), path = require("path");
const { makeUsers } = require("./fixtures.js");
const file = path.join(os.tmpdir(), "dtb-pay-fixture-" + process.pid + ".json");
const users = makeUsers();
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
const pay = require("../api/_pay.js");

const BEARER = { authorization: "Bearer " + "t".repeat(40) };
const call = (method, p, body, extra) => router.handle({ method, path: p, body: body ? JSON.stringify(body) : "",
  headers: Object.assign({ host: "x", "x-url": p }, extra || {}), ip: "1.2.5.1" });
const captured = (uid, plan, value, currency = "EUR", id = "CAP12345678") => ({ status: 200, ok: true, json: { id: "ORDER123", status: "COMPLETED",
  purchase_units: [{ custom_id: uid + "|" + plan, payments: { captures: [{ id, status: "COMPLETED", amount: { currency_code: currency, value } }] } }] } });

test("config: off without keys, the paypal.me fallback link when set", async () => {
  delete process.env.PAYPAL_CLIENT_ID; delete process.env.PAYPAL_SECRET;
  process.env.PAYPAL_ME = "paypal.me/SomeName";
  const r = await call("GET", "/api/pay/config");
  assert.equal(r.json.enabled, false); assert.equal(r.json.clientId, ""); assert.equal(r.json.me, "https://paypal.me/SomeName");
  delete process.env.PAYPAL_ME;
});

test("create: fixed price per plan, only for a signed-in account", async () => {
  const uid = users[0].uid;
  const seen = [];
  pay.pp.call = async (m, p, body) => { seen.push(body); return { status: 201, ok: true, json: { id: "ORDER123" } }; };
  verify._hooks.lookupUid = async () => null;
  let r = await call("POST", "/api/pay/create", { plan: "ai" });
  assert.equal(r.status, 401);
  verify._hooks.lookupUid = async () => uid;
  r = await call("POST", "/api/pay/create", { plan: "ai", value: "0.01" }, BEARER);
  assert.equal(r.status, 200); assert.equal(r.json.id, "ORDER123");
  const unit = seen.pop().purchase_units[0];
  assert.deepEqual(unit.amount, { currency_code: "EUR", value: "10.00" }); assert.equal(unit.custom_id, uid + "|ai");
});

test("capture: wrong amount, currency or account gives nothing; a real payment opens access once", async () => {
  const uid = users[2].uid;
  verify._hooks.lookupUid = async () => uid;
  subs._mem.clear(); pay._memPaid.clear();

  pay.pp.call = async () => captured(uid, "ai", "5.00"); // paid 5 € but asks for the AI plan
  let r = await call("POST", "/api/pay/capture", { orderId: "ORDER123" }, BEARER);
  assert.equal(r.status, 402); assert.equal(await subs.get(uid), null);

  pay.pp.call = async () => captured(uid, "basic", "5.00", "USD");
  r = await call("POST", "/api/pay/capture", { orderId: "ORDER123" }, BEARER);
  assert.equal(r.status, 402);

  pay.pp.call = async () => captured(users[3].uid, "basic", "5.00");
  r = await call("POST", "/api/pay/capture", { orderId: "ORDER123" }, BEARER);
  assert.equal(r.status, 403);

  pay.pp.call = async () => captured(uid, "ai", "10.00");
  r = await call("POST", "/api/pay/capture", { orderId: "ORDER123" }, BEARER);
  assert.equal(r.status, 200); assert.equal(r.json.sub.plan, "ai");
  const until = (await subs.get(uid)).until;
  assert.ok(until > Date.now() + 27 * subs.DAY);
  assert.equal(await verify.isVerified(uid), true); // the AI is open

  r = await call("POST", "/api/pay/capture", { orderId: "ORDER123" }, BEARER); // the same payment again
  assert.equal(r.json.duplicate, true); assert.equal((await subs.get(uid)).until, until);

  pay.pp.call = async () => captured(uid, "ai", "10.00", "EUR", "CAP99999999"); // a second real payment: one more month
  r = await call("POST", "/api/pay/capture", { orderId: "ORDER124" }, BEARER);
  assert.ok((await subs.get(uid)).until > until);
});

test("webhook: needs PAYPAL_WEBHOOK_ID and a signature PayPal confirms; repeated events count once", async () => {
  const uid = users[4].uid;
  subs._mem.clear(); pay._memPaid.clear();
  const event = { event_type: "PAYMENT.CAPTURE.COMPLETED", resource: { id: "CAPWEBHOOK1", status: "COMPLETED", custom_id: uid + "|basic",
    amount: { currency_code: "EUR", value: "5.00" }, supplementary_data: { related_ids: { order_id: "ORDERW1" } } } };
  delete process.env.PAYPAL_WEBHOOK_ID;
  let r = await call("POST", "/api/pay/webhook", event);
  assert.equal(r.status, 501);
  process.env.PAYPAL_WEBHOOK_ID = "WH-TEST";
  pay.pp.call = async () => ({ status: 200, ok: true, json: { verification_status: "FAILURE" } });
  r = await call("POST", "/api/pay/webhook", event);
  assert.equal(r.status, 401); assert.equal(await subs.get(uid), null);
  pay.pp.call = async () => ({ status: 200, ok: true, json: { verification_status: "SUCCESS" } });
  r = await call("POST", "/api/pay/webhook", event);
  assert.equal(r.status, 200); assert.equal(r.json.sub.plan, "basic");
  r = await call("POST", "/api/pay/webhook", event);
  assert.equal(r.json.duplicate, true);
  delete process.env.PAYPAL_WEBHOOK_ID;
});
