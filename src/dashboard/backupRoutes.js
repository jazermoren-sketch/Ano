const express = require('express');
const { createBackupForDashboard, listBackupsForDashboard, getBackupForDashboard } = require('./backupController');

function createBackupRouter({ authorizeGuild } = {}) {
  const router = express.Router();
  async function authorize(req, res, next) {
    try {
      if (typeof authorizeGuild === 'function' && !(await authorizeGuild(req))) return res.status(403).json({ error: 'Forbidden' });
      next();
    } catch (error) { next(error); }
  }

  router.get('/guilds/:guildId/backups', authorize, (req, res) => {
    res.json({ success: true, backups: listBackupsForDashboard(req.params.guildId) });
  });

  router.post('/guilds/:guildId/backups', authorize, (req, res, next) => {
    try {
      const result = createBackupForDashboard(req.params.guildId);
      res.status(201).json({ success: true, backup: { filename: result.filename, createdAt: result.backup.createdAt } });
    } catch (error) { next(error); }
  });

  router.get('/guilds/:guildId/backups/:filename', authorize, (req, res, next) => {
    try {
      const backup = getBackupForDashboard(req.params.guildId, req.params.filename);
      res.json({ success: true, backup });
    } catch (error) { res.status(404).json({ error: 'Backup not found' }); }
  });

  return router;
}

module.exports = { createBackupRouter };
