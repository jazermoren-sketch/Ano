const { db } = require('../../database/database');
const { readGuildBackup } = require('./backupService');

function restoreGuildBackup(guildId, filename, options = {}) {
  const backup = readGuildBackup(guildId, filename);
  if (String(backup.guildId) !== String(guildId)) throw new Error('Backup guild mismatch.');
  if (backup.version !== 1) throw new Error('Unsupported backup version.');
  const transaction = db.transaction(() => {
    for (const [table, rows] of Object.entries(backup.database || {})) {
      if (!Array.isArray(rows) || !rows.length) continue;
      const columns = Object.keys(rows[0]);
      if (!columns.includes('guild_id')) continue;
      const placeholders = columns.map(() => '?').join(',');
      const sql = `INSERT OR REPLACE INTO "${table.replace(/"/g, '""')}" (${columns.map(c => `"${c.replace(/"/g, '""')}"`).join(',')}) VALUES (${placeholders})`;
      const stmt = db.prepare(sql);
      for (const row of rows) stmt.run(...columns.map(column => row[column]));
    }
  });
  if (options.dryRun) return { restored: false, dryRun: true, backup };
  transaction();
  return { restored: true, dryRun: false, backup };
}

module.exports = { restoreGuildBackup };
