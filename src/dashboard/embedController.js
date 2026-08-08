const { saveEmbed, getEmbed, listEmbeds, deleteEmbed } = require('../systems/embeds/embedStore');
const { buildEmbed, buildComponents } = require('../systems/embeds/embedBuilder');

function normalizePayload(payload = {}) {
  return {
    title: payload.title || '',
    description: payload.description || '',
    url: payload.url || '',
    color: payload.color || 0x5865f2,
    image: payload.image || '',
    thumbnail: payload.thumbnail || '',
    footer: payload.footer || '',
    author: payload.author || '',
    timestamp: Boolean(payload.timestamp),
    fields: Array.isArray(payload.fields) ? payload.fields.slice(0, 25) : [],
    buttons: Array.isArray(payload.buttons) ? payload.buttons.slice(0, 5) : [],
    selectCustomId: payload.selectCustomId || '',
    placeholder: payload.placeholder || '',
    selectOptions: Array.isArray(payload.selectOptions) ? payload.selectOptions.slice(0, 25) : [],
  };
}

function createEmbed(guildId, name, payload) {
  const normalized = normalizePayload(payload);
  saveEmbed(guildId, name, normalized);
  return { name, payload: normalized, embed: buildEmbed(normalized), components: buildComponents(normalized) };
}

function getEmbedForDashboard(guildId, name) {
  const saved = getEmbed(guildId, name);
  return saved ? { ...saved, embed: buildEmbed(saved.payload), components: buildComponents(saved.payload) } : null;
}

function listEmbedsForDashboard(guildId) { return listEmbeds(guildId); }
function removeEmbed(guildId, name) { return deleteEmbed(guildId, name); }

async function sendEmbedToChannel(guild, channelId, name) {
  const channel = await guild.channels.fetch(channelId).catch(() => null);
  const saved = getEmbedForDashboard(guild.id, name);
  if (!channel?.isTextBased?.() || !saved) throw new Error('Channel or embed not found.');
  return channel.send({ embeds: [saved.embed], components: saved.components });
}

module.exports = { normalizePayload, createEmbed, getEmbedForDashboard, listEmbedsForDashboard, removeEmbed, sendEmbedToChannel };
