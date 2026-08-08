const { PermissionFlagsBits } = require('discord.js');

async function lockdownMember(member) {
  if (!member || !member.manageable || member.permissions.has(PermissionFlagsBits.Administrator)) return false;
  try {
    await member.timeout(60 * 60 * 1000, 'Ano Anti-Nuke threshold exceeded');
    return true;
  } catch { return false; }
}

async function lockdownGuild(guild) {
  const results = [];
  for (const channel of guild.channels.cache.values()) {
    if (!channel.isTextBased() || !channel.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages)) continue;
    try {
      await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }, { reason: 'Ano Anti-Nuke emergency lockdown' });
      results.push(channel.id);
    } catch {}
  }
  return results;
}

module.exports = { lockdownMember, lockdownGuild };
