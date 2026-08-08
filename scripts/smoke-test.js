const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const required = [
  'src/index.js',
  'src/dashboard/app.js',
  'src/dashboard/routes.js',
  'src/dashboard/embedController.js',
  'src/systems/backup/backupService.js',
  'src/systems/backup/restoreService.js',
  'src/systems/embeds/embedStore.js',
  'src/systems/embeds/embedBuilder.js',
  'src/systems/protection/protectionSettings.js',
  'src/systems/protection/protectionConfigService.js',
  'src/systems/protection/protectionEvents.js',
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
