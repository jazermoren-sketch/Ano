const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const databasePath = path.resolve(process.env.DATABASE_PATH || './data/database.sqlite');
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ticket_enabled INTEGER NOT NULL DEFAULT 0,
    protection_enabled INTEGER NOT NULL DEFAULT 0,
    logs_enabled INTEGER NOT NULL DEFAULT 0,
    dashboard_enabled INTEGER NOT NULL DEFAULT 0
  );
`);

function ensureGuild(guildId) {
  db.prepare(`
    INSERT INTO guild_settings (guild_id)
    VALUES (?)
    ON CONFLICT(guild_id) DO NOTHING
  `).run(guildId);
}

function getGuildSettings(guildId) {
  ensureGuild(guildId);
  return db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
}

module.exports = { db, ensureGuild, getGuildSettings };
