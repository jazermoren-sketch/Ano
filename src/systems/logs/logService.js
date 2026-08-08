const { EmbedBuilder } = require('discord.js');
const { db } = require('../../database/database');

function ensureLogTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS log_settings (
      guild_id TEXT PRIMARY KEY,
      channel_id TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function getLogSettings(guildId) {
  ensureLogTables();
  return db.prepare('SELECT * FROM log_settings WHERE guild_id = ?').get(guildId) || null;
}

function setLogChannel(guildId, channelId) {
  ensureLogTables();
  db.prepare(`
    INSERT INTO log_settings (guild_id, channel_id, enabled)
    VALUES (?, ?, 1)
    ON CONFLICT(guild_id) DO UPDATE SET
      channel_id = excluded.channel_id,
      enabled = 1,
      updated_at = CURRENT_TIMESTAMP
  `).run(guildId, channelId);
  return getLogSettings(guildId);
}

function disableLogs(guildId) {
  ensureLogTables();
  db.prepare(`UPDATE log_settings SET enabled = 0, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?`).run(guildId);
}

async function sendLog(guild, { title, description, color = 0x5865f2, fields = [] }) {
  if (!guild) return;
  const settings = getLogSettings(guild.id);
  if (!settings?.enabled || !settings.channel_id) return;

  const channel = guild.channels.cache.get(settings.channel_id)
    || await guild.channels.fetch(settings.channel_id).catch(() => null);
  if (!channel?.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description || null)
    .setColor(color)
    .setTimestamp();

  if (fields.length) embed.addFields(fields);
  await channel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = { ensureLogTables, getLogSettings, setLogChannel, disableLogs, sendLog };
