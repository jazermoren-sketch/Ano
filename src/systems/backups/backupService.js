const fs = require('node:fs');
const path = require('node:path');
const { db } = require('../../database/database');
const { getSettings: getTicketSettings } = require('../tickets/ticketService');
const { getSettings: getProtectionSettings } = require('../protection/protectionService');
const { getLogSettings } = require('../logs/logService');

const backupDir = path.resolve('./data/backups');
fs.mkdirSync(backupDir, { recursive: true });

function ensureBackupTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      name TEXT NOT NULL,
      file_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function createBackup(guildId, name = `backup-${Date.now()}`) {
  ensureBackupTables();
  const payload = {
    version: 1,
    createdAt: new Date().toISOString(),
    guildId,
    settings: {
      guild: db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId) || null,
      tickets: getTicketSettings(guildId),
      protection: getProtectionSettings(guildId),
      logs: getLogSettings(guildId),
    },
  };

  const safeName = name.replace(/[^a-z0-9_-]/gi, '-').slice(0, 60) || `backup-${Date.now()}`;
  const fileName = `${safeName}-${Date.now()}.json`;
  fs.writeFileSync(path.join(backupDir, fileName), JSON.stringify(payload, null, 2), 'utf8');
  db.prepare('INSERT INTO backups (guild_id, name, file_name) VALUES (?, ?, ?)').run(guildId, safeName, fileName);
  return db.prepare('SELECT * FROM backups WHERE rowid = last_insert_rowid()').get();
}

function listBackups(guildId) {
  ensureBackupTables();
  return db.prepare('SELECT * FROM backups WHERE guild_id = ? ORDER BY id DESC').all(guildId);
}

function getBackup(guildId, id) {
  ensureBackupTables();
  const row = db.prepare('SELECT * FROM backups WHERE guild_id = ? AND id = ?').get(guildId, id);
  if (!row) return null;
  const file = path.join(backupDir, row.file_name);
  if (!fs.existsSync(file)) return null;
  return { ...row, payload: JSON.parse(fs.readFileSync(file, 'utf8')) };
}

function deleteBackup(guildId, id) {
  ensureBackupTables();
  const row = db.prepare('SELECT * FROM backups WHERE guild_id = ? AND id = ?').get(guildId, id);
  if (!row) return false;
  fs.rmSync(path.join(backupDir, row.file_name), { force: true });
  db.prepare('DELETE FROM backups WHERE guild_id = ? AND id = ?').run(guildId, id);
  return true;
}

module.exports = { ensureBackupTables, createBackup, listBackups, getBackup, deleteBackup };
