const { db } = require('../../database/database');
const { getBackup } = require('./backupService');

function restoreBackup(guildId, backupId) {
  const backup = getBackup(guildId, backupId);
  if (!backup) return { ok: false, error: 'Backup not found' };
  const settings = backup.payload?.settings || {};
  const tx = db.transaction(() => {
    if (!settings.guild) return;
    const allowed = Object.keys(settings.guild).filter(k => k !== 'guild_id' && /^[a-zA-Z0-9_]+$/.test(k));
    if (!allowed.length) return;
    const values = allowed.map(k => settings.guild[k]);
    const cols = allowed.map(k => `"${k}"`).join(',');
    const placeholders = allowed.map(() => '?').join(',');
    db.prepare(`INSERT OR REPLACE INTO guild_settings (guild_id, ${cols}) VALUES (?, ${placeholders})`).run(guildId, ...values);
  });
  tx();
  return { ok: true, backupId, restored: Object.keys(settings) };
}

module.exports = { restoreBackup };
