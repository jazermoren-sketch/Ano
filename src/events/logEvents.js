const { AuditLogEvent } = require('discord.js');
const { sendLog } = require('../systems/logs/logService');

function userLabel(user) {
  return user ? `${user.tag} (${user.id})` : 'Unknown';
}

module.exports = (client) => {
  client.on('messageDelete', async (message) => {
    if (!message.guild || message.author?.bot) return;
    await sendLog(message.guild, {
      title: '🗑️ Message Deleted',
      color: 0xed4245,
      fields: [
        { name: 'Author', value: userLabel(message.author), inline: true },
        { name: 'Channel', value: `<#${message.channelId}>`, inline: true },
        ...(message.content ? [{ name: 'Content', value: message.content.slice(0, 1024) }] : []),
      ],
    });
  });

  client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;
    await sendLog(newMessage.guild, {
      title: '✏️ Message Edited',
      color: 0xfee75c,
      fields: [
        { name: 'Author', value: userLabel(newMessage.author), inline: true },
        { name: 'Channel', value: `<#${newMessage.channelId}>`, inline: true },
        { name: 'Before', value: oldMessage.content?.slice(0, 1024) || '*Unknown*' },
        { name: 'After', value: newMessage.content?.slice(0, 1024) || '*Empty*' },
      ],
    });
  });

  client.on('guildMemberAdd', async (member) => {
    await sendLog(member.guild, {
      title: '📥 Member Joined',
      color: 0x57f287,
      fields: [
        { name: 'Member', value: `${member.user.tag} (${member.id})` },
        { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>` },
      ],
    });
  });

  client.on('guildMemberRemove', async (member) => {
    await sendLog(member.guild, {
      title: '📤 Member Left',
      color: 0xed4245,
      fields: [{ name: 'Member', value: `${member.user?.tag || 'Unknown'} (${member.id})` }],
    });
  });

  client.on('roleCreate', async (role) => {
    await sendLog(role.guild, {
      title: '➕ Role Created',
      color: 0x57f287,
      fields: [{ name: 'Role', value: `${role} (${role.id})` }],
    });
  });

  client.on('roleDelete', async (role) => {
    await sendLog(role.guild, {
      title: '➖ Role Deleted',
      color: 0xed4245,
      fields: [{ name: 'Role', value: `${role.name} (${role.id})` }],
    });
  });

  client.on('channelCreate', async (channel) => {
    if (!channel.guild) return;
    await sendLog(channel.guild, {
      title: '📁 Channel Created',
      color: 0x57f287,
      fields: [{ name: 'Channel', value: `${channel} (${channel.id})` }],
    });
  });

  client.on('channelDelete', async (channel) => {
    if (!channel.guild) return;
    await sendLog(channel.guild, {
      title: '🗑️ Channel Deleted',
      color: 0xed4245,
      fields: [{ name: 'Channel', value: `${channel.name} (${channel.id})` }],
    });
  });

  client.on('guildBanAdd', async (ban) => {
    await sendLog(ban.guild, {
      title: '🔨 Member Banned',
      color: 0xed4245,
      fields: [{ name: 'Member', value: `${ban.user.tag} (${ban.user.id})` }],
    });
  });

  client.on('guildBanRemove', async (ban) => {
    await sendLog(ban.guild, {
      title: '♻️ Member Unbanned',
      color: 0x57f287,
      fields: [{ name: 'Member', value: `${ban.user.tag} (${ban.user.id})` }],
    });
  });
};
