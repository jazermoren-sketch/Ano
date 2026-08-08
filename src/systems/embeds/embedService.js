const savedEmbeds = new Map();

function normalize(input = {}) {
  return {
    title: input.title ? String(input.title).slice(0, 256) : undefined,
    description: input.description ? String(input.description).slice(0, 4096) : undefined,
    color: input.color ? String(input.color).slice(0, 20) : undefined,
    image: input.image ? String(input.image).slice(0, 2048) : undefined,
    thumbnail: input.thumbnail ? String(input.thumbnail).slice(0, 2048) : undefined,
    footer: input.footer ? String(input.footer).slice(0, 2048) : undefined,
  };
}

function saveEmbed(guildId, input) {
  const embed = normalize(input);
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const list = savedEmbeds.get(guildId) || [];
  list.push({ id, ...embed, createdAt: new Date().toISOString() });
  savedEmbeds.set(guildId, list.slice(-50));
  return list.at(-1);
}

function listEmbeds(guildId) { return savedEmbeds.get(guildId) || []; }

function getEmbed(guildId, id) { return listEmbeds(guildId).find(x => x.id === id) || null; }

module.exports = { normalize, saveEmbed, listEmbeds, getEmbed };
