const { buildTicketControls } = require('../systems/tickets/ticketPanel');
const {
  createTicket,
  getTicket,
  claimTicket,
  closeTicket,
} = require('../systems/tickets/ticketService');

async function handleTicketButton(interaction) {
  if (interaction.customId === 'ticket:create') {
    const result = await createTicket(interaction);

    if (!result.ok) {
      return interaction.reply({
        content: `⚠️ عندك Ticket مفتوحة بالفعل: <#${result.channelId}>`,
        ephemeral: true,
      });
    }

    await result.channel.send({
      content: `<@${interaction.user.id}>`,
      embeds: [{
        title: '🎫 Ticket Opened',
        description: 'مرحبا بك! شرح لينا المشكل ديالك، وشي واحد من Staff غادي يعاونك.',
        color: 0x5865f2,
      }],
      components: [buildTicketControls()],
    });

    return interaction.reply({
      content: `✅ تفتحات ليك التذكرة: ${result.channel}`,
      ephemeral: true,
    });
  }

  const ticket = getTicket(interaction.channelId);
  if (!ticket) {
    return interaction.reply({ content: '❌ هاد الـChannel ماشي Ticket.', ephemeral: true });
  }

  if (interaction.customId === 'ticket:claim') {
    if (ticket.owner_id === interaction.user.id) {
      return interaction.reply({ content: '❌ مايمكنش لصاحب التذكرة يدير Claim لراسو.', ephemeral: true });
    }

    const updated = claimTicket(interaction.channelId, interaction.user.id);
    if (!updated) return interaction.reply({ content: '❌ التذكرة ما بقاتش مفتوحة.', ephemeral: true });

    await interaction.channel.permissionOverwrites.edit(interaction.user.id, {
      SendMessages: true,
      ViewChannel: true,
    });

    return interaction.reply({ content: `🙋 تم Claim من طرف <@${interaction.user.id}>.` });
  }

  if (interaction.customId === 'ticket:close') {
    closeTicket(interaction.channelId);
    await interaction.channel.permissionOverwrites.edit(ticket.owner_id, {
      SendMessages: false,
      ViewChannel: true,
    });
    await interaction.channel.setName(`closed-${interaction.channel.name.replace(/^ticket-/, '')}`.slice(0, 100));
    return interaction.reply({ content: '🔒 تسدات التذكرة. يمكن إضافة Transcript/Delete في المرحلة القادمة.' });
  }
}

module.exports = async (interaction) => {
  try {
    if (interaction.isButton() && interaction.customId.startsWith('ticket:')) {
      return handleTicketButton(interaction);
    }
  } catch (error) {
    console.error('[INTERACTION] Ticket error:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ وقع خطأ أثناء معالجة الطلب.', ephemeral: true }).catch(() => {});
    }
  }
};
