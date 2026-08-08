const express = require('express');
const { restoreGuildBackup } = require('../systems/backup/restoreService');

function createRestoreRouter({ authorizeGuild } = {}) {
  const router = express.Router();

  async function authorize(req, res, next) {
    try {
      if (typeof authorizeGuild === 'function' && !(await authorizeGuild(req))) return res.status(403).json({ error: 'Forbidden' });
      next();
    } catch (error) { next(error); }
  }

  router.post('/guilds/:guildId/backups/:filename/restore', express.json(), authorize, (req, res, next) => {
    try {
      const dryRun = Boolean(req.body?.dryRun);
      const result = restoreGuildBackup(req.params.guildId, req.params.filename, { dryRun });
      res.json({ success: true, restored: result.restored, dryRun: result.dryRun, filename: req.params.filename });
    } catch (error) {
      res.status(400).json({ error: error.message || 'Restore failed' });
    }
  });

  return router;
}

module.exports = { createRestoreRouter };
