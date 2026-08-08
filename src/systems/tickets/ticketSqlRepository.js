const { db } = require('../../database/database');

function ensureTable() {
  db.exec(`CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL UNIQUE,
    owner_id TEXT NOT NULL,
    type TEXT NOT NULL,
    subject TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    claimed_by TEXT,
    created_at TEXT NOT NULL,
    closed_at TEXT
  );`);
}

function createTicket(data) {
  ensureTable();
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO tickets (id,guild_id,channel_id,owner_id,type,subject,status,created_at) VALUES (?,?,?,?,?,?,?,?)`)
    .run(String(data.id || data.channelId), String(data.guildId), String(data.channelId), String(data.ownerId), String(data.type || 'general'), String(data.subject || '').slice(0,100), 'open', now);
  return getTicket(data.id || data.channelId);
}

function getTicket(id) {
  ensureTable();
  return db.prepare('SELECT * FROM tickets WHERE id = ?').get(String(id)) || null;
}

function claimTicket(id, userId) {
  ensureTable();
  const result = db.prepare(`UPDATE tickets SET claimed_by = ? WHERE id = ? AND status = 'open'`).run(String(userId), String(id));
  return result.changes ? getTicket(id) : null;
}

function closeTicket(id) {
  ensureTable();
  const result = db.prepare(`UPDATE tickets SET status = 'closed', closed_at = ? WHERE id = ? AND status = 'open'`).run(new Date().toISOString(), String(id));
  return result.changes ? getTicket(id) : null;
}

function deleteTicket(id) {
  ensureTable();
  return Boolean(db.prepare('DELETE FROM tickets WHERE id = ?').run(String(id)).changes);
}

module.exports = { ensureTable, createTicket, getTicket, claimTicket, closeTicket, deleteTicket };
