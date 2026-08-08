const express = require('express');
const { getProtectionForDashboard, updateProtectionFromDashboard } = require('./protectionController');

function createProtectionRouter({ authorizeGuild } = {}) {
  const router = express.Router();
  const authorize = async (req, res, next) => {
    try {
      if (typeof authorizeGuild === 'function') {
        const allowed = await authorizeGuild(req);
        if (!allowed) return res.status(403).json({ error: 'Forbidden' });
      }
      if (!req.params.guildId) return res.status(400).json({ error: 'guildId is required' });
      next();
    } catch (error) { next(error); }
  };

  router.get('/guilds/:guildId/protection', authorize, (req, res) => {
    res.json({ success: true, settings: getProtectionForDashboard(req.params.guildId) });
  });

  router.patch('/guilds/:guildId/protection', authorize, (req, res, next) => {
    try {
      const payload = req.body || {};
      const settings = updateProtectionFromDashboard(req.params.guildId, payload);
      res.json({ success: true, settings });
    } catch (error) { next(error); }
  });

  return router;
}

module.exports = { createProtectionRouter };
