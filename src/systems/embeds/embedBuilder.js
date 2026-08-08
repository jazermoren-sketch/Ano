const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle, ModalBuilder } = require('discord.js');
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
  if (Array.isArray(payload.fields)) embed.addFields(payload.fields.slice(0, 25).map(f => ({ name: String(f.name).slice(0, 256), value: String(f.value).slice(0, 1024), inline: Boolean(f.inline) })));
  return embed;
}

function buildComponents(payload = {}) {
  const rows = [];
  if (Array.isArray(payload.buttons) && payload.buttons.length) rows.push(new ActionRowBuilder().addComponents(payload.buttons.slice(0, 5).map(b => new ButtonBuilder().setCustomId(String(b.customId)).setLabel(String(b.label).slice(0, 80)).setStyle(b.style || ButtonStyle.Primary))));
  if (Array.isArray(payload.selectOptions) && payload.selectOptions.length) rows.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(String(payload.selectCustomId || 'ano_embed_select')).setPlaceholder(String(payload.placeholder || 'Select an option')).addOptions(payload.selectOptions.slice(0, 25).map(o => ({ label: String(o.label).slice(0, 100), value: String(o.value).slice(0, 100), description: o.description ? String(o.description).slice(0, 100) : undefined }))));
  return rows.slice(0, 5);
}

function buildModal(customId = 'ano_embed_modal', title = 'Embed Editor', fields = []) {
  const modal = new ModalBuilder().setCustomId(customId).setTitle(String(title).slice(0, 45));
  modal.addComponents(...fields.slice(0, 5).map(f => new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(String(f.customId)).setLabel(String(f.label).slice(0, 45)).setStyle(f.style === 'paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short).setRequired(f.required !== false).setValue(f.value ? String(f.value).slice(0, 4000) : ''))));
  return modal;
}

function saveBuiltEmbed(guildId, name, payload) { return saveEmbed(guildId, name, payload); }
function loadBuiltEmbed(guildId, name) { const data = getEmbed(guildId, name); return data ? { ...data, embed: buildEmbed(data.payload), components: buildComponents(data.payload) } : null; }

module.exports = { buildEmbed, buildComponents, buildModal, saveBuiltEmbed, loadBuiltEmbed };
