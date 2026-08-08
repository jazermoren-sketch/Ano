const { PermissionFlagsBits, ChannelType } = require('discord.js');
const ticketRepo = require('./ticketSqlRepository');

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
  try {
    const record = ticketRepo.createTicket({ id: channel.id, guildId: guild.id, channelId: channel.id, ownerId: interaction.user.id, type: data.type, subject: data.subject });
    await channel.send({ content: `🎫 <@${interaction.user.id}>\n**${data.subject}**\n${data.details}` });
    return { channel, record };
  } catch (error) {
    await channel.delete('Rollback: ticket database insert failed').catch(() => {});
    throw error;
  }
}

async function claimTicket(interaction, channel) {
  if (!channel?.permissionOverwrites) throw new Error('Ticket channel not found.');
  const record = ticketRepo.claimTicket(channel.id, interaction.user.id);
  if (!record) throw new Error('Ticket is not open or does not exist.');
  return interaction.reply({ content: `✅ Ticket claimed by <@${interaction.user.id}>.`, ephemeral: false });
}

async function closeTicket(interaction, channel) {
  if (!channel?.permissionOverwrites) throw new Error('Ticket channel not found.');
  const record = ticketRepo.closeTicket(channel.id);
  if (!record) throw new Error('Ticket is already closed or does not exist.');
  await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false });
  return interaction.reply({ content: '🔒 Ticket closed.', ephemeral: false });
}

async function deleteTicket(interaction, channel) {
  const record = ticketRepo.getTicket(channel.id);
  if (!record) throw new Error('Ticket does not exist in the database.');
  await interaction.reply({ content: '🗑️ Deleting ticket...', ephemeral: true });
  ticketRepo.deleteTicket(channel.id);
  return channel.delete('Ano ticket delete');
}

module.exports = { createTicketChannel, claimTicket, closeTicket, deleteTicket };
