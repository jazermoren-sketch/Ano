const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const required = [
  'src/index.js',
  'src/dashboard/app.js',
  'src/dashboard/routes.js',
  'src/systems/backups/backupService.js',
  'src/systems/backups/restoreService.js',
  'src/systems/embeds/embedService.js',
  'src/systems/protection/antiNukeService.js',
  'src/systems/protection/antiRaidService.js',
];

let failed = false;
for (const file of required) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    console.error(`[FAIL] Missing: ${file}`);
    failed = true;
    continue;
  }
  const result = spawnSync(process.execPath, ['--check', full], { encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(`[FAIL] Syntax: ${file}\n${result.stderr}`);
    failed = true;
  } else {
    console.log(`[PASS] ${file}`);
  }
}

if (failed) process.exit(1);
console.log('Smoke test passed.');
