const { db } = require('../../database/database');

function ensureEmbedTable() {
  db.exec(`CREATE TABLE IF NOT EXISTS embeds (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL, name TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(guild_id,name));`);
}

function saveEmbed(guildId, name, payload) {
  ensureEmbedTable();
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO embeds (guild_id,name,payload,created_at,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(guild_id,name) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at`).run(String(guildId), String(name), JSON.stringify(payload || {}), now, now);
  return getEmbed(guildId, name);
}

function getEmbed(guildId, name) {
  ensureEmbedTable();
  const row = db.prepare('SELECT * FROM embeds WHERE guild_id = ? AND name = ?').get(String(guildId), String(name));
  if (!row) return null;
  return { ...row, payload: JSON.parse(row.payload || '{}') };
}

function listEmbeds(guildId) {
  ensureEmbedTable();
  return db.prepare('SELECT * FROM embeds WHERE guild_id = ? ORDER BY name').all(String(guildId)).map(row => ({ ...row, payload: JSON.parse(row.payload || '{}') }));
}

function deleteEmbed(guildId, name) {
  ensureEmbedTable();
  return db.prepare('DELETE FROM embeds WHERE guild_id = ? AND name = ?').run(String(guildId), String(name)).changes > 0;
}

module.exports = { ensureEmbedTable, saveEmbed, getEmbed, listEmbeds, deleteEmbed };
