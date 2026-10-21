// Deterministic test/demo fixture for the teacher cabinet. Never loaded by the app or by production.
// Usage: node tests/fixtures.js /tmp/dtb-admin-fixture.json
const fs = require("fs");

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = [
  ["Ковалёва", "Анна"], ["Йылдыз", "Мурат"], ["Шмидт", "Елена"], ["Соколов", "Дмитрий"],
  ["Хасанова", "Айгуль"], ["Вебер", "Томас"], ["Петрова", "Ирина"], ["Кузнецов", "Олег"],
  ["Дзагоева", "Мария"], ["Джураев", "Рустам"], ["Шнайдер", "Лаура"], ["Иванов", "Сергей"],
  ["Морозова", "Наталья"], ["", ""],
];

const L1 = Array.from({ length: 7 }, (_, i) => "L1V" + (i + 1));
const L2 = Array.from({ length: 10 }, (_, i) => "L2T1V" + (i + 1));
const L3 = Array.from({ length: 7 }, (_, i) => "L3V" + (i + 1));
const L4 = Array.from({ length: 7 }, (_, i) => "L4V" + (i + 1));
const B = Array.from({ length: 10 }, (_, i) => "BV" + (i + 1));
const S1 = Array.from({ length: 7 }, (_, i) => "S1V" + (i + 1));
const S2 = Array.from({ length: 7 }, (_, i) => "S2V" + (i + 1));
const H1 = Array.from({ length: 7 }, (_, i) => "H1V" + (i + 1));
const H2 = Array.from({ length: 6 }, (_, i) => "H2V" + (i + 1));
const H3 = Array.from({ length: 7 }, (_, i) => "H3V" + (i + 1));
const H4 = Array.from({ length: 6 }, (_, i) => "H4V" + (i + 1));
const N = Array.from({ length: 12 }, (_, i) => "N" + (i + 1));
const SP1 = Array.from({ length: 8 }, (_, i) => "SP1-" + (i + 1));
const SP2 = Array.from({ length: 10 }, (_, i) => "SP2-" + (i + 1));
const SP3 = Array.from({ length: 12 }, (_, i) => "SP3-" + (i + 1));
const F = Array.from({ length: 18 }, (_, i) => "w-F" + (i + 1));
const WB = ["w-BV1", "w-BV2", "w-BV3"];

const ALL = { L1, L2, L3, L4, B, S1, S2, H1, H2, H3, H4, N, SP1, SP2, SP3, F, WB };

function pick(rnd, arr, n) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function makeUsers(count = 14, now = Date.now()) {
  const rnd = mulberry32(20261021);
  const users = [];
  for (let i = 0; i < count; i++) {
    const [fam, vor] = NAMES[i % NAMES.length];
    const level = 0.38 + ((i * 37) % 55) / 100; // 38%..92%
    const totalDays = i === count - 1 ? 2 : 3 + Math.floor(rnd() * 86);
    const days = [];
    let cursor = totalDays;
    while (cursor > 0) {
      const back = Math.floor(rnd() * 3);
      const day = new Date(now - (cursor + back) * 86400000).toISOString().slice(0, 10);
      if (!days.includes(day)) days.push(day);
      cursor -= 1 + Math.floor(rnd() * 2);
    }
    days.sort();

    const res = {}, wrong = {}, log = {};
    const pools = [L1, L2, L3, L4, B, H1, H2, H3, H4, N, S1, S2, SP1, SP2, SP3, F, WB];
    const chosen = [];
    for (const pool of pools) chosen.push(...pick(rnd, pool, Math.min(pool.length, 1 + Math.floor(rnd() * 4))));
    const subset = pick(rnd, chosen, Math.min(chosen.length, 6 + Math.floor(rnd() * 34)));

    for (let k = 0; k < subset.length; k++) {
      const vid = subset[k];
      const max = /^(SP|w-|w-B)/.test(vid) ? 20 : 15;
      const skill = Math.max(0.15, Math.min(1, level + (rnd() - 0.5) * 0.28));
      const best = Math.round(max * skill);
      const last = Math.max(0, Math.min(max, best - (rnd() > 0.65 ? Math.round(rnd() * max * 0.2) : 0)));
      const ts = now - Math.floor(rnd() * 30) * 86400000 - Math.floor(rnd() * 8) * 3600000;
      res[vid] = { best, last, max, n: 1 + Math.floor(rnd() * 5), ts };
      log[ts] = { t: ts, vid, sc: last, mx: max };
      if (best < max) {
        const n = 1 + Math.floor(rnd() * (max - best));
        wrong[vid + ":" + n] = { vid, sec: vid[0].toLowerCase(), n, ts: ts + 3600000 };
      }
    }

    const logArr = Object.values(log).sort((a, b) => a.t - b.t);
    const updated = now - Math.floor(rnd() * 9) * 86400000;
    users.push({
      uid: "fixture-" + String(i + 1).padStart(2, "0"),
      updated,
      data: {
        cand: fam ? { fam, vor, done: true } : { fam: "", vor: "", done: false },
        days,
        res,
        wrong,
        nstat: {},
        log: logArr,
      },
    });
  }
  return users;
}

module.exports = { makeUsers };

if (require.main === module) {
  const out = process.argv[2] || "/tmp/dtb-admin-fixture.json";
  fs.writeFileSync(out, JSON.stringify({ users: makeUsers() }, null, 2));
  console.log("fixture written:", out);
}
