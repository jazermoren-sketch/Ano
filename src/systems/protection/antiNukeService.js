const { PermissionFlagsBits } = require('discord.js');

const auditActions = new Map();
const WINDOW_MS = 10_000;
const DEFAULT_LIMIT = 5;

function recordAction(guildId, userId, action) {
  const key = `${guildId}:${userId}:${action}`;
  const now = Date.now();
  const entries = (auditActions.get(key) || []).filter(ts => now - ts < WINDOW_MS);
  entries.push(now);
  auditActions.set(key, entries);
  return entries.length;
}

function clearUser(guildId, userId) {
  const prefix = `${guildId}:${userId}:`;
  for (const key of auditActions.keys()) if (key.startsWith(prefix)) auditActions.delete(key);
}

function isProtectedMember(member) {
  if (!member) return false;
  return member.permissions?.has(PermissionFlagsBits.Administrator) || member.id === member.guild.ownerId;
}

function shouldPunish(count, limit = DEFAULT_LIMIT) { return count >= limit; }

module.exports = { recordAction, clearUser, isProtectedMember, shouldPunish, WINDOW_MS, DEFAULT_LIMIT };
