const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

function buildMainSelect(options) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId('ano:main-select').setPlaceholder('اختار من القائمة').addOptions(options),
  );
}

function buildButton(customId, label, style = ButtonStyle.Primary, emoji) {
  const button = new ButtonBuilder().setCustomId(customId).setLabel(label).setStyle(style);
  if (emoji) button.setEmoji(emoji);
  return new ActionRowBuilder().addComponents(button);
}

function buildModal(customId, title, fields) {
  const modal = new ModalBuilder().setCustomId(customId).setTitle(title);
  for (const field of fields) {
    const input = new TextInputBuilder()
      .setCustomId(field.id)
      .setLabel(field.label)
      .setStyle(field.style === 'paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short)
      .setRequired(field.required ?? true);
    if (field.placeholder) input.setPlaceholder(field.placeholder);
    if (field.value) input.setValue(field.value);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  }
  return modal;
}

module.exports = { buildMainSelect, buildButton, buildModal };
