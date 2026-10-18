/* ---------- progress sync (Firebase): e-mail link sign-in, one Firestore document per user ----------
   Only learning progress is synced; the candidate form (name, birth date, address) never leaves the device.
   The Firebase SDK is loaded lazily, only for people who turned sync on. */
const FB_CONFIG = {
  apiKey: "AIzaSyA5_PmCPlHg-9P1OD9LQFHXXF4Svj6Vajo",
  authDomain: "prufung-6e9b1.firebaseapp.com",
  projectId: "prufung-6e9b1",
  storageBucket: "prufung-6e9b1.firebasestorage.app",
  messagingSenderId: "562645935710",
  appId: "1:562645935710:web:319af5ce62968b905936cf",
};
const FB_V = "10.14.1";
const SYNC_KEYS = ["res", "wrong", "nstat", "days", "drafts", "feedback", "mode", "paper", "voice", "spVoice", "lang"];
const SYNC = { fb: null, user: null, state: "off", last: 0, err: "", timer: null };
const rawGet = (k) => { try { const v = localStorage.getItem("dtb." + k); return v == null ? null : JSON.parse(v); } catch { return null; } };
const rawSet = (k, v) => { try { localStorage.setItem("dtb." + k, JSON.stringify(v)); } catch {} };

// every local change of a synced key gets a timestamp, so the newer side wins when two devices meet
STORE_HOOKS.push((k) => {
  if (!SYNC_KEYS.includes(k)) return;
  const mt = rawGet("_mt") || {}; mt[k] = Date.now(); rawSet("_mt", mt);
  if (SYNC.user) { clearTimeout(SYNC.timer); SYNC.timer = setTimeout(pushNow, 2500); }
});

async function fbLoad() {
  if (SYNC.fb) return SYNC.fb;
  const base = `https://www.gstatic.com/firebasejs/${FB_V}/`;
  const [app, auth, fs] = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-auth.js"), import(base + "firebase-firestore.js")]);
  const a = app.initializeApp(FB_CONFIG);
  SYNC.fb = { auth: auth.getAuth(a), db: fs.getFirestore(a), A: auth, F: fs };
  return SYNC.fb;
}

function mergeIn(cloud) {
  const mt = rawGet("_mt") || {};
  const cd = (cloud && cloud.data) || {}, cm = (cloud && cloud.mt) || {};
  let changed = false;
  for (const k of SYNC_KEYS) {
    if (cd[k] == null) continue;
    let cv; try { cv = JSON.parse(cd[k]); } catch { continue; }
    const lv = rawGet(k);
    let nv;
    if (k === "days") nv = [...new Set([...(lv || []), ...(cv || [])])].sort().slice(-400);
    else if (k === "res") {
      nv = { ...(lv || {}) };
      for (const [id, c] of Object.entries(cv || {})) {
        const l = nv[id];
        if (!l || (c.ts || 0) > (l.ts || 0)) nv[id] = { ...c, best: Math.max(c.best || 0, (l && l.best) || 0) };
        else nv[id] = { ...l, best: Math.max(c.best || 0, l.best || 0) };
      }
    } else nv = (cm[k] || 0) > (mt[k] || 0) ? cv : lv;
    if (JSON.stringify(nv) !== JSON.stringify(lv)) { rawSet(k, nv); changed = true; }
    mt[k] = Math.max(mt[k] || 0, cm[k] || 0);
  }
  rawSet("_mt", mt);
  return changed;
}
function snapshot() {
  const data = {}, mt = rawGet("_mt") || {};
  for (const k of SYNC_KEYS) { const v = rawGet(k); if (v != null) data[k] = JSON.stringify(v); }
  return { v: 1, data, mt };
}
async function pullNow() {
  if (!SYNC.user) return false;
  const { db, F } = SYNC.fb;
  const snap = await F.getDoc(F.doc(db, "progress", SYNC.user.uid));
  return snap.exists() ? mergeIn(snap.data()) : false;
}
async function pushNow() {
  if (!SYNC.user) return;
  clearTimeout(SYNC.timer);
  try {
    const { db, F } = SYNC.fb;
    await F.setDoc(F.doc(db, "progress", SYNC.user.uid), { ...snapshot(), updated: F.serverTimestamp() });
    SYNC.last = Date.now(); SYNC.err = ""; SYNC.state = "on";
  } catch (e) { SYNC.err = syncErr(e); SYNC.state = "error"; }
  paintSync();
}
async function syncNow(rerender) {
  if (!SYNC.user) return;
  SYNC.state = "busy"; paintSync();
  try { const changed = await pullNow(); await pushNow(); if (changed && rerender) render(); }
  catch (e) { SYNC.err = syncErr(e); SYNC.state = "error"; paintSync(); }
}
function syncErr(e) {
  const c = (e && e.code) || "";
  if (c === "auth/operation-not-allowed") return "Вход по ссылке не включён в Firebase (Authentication → Sign-in method → Email link).";
  if (c === "auth/unauthorized-continue-uri" || c === "auth/unauthorized-domain") return "Этот адрес сайта не добавлен в Firebase (Authentication → Settings → Authorized domains).";
  if (c === "permission-denied" || c === "failed-precondition" || c === "not-found") return "База Firestore ещё не создана или правила доступа не опубликованы.";
  if (c === "auth/invalid-action-code" || c === "auth/expired-action-code") return "Ссылка для входа устарела или уже использована. Запросите новую.";
  if (c === "auth/invalid-email") return "Введите e-mail.";
  return "Не удалось синхронизировать. Проверьте интернет и попробуйте ещё раз.";
}

