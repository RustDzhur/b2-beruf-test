// The built page scripts must at least parse (a stray bracket blanks the whole page).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs"), path = require("path"), vm = require("vm");
for (const f of ["assets/app.js", "assets/admin.js", "assets/admin_i18n.js", "assets/data.js"]) {
  test(f + " parses", () => { assert.doesNotThrow(() => new vm.Script(fs.readFileSync(path.join(__dirname, "..", f), "utf8"), { filename: f })); });
}
