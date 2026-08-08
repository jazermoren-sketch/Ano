const { AuditLogEvent, Events } = require('discord.js');
const { protectFromAuditAction } = require('./protectionGuard');
const { getProtectionSettings } = require('./protectionSettings');
const { resolveTicketLogChannel } = require('../logs/ticketLogResolver');

const monitored = new Map([
  [Events.ChannelDelete, { audit: AuditLogEvent.ChannelDelete, type: 'channelDelete' }],
  [Events.RoleDelete, { audit: AuditLogEvent.RoleDelete, type: 'roleDelete' }],
  [Events.GuildBanAdd, { audit: AuditLogEvent.MemberBanAdd, type: 'ban' }],
  [Events.GuildMemberRemove, { audit: AuditLogEvent.MemberKick, type: 'kick' }],
]);

async function resolveExecutor(guild, auditType, maxAgeMs = 15_000) {
  try {
    const logs = await guild.fetchAuditLogs({ type: auditType, limit: 5 });
    return logs.entries.find(entry => Date.now() - entry.createdTimestamp <= maxAgeMs)?.executor || null;
  } catch { return null; }
}

async function sendProtectionLog(guild, type, executorId, reason) {
  const channel = await resolveTicketLogChannel(guild);
  if (!channel?.send) return;
  await channel.send({ content: `🛡️ **Protection triggered**\nAction: \`${type}\`\nExecutor: <@${executorId}>\nReason: ${reason}` }).catch(() => {});
}

function registerProtectionEvents(client, options = {}) {
  for (const [event, config] of monitored) {
    client.on(event, async resource => {
      const guild = resource.guild;
      if (!guild) return;
      const settings = getProtectionSettings(guild.id);
      if (!settings.enabled) return;
      const executor = await resolveExecutor(guild, config.audit, settings.audit_max_age_ms);
      if (!executor || executor.bot) return;
      const result = await protectFromAuditAction(guild, executor.id, config.type, {
        whitelist: settings.whitelist,
        limits: settings.limits,
        windowMs: settings.window_ms,
      });
      if (result.blocked) await sendProtectionLog(guild, config.type, executor.id, result.reason);
    });
  }
}

module.exports = { registerProtectionEvents, resolveExecutor };