async function sendLink(email) {
  const { auth, A } = await fbLoad();
  await A.sendSignInLinkToEmail(auth, email, { url: location.origin + location.pathname + "#profile", handleCodeInApp: true });
  rawSet("syncEmail", email);
}
async function signOutSync() {
  if (SYNC.fb) await SYNC.fb.A.signOut(SYNC.fb.auth);
  SYNC.user = null; SYNC.state = "off"; rawSet("syncOn", false); paintSync(); updateWho();
}
// start: finish an e-mail link sign-in, or restore the session of someone who turned sync on before
async function initSync() {
  const fromLink = /[?&]oobCode=/.test(location.search) && /mode=signIn/.test(location.search);
  if (!fromLink && !rawGet("syncOn")) return;
  try {
    const { auth, A } = await fbLoad();
    if (fromLink && A.isSignInWithEmailLink(auth, location.href)) {
      let email = rawGet("syncEmail");
      if (!email) email = window.prompt(trText("Подтвердите e-mail, на который пришла ссылка:", curLang())) || "";
      await A.signInWithEmailLink(auth, email.trim(), location.href);
      history.replaceState(null, "", location.pathname + (location.hash || "#profile"));
    }
    A.onAuthStateChanged(auth, async (u) => {
      SYNC.user = u || null;
      if (u) { rawSet("syncOn", true); rawSet("syncEmail", u.email || rawGet("syncEmail")); await syncNow(true); }
      else { SYNC.state = "off"; paintSync(); }
      updateWho();
    });
  } catch (e) { SYNC.err = syncErr(e); SYNC.state = "error"; paintSync(); }
}
document.addEventListener("visibilitychange", () => { if (!SYNC.user) return; if (document.hidden) pushNow(); else syncNow(true); });

/* ---------- progress as a file: export / import, works without any account ---------- */
function exportProgress() {
  const blob = new Blob([JSON.stringify({ app: "dtb-b2-trainer", v: 1, at: new Date().toISOString(), ...snapshot() }, null, 1)], { type: "application/json" });
  const a = h("a", { href: URL.createObjectURL(blob), download: `dtb-b2-fortschritt-${today()}.json` });
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function importProgress(file, out) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (d.app !== "dtb-b2-trainer" || !d.data) throw 0;
      mergeIn(d); if (SYNC.user) pushNow();
      render();
    } catch { out.textContent = trText("Файл не подходит.", curLang()); }
  };
  r.readAsText(file);
}

/* ---------- UI: card on the candidate page ---------- */
const syncEls = new Set();
function paintSync() { syncEls.forEach(f => { if (!f.el.isConnected) syncEls.delete(f); else f(); }); }
function syncCard() {
  const box = h("div", { class: "card stack sync" });
  const msg = h("p", { class: "small", style: "margin:0" });
  const fileMsg = h("p", { class: "small muted", style: "margin:0" });
  const file = h("input", { type: "file", accept: "application/json,.json", hidden: true, onchange: () => file.files[0] && importProgress(file.files[0], fileMsg) });
  const paint = () => {
    const kids = [h("h2", null, "Синхронизация прогресса")];
    if (SYNC.user) {
      kids.push(h("p", { style: "margin:0" }, h("span", null, "Синхронизация включена:"), " ", h("b", null, SYNC.user.email || "")),
        h("p", { class: "small muted", style: "margin:0" }, h("span", null, "Последняя синхронизация:"), " ", SYNC.last ? new Date(SYNC.last).toLocaleTimeString() : "…"),
        h("div", { class: "row" }, h("button", { class: "btn", disabled: SYNC.state === "busy", onclick: () => syncNow(true) }, "Синхронизировать сейчас"), h("button", { class: "btn ghost", onclick: signOutSync }, "Выйти")));
    } else {
      const email = h("input", { class: "in", type: "email", placeholder: "name@example.com", value: rawGet("syncEmail") || "", autocomplete: "email", style: "max-width:320px" });
      const send = h("button", { class: "btn primary" }, "Отправить ссылку для входа");
      send.onclick = async () => {
        const v = email.value.trim(); if (!/.+@.+\..+/.test(v)) { msg.textContent = trText("Введите e-mail.", curLang()); return; }
        send.disabled = true;
        try { await sendLink(v); msg.textContent = trText("Ссылка отправлена. Откройте письмо на этом устройстве и нажмите на ссылку.", curLang()); }
        catch (e) { msg.textContent = trText(syncErr(e), curLang()); }
        send.disabled = false;
      };
      kids.push(h("p", { class: "small", style: "margin:0" }, "Войдите по e-mail, чтобы прогресс (результаты, ошибки, черновики) был одинаковым на телефоне и компьютере. Анкета с именем и адресом остаётся только на этом устройстве."),
        h("div", { class: "row" }, email, send));
    }
    if (SYNC.err) msg.textContent = trText(SYNC.err, curLang());
    kids.push(msg, h("div", { class: "row" }, h("button", { class: "btn", onclick: exportProgress }, "Скачать прогресс (файл)"), h("button", { class: "btn", onclick: () => file.click() }, "Загрузить из файла"), file), fileMsg);
    box.replaceChildren(...kids);
  };
  paint.el = box; syncEls.add(paint); paint();
  return box;
}
