const { AttachmentBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { buildTicketControls, buildClosedTicketControls, buildRatingMenu } = require('../systems/tickets/ticketPanel');
const {
  createTicket,
  getTicket,
  getSettings,
  claimTicket,
  closeTicket,
  saveRating,
} = require('../systems/tickets/ticketService');

async function buildTranscript(channel) {
  const messages = [];
  let before;
  while (messages.length < 500) {
    const batch = await channel.messages.fetch({ limit: 100, before });
    if (!batch.size) break;
    messages.push(...batch.values());
    before = batch.last().id;
    if (batch.size < 100) break;
  }

  return [...messages]
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .map((message) => {
      const time = new Date(message.createdTimestamp).toISOString();
      const content = message.content || '[no text]';
      const attachments = [...message.attachments.values()].map((a) => a.url).join(' ');
      return `[${time}] ${message.author.tag}: ${content}${attachments ? ` | Attachments: ${attachments}` : ''}`;
    })
    .join('\n');
}

async function sendTranscript(channel, ticket) {
  const settings = getSettings(channel.guild.id);
  if (!settings?.log_channel_id) return;
  const logChannel = await channel.guild.channels.fetch(settings.log_channel_id).catch(() => null);
  if (!logChannel?.isTextBased()) return;

  const text = await buildTranscript(channel);
  const file = new AttachmentBuilder(Buffer.from(text || 'No messages.', 'utf8'), {
    name: `${channel.name}-transcript.txt`,
  });

  await logChannel.send({
    embeds: [new EmbedBuilder()
      .setTitle('📄 Ticket Transcript')
      .setDescription(`Ticket: <#${channel.id}>\nOwner: <@${ticket.owner_id}>\nClosed by: <@${ticket.closed_by}>`)
      .setColor(0x5865f2)],
    files: [file],
  });
}

async function handleTicketButton(interaction) {
  if (interaction.customId === 'ticket:create') {
    const result = await createTicket(interaction);
    if (!result.ok) return interaction.reply({ content: `⚠️ عندك Ticket مفتوحة بالفعل: <#${result.channelId}>`, ephemeral: true });

    await result.channel.send({
      content: `<@${interaction.user.id}>`,
      embeds: [new EmbedBuilder().setTitle('🎫 Ticket Opened').setDescription('مرحبا! شرح لينا المشكل ديالك، وشي واحد من Staff غادي يعاونك.').setColor(0x5865f2)],
      components: [buildTicketControls()],
    });
    return interaction.reply({ content: `✅ تفتحات ليك التذكرة: ${result.channel}`, ephemeral: true });
  }

  const ticket = getTicket(interaction.channelId);
  if (!ticket) return interaction.reply({ content: '❌ هاد الـChannel ماشي Ticket.', ephemeral: true });

  if (interaction.customId === 'ticket:claim') {
    if (ticket.owner_id === interaction.user.id) return interaction.reply({ content: '❌ مايمكنش لصاحب التذكرة يدير Claim لراسو.', ephemeral: true });
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) return interaction.reply({ content: '❌ غير Staff يقدر يدير Claim.', ephemeral: true });
    const updated = claimTicket(interaction.channelId, interaction.user.id);
    if (!updated) return interaction.reply({ content: '❌ التذكرة ما بقاتش مفتوحة.', ephemeral: true });
    return interaction.reply({ content: `🙋 تم Claim من طرف <@${interaction.user.id}>.` });
  }

  if (interaction.customId === 'ticket:close') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) return interaction.reply({ content: '❌ غير Staff يقدر يسد Ticket.', ephemeral: true });
    if (ticket.status !== 'open') return interaction.reply({ content: '❌ التذكرة مسدودة أصلاً.', ephemeral: true });

    const updated = closeTicket(interaction.channelId, interaction.user.id);
    if (!updated) return interaction.reply({ content: '❌ تعذر إغلاق التذكرة.', ephemeral: true });
    await sendTranscript(interaction.channel, updated).catch((error) => console.error('[TICKET] Transcript error:', error));
    await interaction.channel.permissionOverwrites.edit(ticket.owner_id, { SendMessages: false, ViewChannel: true });
    await interaction.channel.setName(`closed-${interaction.channel.name.replace(/^ticket-/, '')}`.slice(0, 100));

    const components = [buildClosedTicketControls()];
    if (updated.closed_by !== updated.owner_id) components.push(buildRatingMenu());
    return interaction.reply({
      embeds: [new EmbedBuilder().setTitle('🔒 Ticket Closed').setDescription('تسدات التذكرة. صاحبها يقدر يقيم الدعم، ومن بعد يقدر Staff يحذفها.').setColor(0xed4245)],
      components,
    });
  }

  if (interaction.customId === 'ticket:delete') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: '❌ غير Staff يقدر يحذف Ticket.', ephemeral: true });
    await interaction.reply({ content: '🗑️ غادي تتحذف التذكرة...', ephemeral: true });
    setTimeout(() => interaction.channel.delete('Ticket deleted by staff').catch(() => {}), 1500);
  }
}

async function handleRating(interaction) {
  const ticket = getTicket(interaction.channelId);
  if (!ticket) return interaction.reply({ content: '❌ هادي ماشي Ticket.', ephemeral: true });
  const rating = Number(interaction.values[0]);
  const result = saveRating(interaction.channelId, interaction.user.id, rating);

  const messages = {
    ALREADY_RATED: '❌ التذكرة تقيمات من قبل.',
    NOT_OWNER: '❌ غير صاحب التذكرة يقدر يقيم.',
    OWNER_CLOSED: '❌ مايمكنش لصاحب التذكرة يقيم إلا كان هو اللي سدها.',
    NOT_CLOSED: '❌ خاص التذكرة تكون مسدودة.',
  };
  if (!result.ok) return interaction.reply({ content: messages[result.reason] || '❌ تعذر تسجيل التقييم.', ephemeral: true });
  return interaction.reply({ content: `⭐ شكراً! تسجل التقييم ديالك: **${rating}/5**.`, ephemeral: true });
}

module.exports = async (interaction) => {
  try {
    if (interaction.isButton() && interaction.customId.startsWith('ticket:')) return handleTicketButton(interaction);
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket:rating') return handleRating(interaction);
  } catch (error) {
    console.error('[INTERACTION] Ticket error:', error);
    if (!interaction.replied && !interaction.deferred) await interaction.reply({ content: '❌ وقع خطأ أثناء معالجة الطلب.', ephemeral: true }).catch(() => {});
  }
};
