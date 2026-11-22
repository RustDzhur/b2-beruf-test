// Link preview (Open Graph): German, absolute prufungen.de image that exists in the repo and stays small for WhatsApp.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const meta = (html, key) => {
  const m = html.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`));
  return m && m[1];
};

for (const page of ["index.html", "admin.html"]) {
  test(`${page}: German link preview with a public image`, () => {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    for (const k of ["og:title", "og:description", "og:url", "og:type", "og:locale", "og:image", "twitter:card", "twitter:image"]) assert.ok(meta(html, k), k);
    assert.strictEqual(meta(html, "og:locale"), "de_DE");
    assert.strictEqual(meta(html, "twitter:card"), "summary_large_image");
    for (const k of ["og:title", "og:description", "twitter:title", "twitter:description"]) assert.ok(!/[Ѐ-ӿ]/.test(meta(html, k)), `${k} must be German`);
    const img = meta(html, "og:image");
    assert.match(img, /^https:\/\/www\.prufungen\.de\/assets\/[\w.-]+\.jpg$/);
    assert.strictEqual(meta(html, "twitter:image"), img);
    const file = path.join(root, new URL(img).pathname);
    assert.ok(fs.existsSync(file), file);
    assert.ok(fs.statSync(file).size < 300 * 1024, "keep under 300 KB for WhatsApp");
  });
}
