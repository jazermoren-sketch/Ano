const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
} = require('discord.js');
const { saveEmbed, getEmbed } = require('./embedStore');

function buildEmbed(payload = {}) {
  const embed = new EmbedBuilder();
  if (payload.title) embed.setTitle(String(payload.title).slice(0, 256));
  if (payload.description) embed.setDescription(String(payload.description).slice(0, 4096));
  if (payload.url) embed.setURL(payload.url);
  if (payload.color) embed.setColor(payload.color);
  if (payload.image) embed.setImage(payload.image);
  if (payload.thumbnail) embed.setThumbnail(payload.thumbnail);
  if (payload.footer) embed.setFooter({ text: String(payload.footer).slice(0, 2048) });
  if (payload.author) embed.setAuthor({ name: String(payload.author).slice(0, 256) });
  if (payload.timestamp) embed.setTimestamp();
  if (Array.isArray(payload.fields)) {
    embed.addFields(payload.fields.slice(0, 25).map((field) => ({
      name: String(field.name).slice(0, 256),
      value: String(field.value).slice(0, 1024),
      inline: Boolean(field.inline),
    })));
  }
  return embed;
}

function buildComponents(payload = {}) {
  const rows = [];

  if (Array.isArray(payload.buttons) && payload.buttons.length) {
    const buttons = payload.buttons.slice(0, 5).map((button) => (
      new ButtonBuilder()
        .setCustomId(String(button.customId))
        .setLabel(String(button.label).slice(0, 80))
        .setStyle(button.style || ButtonStyle.Primary)
    ));
    rows.push(new ActionRowBuilder().addComponents(buttons));
  }

  if (Array.isArray(payload.selectOptions) && payload.selectOptions.length) {
    const options = payload.selectOptions.slice(0, 25).map((option) => ({
      label: String(option.label).slice(0, 100),
      value: String(option.value).slice(0, 100),
      ...(option.description ? { description: String(option.description).slice(0, 100) } : {}),
    }));

    const select = new StringSelectMenuBuilder()
      .setCustomId(String(payload.selectCustomId || 'ano_embed_select'))
      .setPlaceholder(String(payload.placeholder || 'Select an option').slice(0, 150))
      .addOptions(options);

    rows.push(new ActionRowBuilder().addComponents(select));
  }

  return rows.slice(0, 5);
}

function buildModal(customId = 'ano_embed_modal', title = 'Embed Editor', fields = []) {
  const modal = new ModalBuilder()
    .setCustomId(customId)
    .setTitle(String(title).slice(0, 45));

  modal.addComponents(...fields.slice(0, 5).map((field) => (
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId(String(field.customId))
        .setLabel(String(field.label).slice(0, 45))
        .setStyle(field.style === 'paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short)
        .setRequired(field.required !== false)
        .setValue(field.value ? String(field.value).slice(0, 4000) : '')
    )
  )));

  return modal;
}

function saveBuiltEmbed(guildId, name, payload) {
  return saveEmbed(guildId, name, payload);
}

function loadBuiltEmbed(guildId, name) {
  const data = getEmbed(guildId, name);
  return data
    ? { ...data, embed: buildEmbed(data.payload), components: buildComponents(data.payload) }
    : null;
}

module.exports = {
  buildEmbed,
  buildComponents,
  buildModal,
  saveBuiltEmbed,
  loadBuiltEmbed,
};
