const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');

function buildTicketPanel() {
  const embed = new EmbedBuilder()
    .setTitle('🎫 Support Tickets')
    .setDescription('اختار فتح تذكرة من الزر بالأسفل، وغادي يتفتح ليك Channel خاص.')
    .setColor(0x5865f2)
    .setFooter({ text: 'Ano • Ticket System' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket:create').setLabel('فتح تذكرة').setEmoji('🎫').setStyle(ButtonStyle.Primary),
  );
  return { embeds: [embed], components: [row] };
}

function buildTicketControls() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket:claim').setLabel('Claim').setEmoji('🙋').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('ticket:close').setLabel('Close').setEmoji('🔒').setStyle(ButtonStyle.Danger),
  );
}

function buildClosedTicketControls() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket:delete').setLabel('Delete').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
  );
}

function buildRatingMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket:rating')
      .setPlaceholder('قيّم الدعم من 1 إلى 5 ⭐')
      .addOptions(
        { label: '1 نجمة', value: '1', emoji: '⭐' },
        { label: '2 نجوم', value: '2', emoji: '⭐' },
        { label: '3 نجوم', value: '3', emoji: '⭐' },
        { label: '4 نجوم', value: '4', emoji: '⭐' },
        { label: '5 نجوم', value: '5', emoji: '⭐' },
      ),
  );
}

module.exports = { buildTicketPanel, buildTicketControls, buildClosedTicketControls, buildRatingMenu };
