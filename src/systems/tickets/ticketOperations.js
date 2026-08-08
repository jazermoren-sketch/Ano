const { PermissionFlagsBits, ChannelType } = require('discord.js');

async function createTicketChannel(interaction, data, options = {}) {
  const guild = interaction.guild;
  if (!guild) throw new Error('Guild is required.');
  const me = guild.members.me;
  if (!me?.permissions.has(PermissionFlagsBits.ManageChannels)) throw new Error('Bot needs Manage Channels permission.');
  const safe = String(data.subject || data.type || 'ticket').toLowerCase().replace(/[^a-z0-9-_]/g, '-').slice(0, 80) || 'ticket';
  const channel = await guild.channels.create({ name: `${safe}-${interaction.user.id.slice(-4)}`, type: ChannelType.GuildText, parent: options.categoryId || null, permissionOverwrites: [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    ...(options.supportRoleId ? [{ id: options.supportRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] : []),
  ]});
  await channel.send({ content: `🎫 <@${interaction.user.id}>\n**${data.subject}**\n${data.details}` });
  return channel;
}

async function claimTicket(interaction, channel) {
  if (!channel?.permissionOverwrites) throw new Error('Ticket channel not found.');
  await channel.permissionOverwrites.edit(interaction.user.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
  return interaction.reply({ content: `✅ Ticket claimed by <@${interaction.user.id}>.`, ephemeral: false });
}

async function closeTicket(interaction, channel) {
  if (!channel?.permissionOverwrites) throw new Error('Ticket channel not found.');
  await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false });
  return interaction.reply({ content: '🔒 Ticket closed.', ephemeral: false });
}

async function deleteTicket(interaction, channel) {
  await interaction.reply({ content: '🗑️ Deleting ticket...', ephemeral: true });
  return channel.delete('Ano ticket delete');
}

module.exports = { createTicketChannel, claimTicket, closeTicket, deleteTicket };
