const { db } = require('../../database/database');

function ensureProtectionTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS protection_settings (
      guild_id TEXT PRIMARY KEY,
      anti_spam INTEGER NOT NULL DEFAULT 1,
      anti_links INTEGER NOT NULL DEFAULT 0,
      anti_mass_mentions INTEGER NOT NULL DEFAULT 1,
      anti_raid INTEGER NOT NULL DEFAULT 1,
      anti_mass_actions INTEGER NOT NULL DEFAULT 1,
      max_mentions INTEGER NOT NULL DEFAULT 5,
      spam_messages INTEGER NOT NULL DEFAULT 6,
      spam_window_seconds INTEGER NOT NULL DEFAULT 8,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS protection_strikes (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      strikes INTEGER NOT NULL DEFAULT 0,
      last_strike_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (guild_id, user_id)
    );
  `);
}

function getSettings(guildId) {
  ensureProtectionTables();
  return db.prepare('SELECT * FROM protection_settings WHERE guild_id = ?').get(guildId) || {
    guild_id: guildId,
    anti_spam: 1,
    anti_links: 0,
    anti_mass_mentions: 1,
    anti_raid: 1,
    anti_mass_actions: 1,
    max_mentions: 5,
    spam_messages: 6,
    spam_window_seconds: 8,
  };
}

function updateSettings(guildId, values) {
  ensureProtectionTables();
  const current = getSettings(guildId);
  const next = { ...current, ...values };
  db.prepare(`
    INSERT INTO protection_settings
      (guild_id, anti_spam, anti_links, anti_mass_mentions, anti_raid, anti_mass_actions, max_mentions, spam_messages, spam_window_seconds)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      anti_spam=excluded.anti_spam,
      anti_links=excluded.anti_links,
      anti_mass_mentions=excluded.anti_mass_mentions,
      anti_raid=excluded.anti_raid,
      anti_mass_actions=excluded.anti_mass_actions,
      max_mentions=excluded.max_mentions,
      spam_messages=excluded.spam_messages,
      spam_window_seconds=excluded.spam_window_seconds,
      updated_at=CURRENT_TIMESTAMP
  `).run(guildId, next.anti_spam, next.anti_links, next.anti_mass_mentions, next.anti_raid, next.anti_mass_actions, next.max_mentions, next.spam_messages, next.spam_window_seconds);
  return getSettings(guildId);
}

function addStrike(guildId, userId) {
  ensureProtectionTables();
  db.prepare(`
    INSERT INTO protection_strikes (guild_id, user_id, strikes)
    VALUES (?, ?, 1)
    ON CONFLICT(guild_id, user_id) DO UPDATE SET
      strikes = strikes + 1,
      last_strike_at = CURRENT_TIMESTAMP
  `).run(guildId, userId);
  return db.prepare('SELECT strikes FROM protection_strikes WHERE guild_id = ? AND user_id = ?').get(guildId, userId).strikes;
}

module.exports = { ensureProtectionTables, getSettings, updateSettings, addStrike };
