const express = require('express');
const { getProtectionForDashboard, updateProtectionFromDashboard } = require('./protectionController');
const { renderProtectionPage } = require('./protectionPage');

function createProtectionPageRouter({ authorizeGuild } = {}) {
  const router = express.Router();
  const authorize = async (req, res, next) => {
    try {
      if (typeof authorizeGuild === 'function' && !(await authorizeGuild(req))) return res.status(403).send('Forbidden');
      next();
    } catch (error) { next(error); }
  };

  router.get('/dashboard/guilds/:guildId/protection', authorize, (req, res) => {
    res.type('html').send(renderProtectionPage(req.params.guildId, getProtectionForDashboard(req.params.guildId)));
  });

  router.post('/dashboard/guilds/:guildId/protection', express.urlencoded({ extended: false }), authorize, (req, res, next) => {
    try {
      let limits = {};
      try { limits = JSON.parse(req.body.limits || '{}'); } catch { return res.status(400).send('Invalid limits JSON'); }
      const settings = updateProtectionFromDashboard(req.params.guildId, {
        enabled: req.body.enabled === 'on',
        whitelist: String(req.body.whitelist || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean),
        limits,
        windowMs: Number(req.body.windowMs),
        auditMaxAgeMs: Number(req.body.auditMaxAgeMs),
      });
      res.type('html').send(renderProtectionPage(req.params.guildId, settings));
    } catch (error) { next(error); }
  });

  return router;
}

module.exports = { createProtectionPageRouter };
