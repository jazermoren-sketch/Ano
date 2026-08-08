const fs = require('node:fs');
const path = require('node:path');
const { db } = require('../../database/database');

const BACKUP_DIR = path.resolve(process.cwd(), 'data', 'backups');

function ensureBackupDir() { fs.mkdirSync(BACKUP_DIR, { recursive: true }); }

function collectGuildSettings(guildId) {
  const id = String(guildId);
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  const data = {};
  for (const { name } of tables) {
    try {
      const columns = db.prepare(`PRAGMA table_info(${JSON.stringify(name)})`).all();
      if (!columns.some(c => c.name === 'guild_id')) continue;
      data[name] = db.prepare(`SELECT * FROM ${JSON.stringify(name)} WHERE guild_id = ?`).all(id);
    } catch (_) {}
  }
  return data;
}

function createGuildBackup(guildId) {
  ensureBackupDir();
  const backup = { version: 1, guildId: String(guildId), createdAt: new Date().toISOString(), database: collectGuildSettings(guildId) };
  const filename = `${String(guildId)}-${Date.now()}.json`;
  const filePath = path.join(BACKUP_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(backup, null, 2), 'utf8');
  return { filename, filePath, backup };
}

function listGuildBackups(guildId) {
  ensureBackupDir();
  const prefix = `${String(guildId)}-`;
  return fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith(prefix) && f.endsWith('.json')).sort().reverse();
}

function readGuildBackup(guildId, filename) {
  if (!listGuildBackups(guildId).includes(filename)) throw new Error('Backup not found.');
  return JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, filename), 'utf8'));
}

module.exports = { createGuildBackup, listGuildBackups, readGuildBackup };
