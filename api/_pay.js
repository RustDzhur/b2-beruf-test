// PayPal Checkout (Orders API v2). The student pays 5 € (trainer) or 10 € (trainer + AI) from the site; the server
// creates the order with a fixed price, captures it, checks status, amount and EUR itself, and only then admits the
// student and starts a paid month (see _subs.js). Each capture is recorded once in Firestore `payments/{captureId}`,
// so a repeated capture call or a repeated webhook never adds a second month.
// Vercel settings: PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_ENV ("live"; anything else = sandbox),
// PAYPAL_WEBHOOK_ID (optional, for /api/pay/webhook), PAYPAL_ME (optional fallback link name, e.g. "YourName").
const admin = require("./_admin.js");
const subs = require("./_subs.js");

const PLANS = { basic: "5.00", ai: "10.00" };
const UID_RE = /^[A-Za-z0-9_-]{6,128}$/;
const fail = (status, code, message) => Object.assign(new Error(message), { status, code });
const memPaid = new Map(); // local preview / tests
const useMem = () => { try { return !admin.serviceAccount() && !!admin.fixtureUsers(); } catch { return false; } };

const ready = () => !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_SECRET;
const apiBase = () => process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
const meName = () => String(process.env.PAYPAL_ME || "").replace(/^.*paypal\.me\//i, "").replace(/[^A-Za-z0-9_.-]/g, "").slice(0, 60);

// public settings for the page (the Client ID is public by design; the secret never leaves the server)
function config() {
  return { enabled: ready(), clientId: ready() ? process.env.PAYPAL_CLIENT_ID : "", env: process.env.PAYPAL_ENV === "live" ? "live" : "sandbox",
    me: meName() ? "https://paypal.me/" + meName() : "", prices: { basic: 5, ai: 10 } };
}

// tests replace `pp.call`
let token = null;
const pp = {
  async call(method, path, body) {
    if (!ready()) throw fail(501, "paypal_off", "PayPal не настроен.");
    if (!token || token.exp < Date.now()) {
      let r;
      try {
        r = await fetch(apiBase() + "/v1/oauth2/token", { method: "POST",
          headers: { authorization: "Basic " + Buffer.from(process.env.PAYPAL_CLIENT_ID + ":" + process.env.PAYPAL_SECRET).toString("base64"), "content-type": "application/x-www-form-urlencoded" },
          body: "grant_type=client_credentials" });
      } catch { throw fail(502, "paypal_unreachable", "Нет связи с PayPal."); }
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.access_token) throw fail(502, "paypal_auth", "PayPal: ключи не подошли.");
      token = { v: j.access_token, exp: Date.now() + Math.max(60, (j.expires_in || 300) - 60) * 1000 };
    }
    let r;
    try {
      r = await fetch(apiBase() + path, { method, headers: { authorization: "Bearer " + token.v, "content-type": "application/json", prefer: "return=representation" },
        body: body ? JSON.stringify(body) : undefined });
    } catch { throw fail(502, "paypal_unreachable", "Нет связи с PayPal."); }
    const j = await r.json().catch(() => ({}));
    return { status: r.status, ok: r.ok, json: j };
  },
};

async function createOrder(uid, plan) {
  if (!UID_RE.test(String(uid || ""))) throw fail(401, "unauthorized", "Войдите в аккаунт.");
  plan = plan === "ai" ? "ai" : "basic";
  const r = await pp.call("POST", "/v2/checkout/orders", {
    intent: "CAPTURE",
    purchase_units: [{ custom_id: uid + "|" + plan, description: plan === "ai" ? "DTB B2 Beruf: Trainer + KI, 1 Monat" : "DTB B2 Beruf: Trainer, 1 Monat",
      amount: { currency_code: "EUR", value: PLANS[plan] } }],
    application_context: { shipping_preference: "NO_SHIPPING", brand_name: "DTB B2 Beruf" },
  });
  if (!r.ok || !r.json.id) throw fail(502, "paypal_order", "PayPal: заказ не создан.");
  return { id: r.json.id };
}

// a completed capture -> {captureId, uid, plan, amount, currency} or null when anything does not match
function checkCapture(cap, customId) {
  if (!cap || cap.status !== "COMPLETED") return null;
  const m = /^([A-Za-z0-9_-]{6,128})\|(basic|ai)$/.exec(String(customId || cap.custom_id || ""));
  if (!m) return null;
  const amount = cap.amount || {};
  if (amount.currency_code !== "EUR" || Number(amount.value) !== Number(PLANS[m[2]])) return null; // the price is checked here, never trusted from the page
  return { captureId: String(cap.id || ""), uid: m[1], plan: m[2], amount: String(amount.value), currency: "EUR" };
}

