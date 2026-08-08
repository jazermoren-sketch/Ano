const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { db } = require('../../database/database');

function ensureTicketTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_settings (
      guild_id TEXT PRIMARY KEY,
      category_id TEXT,
      support_role_id TEXT,
      panel_channel_id TEXT,
      panel_message_id TEXT,
      log_channel_id TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL UNIQUE,
      owner_id TEXT NOT NULL,
      claimed_by TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      closed_at TEXT
    );
  `);
}

function getSettings(guildId) {
  ensureTicketTables();
  return db.prepare('SELECT * FROM ticket_settings WHERE guild_id = ?').get(guildId) || null;
}

function upsertSettings(guildId, values = {}) {
  ensureTicketTables();
  const current = getSettings(guildId) || {};
  const next = {
    category_id: values.category_id ?? current.category_id ?? null,
    support_role_id: values.support_role_id ?? current.support_role_id ?? null,
    panel_channel_id: values.panel_channel_id ?? current.panel_channel_id ?? null,
    panel_message_id: values.panel_message_id ?? current.panel_message_id ?? null,
    log_channel_id: values.log_channel_id ?? current.log_channel_id ?? null,
  };

  db.prepare(`
    INSERT INTO ticket_settings
      (guild_id, category_id, support_role_id, panel_channel_id, panel_message_id, log_channel_id)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET
      category_id = excluded.category_id,
      support_role_id = excluded.support_role_id,
      panel_channel_id = excluded.panel_channel_id,
      panel_message_id = excluded.panel_message_id,
      log_channel_id = excluded.log_channel_id,
      updated_at = CURRENT_TIMESTAMP
  `).run(
    guildId,
    next.category_id,
    next.support_role_id,
    next.panel_channel_id,
    next.panel_message_id,
    next.log_channel_id,
  );

  return getSettings(guildId);
}

async function createTicket(interaction) {
  ensureTicketTables();
  const guild = interaction.guild;
  const ownerId = interaction.user.id;
  const settings = getSettings(guild.id);

  const existing = db.prepare(`
    SELECT channel_id FROM tickets
    WHERE guild_id = ? AND owner_id = ? AND status = 'open'
    LIMIT 1
  `).get(guild.id, ownerId);

  if (existing) {
    return { ok: false, reason: 'ALREADY_OPEN', channelId: existing.channel_id };
  }

  const channel = await guild.channels.create({
    name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 80) || `ticket-${ownerId.slice(-6)}`,
    type: ChannelType.GuildText,
    parent: settings?.category_id || undefined,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: ownerId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
        ],
      },
      ...(settings?.support_role_id
        ? [{
            id: settings.support_role_id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles,
            ],
          }]
        : []),
      {
        id: guild.members.me.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageMessages,
        ],
      },
    ],
  });

  db.prepare(`
    INSERT INTO tickets (guild_id, channel_id, owner_id)
    VALUES (?, ?, ?)
  `).run(guild.id, channel.id, ownerId);

  return { ok: true, channel };
}

function getTicket(channelId) {
  ensureTicketTables();
  return db.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(channelId) || null;
}

function claimTicket(channelId, userId) {
  ensureTicketTables();
  const ticket = getTicket(channelId);
  if (!ticket || ticket.status !== 'open') return null;
  db.prepare('UPDATE tickets SET claimed_by = ? WHERE channel_id = ?').run(userId, channelId);
  return getTicket(channelId);
}

function closeTicket(channelId) {
  ensureTicketTables();
  const ticket = getTicket(channelId);
  if (!ticket || ticket.status !== 'open') return null;
  db.prepare(`
    UPDATE tickets SET status = 'closed', closed_at = CURRENT_TIMESTAMP
    WHERE channel_id = ?
  `).run(channelId);
  return getTicket(channelId);
}

module.exports = {
  ensureTicketTables,
  getSettings,
  upsertSettings,
  createTicket,
  getTicket,
  claimTicket,
  closeTicket,
};
