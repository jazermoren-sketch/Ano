const { ensureGuild } = require('../database/database');

module.exports = (guild) => {
  ensureGuild(guild.id);
  console.log(`[GUILD] Initialized settings for ${guild.name} (${guild.id})`);
};