// record the capture once; false if it was already used
async function remember(p, order) {
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(p.captureId)) return false;
  if (useMem()) { if (memPaid.has(p.captureId)) return false; memPaid.set(p.captureId, Object.assign({ order }, p)); return true; }
  const sa = admin.serviceAccount();
  if (!sa) throw fail(501, "no_service_account", "Не настроен ключ Firebase.");
  const url = "https://firestore.googleapis.com/v1/projects/" + encodeURIComponent(sa.project_id) + "/databases/(default)/documents/payments?documentId=" + encodeURIComponent(p.captureId);
  let r;
  try {
    r = await fetch(url, { method: "POST", headers: { authorization: "Bearer " + await admin.accessToken(), "content-type": "application/json" },
      body: JSON.stringify({ fields: { uid: { stringValue: p.uid }, plan: { stringValue: p.plan }, amount: { stringValue: p.amount },
        currency: { stringValue: p.currency }, order: { stringValue: String(order || "") }, at: { integerValue: String(Date.now()) } } }) });
  } catch { throw fail(502, "firestore_unreachable", "Нет связи с Firestore."); }
  if (r.status === 409) return false; // ALREADY_EXISTS: this payment was counted before
  if (!r.ok) throw fail(502, "firestore_failed", "Firestore: HTTP " + r.status);
  return true;
}

// the payment is real and new: admit, open or close the AI by the plan, one more month
async function grant(p, order) {
  if (!(await remember(p, order))) return { ok: true, duplicate: true, sub: await subs.get(p.uid) };
  const sub = await subs.extend(p.uid, p.plan);
  await require("./_admit.js").setAdmitted(p.uid, true);
  await require("./_verify.js").setVerified(p.uid, p.plan === "ai");
  return { ok: true, sub, plan: p.plan };
}

// the page calls this after the student approved the payment in the PayPal window
async function captureOrder(uid, orderId) {
  if (!UID_RE.test(String(uid || ""))) throw fail(401, "unauthorized", "Войдите в аккаунт.");
  orderId = String(orderId || "");
  if (!/^[A-Za-z0-9-]{6,64}$/.test(orderId)) throw fail(400, "bad_order", "Некорректный заказ.");
  let r = await pp.call("POST", "/v2/checkout/orders/" + orderId + "/capture", {});
  if (!r.ok && r.status === 422) r = await pp.call("GET", "/v2/checkout/orders/" + orderId); // already captured: read it
  const unit = (r.json.purchase_units || [])[0] || {};
  const cap = ((unit.payments || {}).captures || [])[0];
  const p = checkCapture(cap, unit.custom_id);
  if (!p) throw fail(402, "not_paid", "Оплата не подтверждена.");
  if (p.uid !== uid) throw fail(403, "forbidden", "Этот платёж сделан с другого аккаунта.");
  return grant(p, orderId);
}

// PayPal webhook PAYMENT.CAPTURE.COMPLETED: the same grant, for the case the page was closed right after paying.
// The signature is checked by PayPal itself (verify-webhook-signature) with PAYPAL_WEBHOOK_ID.
async function webhook(headers, raw) {
  if (!process.env.PAYPAL_WEBHOOK_ID) throw fail(501, "no_webhook_id", "PAYPAL_WEBHOOK_ID is not set.");
  let event;
  try { event = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { throw fail(400, "bad_json", "bad json"); }
  if (!event || typeof event !== "object") throw fail(400, "bad_json", "bad json");
  const h = k => String(headers[k] || "");
  const v = await pp.call("POST", "/v1/notifications/verify-webhook-signature", {
    auth_algo: h("paypal-auth-algo"), cert_url: h("paypal-cert-url"), transmission_id: h("paypal-transmission-id"),
    transmission_sig: h("paypal-transmission-sig"), transmission_time: h("paypal-transmission-time"),
    webhook_id: process.env.PAYPAL_WEBHOOK_ID, webhook_event: event });
  if (!v.ok || v.json.verification_status !== "SUCCESS") throw fail(401, "bad_signature", "bad signature");
  if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") return { ok: true, ignored: true };
  const cap = event.resource || {};
  const p = checkCapture(cap, cap.custom_id);
  if (!p) return { ok: true, ignored: true };
  const order = ((cap.supplementary_data || {}).related_ids || {}).order_id || "";
  return grant(p, order);
}

module.exports = { PLANS, config, ready, createOrder, captureOrder, webhook, checkCapture, pp, _memPaid: memPaid };
