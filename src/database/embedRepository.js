const Database = require('better-sqlite3');
const path = require('node:path');

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'ano.sqlite');
const fs = require('node:fs');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS embeds (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL, title TEXT, description TEXT, color TEXT, image TEXT, thumbnail TEXT, footer TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_embeds_guild ON embeds(guild_id);`);

function save(guildId, embed) {
  const stmt = db.prepare('INSERT INTO embeds (guild_id,title,description,color,image,thumbnail,footer) VALUES (?,?,?,?,?,?,?)');
  const result = stmt.run(guildId, embed.title || null, embed.description || null, embed.color || null, embed.image || null, embed.thumbnail || null, embed.footer || null);
  return get(guildId, result.lastInsertRowid);
}
function list(guildId) { return db.prepare('SELECT * FROM embeds WHERE guild_id = ? ORDER BY id DESC LIMIT 50').all(guildId); }
function get(guildId, id) { return db.prepare('SELECT * FROM embeds WHERE guild_id = ? AND id = ?').get(guildId, Number(id)) || null; }
function close() { db.close(); }
module.exports = { save, list, get, close };
