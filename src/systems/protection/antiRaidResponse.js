const { PermissionFlagsBits } = require('discord.js');

async function lockdownRaid(guild) {
  const changed = [];
  for (const channel of guild.channels.cache.values()) {
    if (!channel.permissionOverwrites || !channel.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.ManageChannels)) continue;
    try {
      await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }, { reason: 'Ano Anti-Raid lockdown' });
      changed.push(channel.id);
    } catch {}
  }
  return changed;
}

module.exports = { lockdownRaid };
