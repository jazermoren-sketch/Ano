const repository = require('../../database/embedRepository');

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
function saveEmbed(guildId, input) { return repository.save(guildId, normalize(input)); }
function listEmbeds(guildId) { return repository.list(guildId); }
function getEmbed(guildId, id) { return repository.get(guildId, id); }
module.exports = { normalize, saveEmbed, listEmbeds, getEmbed };
