const { AuditLogEvent, PermissionFlagsBits } = require('discord.js');

const recentActions = new Map();

function isWhitelisted(guildId, userId, whitelist = []) {
  return whitelist.map(String).includes(String(userId));
}

function recordAction(guildId, userId, type, limit, windowMs = 10000) {
  const key = `${guildId}:${userId}:${type}`;
  const now = Date.now();
  const entries = (recentActions.get(key) || []).filter(t => now - t < windowMs);
  entries.push(now);
  recentActions.set(key, entries);
  return entries.length >= limit;
}

async function protectFromAuditAction(guild, executorId, type, options = {}) {
  if (!guild || !executorId) return { blocked: false, reason: 'missing-context' };
  if (isWhitelisted(guild.id, executorId, options.whitelist || [])) return { blocked: false, reason: 'whitelisted' };
  const limits = { channelDelete: 3, roleDelete: 3, ban: 5, kick: 5 };
  const limit = Number(options.limits?.[type] || limits[type] || 5);
  const triggered = recordAction(guild.id, executorId, type, Math.max(1, limit), Number(options.windowMs || 10000));
  if (!triggered) return { blocked: false, reason: 'threshold-not-reached' };
  const member = await guild.members.fetch(executorId).catch(() => null);
  if (!member || member.id === guild.ownerId) return { blocked: false, reason: 'protected-user' };
  if (!member.manageable) return { blocked: false, reason: 'not-manageable' };
  try {
    await member.roles.set([], 'Ano Protection: threshold exceeded');
    return { blocked: true, reason: 'roles-removed', executorId, type };
  } catch (_) {
    return { blocked: false, reason: 'sanction-failed' };
  }
}

async function inspectLatestAuditEntry(guild, action) {
  const logs = await guild.fetchAuditLogs({ type: action, limit: 1 }).catch(() => null);
  return logs?.entries?.first() || null;
}

module.exports = { protectFromAuditAction, inspectLatestAuditEntry, isWhitelisted };
