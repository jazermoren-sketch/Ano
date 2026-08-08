const fs = require('node:fs');
const path = require('node:path');

function checkProjectHealth() {
  const root = process.cwd();
  const required = ['src'];
  const checks = Object.fromEntries(required.map(name => [name, fs.existsSync(path.join(root, name))]));
  return { ok: Object.values(checks).every(Boolean), checks, checkedAt: new Date().toISOString() };
}

module.exports = { checkProjectHealth };
