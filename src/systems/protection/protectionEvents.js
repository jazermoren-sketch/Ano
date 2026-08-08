const { AuditLogEvent, Events } = require('discord.js');
const { recordAction, isProtectedMember, shouldPunish } = require('./antiNukeService');
const { lockdownMember } = require('./antiNukeResponse');

const monitored = new Map([
  [Events.ChannelCreate, AuditLogEvent.ChannelCreate],
  [Events.ChannelDelete, AuditLogEvent.ChannelDelete],
  [Events.RoleCreate, AuditLogEvent.RoleCreate],
  [Events.RoleDelete, AuditLogEvent.RoleDelete],
]);

async function resolveExecutor(guild, auditType) {
  try {
    const logs = await guild.fetchAuditLogs({ type: auditType, limit: 5 });
    const entry = logs.entries.find(e => Date.now() - e.createdTimestamp < 10_000);
    return entry?.executor || null;
  } catch { return null; }
}

function registerProtectionEvents(client, options = {}) {
  for (const [event, auditType] of monitored) {
    client.on(event, async resource => {
      const guild = resource.guild;
      if (!guild) return;
      const executor = await resolveExecutor(guild, auditType);
      if (!executor || executor.bot) return;
      const member = await guild.members.fetch(executor.id).catch(() => null);
      if (isProtectedMember(member)) return;
      const count = recordAction(guild.id, executor.id, event);
      if (!shouldPunish(count, options.limit || 5)) return;
      if (options.onThreshold) return options.onThreshold({ guild, member, event, count });
      await lockdownMember(member);
    });
  }
}

module.exports = { registerProtectionEvents };
