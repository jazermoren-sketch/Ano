const { db } = require('../../database/database');

function ensureProtectionTable() {
  db.exec(`CREATE TABLE IF NOT EXISTS protection_settings (
    guild_id TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 1,
    whitelist TEXT NOT NULL DEFAULT '[]',
    limits TEXT NOT NULL DEFAULT '{}',
    window_ms INTEGER NOT NULL DEFAULT 10000,
    audit_max_age_ms INTEGER NOT NULL DEFAULT 15000,
    updated_at TEXT NOT NULL
  );`);
}

function getProtectionSettings(guildId) {
  ensureProtectionTable();
  const row = db.prepare('SELECT * FROM protection_settings WHERE guild_id = ?').get(String(guildId));
  if (!row) return { guild_id: String(guildId), enabled: true, whitelist: [], limits: {}, window_ms: 10000, audit_max_age_ms: 15000 };
  return { ...row, enabled: Boolean(row.enabled), whitelist: JSON.parse(row.whitelist || '[]'), limits: JSON.parse(row.limits || '{}') };
}

function saveProtectionSettings(guildId, settings = {}) {
  ensureProtectionTable();
  const current = getProtectionSettings(guildId);
  const next = {
    enabled: settings.enabled === undefined ? current.enabled : Boolean(settings.enabled),
    whitelist: Array.isArray(settings.whitelist) ? settings.whitelist.map(String) : current.whitelist,
    limits: settings.limits && typeof settings.limits === 'object' ? settings.limits : current.limits,
    window_ms: Number(settings.window_ms || current.window_ms),
    audit_max_age_ms: Number(settings.audit_max_age_ms || current.audit_max_age_ms),
  };
  db.prepare(`INSERT INTO protection_settings (guild_id,enabled,whitelist,limits,window_ms,audit_max_age_ms,updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(guild_id) DO UPDATE SET enabled=excluded.enabled, whitelist=excluded.whitelist, limits=excluded.limits, window_ms=excluded.window_ms, audit_max_age_ms=excluded.audit_max_age_ms, updated_at=excluded.updated_at`)
    .run(String(guildId), next.enabled ? 1 : 0, JSON.stringify(next.whitelist), JSON.stringify(next.limits), next.window_ms, next.audit_max_age_ms, new Date().toISOString());
  return getProtectionSettings(guildId);
}

module.exports = { ensureProtectionTable, getProtectionSettings, saveProtectionSettings };
