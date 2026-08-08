const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');

function buildTicketPanel(categories = []) {
  const select = new StringSelectMenuBuilder()
    .setCustomId('ano:ticket:create')
    .setPlaceholder('اختار نوع التذكرة');
  for (const category of categories.slice(0, 25)) {
    select.addOptions({ label: String(category.label).slice(0, 100), value: String(category.value).slice(0, 100), description: category.description ? String(category.description).slice(0, 100) : undefined });
  }
  return [new ActionRowBuilder().addComponents(select)];
}

function buildTicketControls(ticketId) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ano:ticket:claim:${ticketId}`).setLabel('Claim').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`ano:ticket:close:${ticketId}`).setLabel('Close').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`ano:ticket:delete:${ticketId}`).setLabel('Delete').setStyle(ButtonStyle.Danger),
  )];
}

function buildTicketModal(ticketType) {
  return new ModalBuilder().setCustomId(`ano:ticket:modal:${ticketType}`).setTitle('Create Ticket').addComponents(
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('subject').setLabel('Subject').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(true)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('details').setLabel('Details').setStyle(TextInputStyle.Paragraph).setMaxLength(1000).setRequired(true)),
  );
}

module.exports = { buildTicketPanel, buildTicketControls, buildTicketModal };
