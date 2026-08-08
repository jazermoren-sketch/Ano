const { getLogSettings } = require('./logService');

async function resolveTicketLogChannel(guild) {
  if (!guild) return null;
  const settings = getLogSettings(guild.id);
  if (!settings?.enabled || !settings.channel_id) return null;
  return guild.channels.cache.get(settings.channel_id)
    || await guild.channels.fetch(settings.channel_id).catch(() => null);
}

module.exports = { resolveTicketLogChannel };
