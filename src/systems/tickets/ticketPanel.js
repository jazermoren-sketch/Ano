const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');

function buildTicketPanel() {
  const embed = new EmbedBuilder()
    .setTitle('🎫 Support Tickets')
    .setDescription('اضغط على الزر بالأسفل لفتح تذكرة دعم خاصة بك.')
    .setColor(0x5865f2)
    .setFooter({ text: 'Ano • Ticket System' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket:create')
      .setLabel('فتح تذكرة')
      .setEmoji('🎫')
      .setStyle(ButtonStyle.Primary),
  );

  return { embeds: [embed], components: [row] };
}

function buildTicketControls() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket:claim')
      .setLabel('Claim')
      .setEmoji('🙋')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('ticket:close')
      .setLabel('Close')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger),
  );
}

module.exports = { buildTicketPanel, buildTicketControls };
