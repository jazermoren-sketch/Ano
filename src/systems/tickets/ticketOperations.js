const { PermissionFlagsBits, ChannelType } = require('discord.js');
const ticketRepo = require('./ticketSqlRepository');
const { createTranscript } = require('./ticketTranscript');
const { sendTicketLog } = require('../logs/ticketLogService');

async function sendLog(guild, options, action, ticket, actorId) {
  const channelId = options.logChannelId || options.log_channel_id;
  if (!channelId) return;
  const logChannel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
  if (logChannel) await sendTicketLog(logChannel, action, ticket, actorId).catch(() => {});
}

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
    await sendLog(guild, options, 'create', record, interaction.user.id);
    return { channel, record };
  } catch (error) { await channel.delete('Rollback: ticket database insert failed').catch(() => {}); throw error; }
}

async function claimTicket(interaction, channel, options = {}) {
  if (!channel?.permissionOverwrites) throw new Error('Ticket channel not found.');
  const record = ticketRepo.claimTicket(channel.id, interaction.user.id);
  if (!record) throw new Error('Ticket is not open or does not exist.');
  await sendLog(interaction.guild, options, 'claim', record, interaction.user.id);
  return interaction.reply({ content: `✅ Ticket claimed by <@${interaction.user.id}>.`, ephemeral: false });
}

async function closeTicket(interaction, channel, options = {}) {
  if (!channel?.permissionOverwrites) throw new Error('Ticket channel not found.');
  const record = ticketRepo.closeTicket(channel.id);
  if (!record) throw new Error('Ticket is already closed or does not exist.');
  let transcriptPath = null;
  try { transcriptPath = await createTranscript(channel); } catch (_) {}
  await sendLog(interaction.guild, options, 'close', record, interaction.user.id);
  await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false });
  return interaction.reply({ content: `🔒 Ticket closed.${transcriptPath ? `\n📄 Transcript: \`${transcriptPath}\`` : ''}`, ephemeral: false });
}

async function deleteTicket(interaction, channel, options = {}) {
  const record = ticketRepo.getTicket(channel.id);
  if (!record) throw new Error('Ticket does not exist in the database.');
  let transcriptPath = null;
  try { transcriptPath = await createTranscript(channel); } catch (_) {}
  await sendLog(interaction.guild, options, 'delete', record, interaction.user.id);
  await interaction.reply({ content: `🗑️ Deleting ticket${transcriptPath ? ' — transcript saved.' : '...'}`, ephemeral: true });
  ticketRepo.deleteTicket(channel.id);
  return channel.delete('Ano ticket delete');
}

module.exports = { createTicketChannel, claimTicket, closeTicket, deleteTicket };
