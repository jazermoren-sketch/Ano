const express = require('express');
const { createEmbed, getEmbedForDashboard, listEmbedsForDashboard, removeEmbed, sendEmbedToChannel } = require('./embedController');

function createEmbedRouter({ authorizeGuild } = {}) {
  const router = express.Router();
  async function authorize(req, res, next) {
    try {
      if (typeof authorizeGuild === 'function' && !(await authorizeGuild(req))) return res.status(403).json({ error: 'Forbidden' });
      next();
    } catch (error) { next(error); }
  }

  router.get('/guilds/:guildId/embeds', authorize, (req, res) => res.json({ success: true, embeds: listEmbedsForDashboard(req.params.guildId) }));
  router.get('/guilds/:guildId/embeds/:name', authorize, (req, res) => {
    const embed = getEmbedForDashboard(req.params.guildId, req.params.name);
    if (!embed) return res.status(404).json({ error: 'Embed not found' });
    res.json({ success: true, embed });
  });
  router.put('/guilds/:guildId/embeds/:name', express.json({ limit: '256kb' }), authorize, (req, res) => {
    const embed = createEmbed(req.params.guildId, req.params.name, req.body || {});
    res.json({ success: true, embed });
  });
  router.delete('/guilds/:guildId/embeds/:name', authorize, (req, res) => res.json({ success: removeEmbed(req.params.guildId, req.params.name) }));

  return router;
}

function createEmbedDeliveryRouter({ client, authorizeGuild } = {}) {
  const router = express.Router();
  router.post('/guilds/:guildId/embeds/:name/send', express.json(), async (req, res, next) => {
    try {
      if (typeof authorizeGuild === 'function' && !(await authorizeGuild(req))) return res.status(403).json({ error: 'Forbidden' });
      const guild = client.guilds.cache.get(req.params.guildId) || await client.guilds.fetch(req.params.guildId);
      const message = await sendEmbedToChannel(guild, req.body.channelId, req.params.name);
      res.json({ success: true, messageId: message.id, channelId: message.channelId });
    } catch (error) { next(error); }
  });
  return router;
}

module.exports = { createEmbedRouter, createEmbedDeliveryRouter };
