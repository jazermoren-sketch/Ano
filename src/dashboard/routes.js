const { Router } = require('express');
const { getServerDashboard } = require('./dashboardService');
const { updateSettings: updateProtectionSettings } = require('../systems/protection/protectionService');
const { setLogChannel, disableLogs } = require('../systems/logs/logService');
const { upsertSettings: updateTicketSettings } = require('../systems/tickets/ticketService');
const { createBackup } = require('../systems/backups/backupService');

const router = Router();

function requireGuildAccess(req, res, next) {
  if (!req.session.user) return res.redirect('/auth/discord');
  const guild = (req.session.guilds || []).find(g => g.id === req.params.guildId);
  if (!guild) return res.status(403).send('You cannot manage this server.');
  req.dashboardGuild = guild;
  next();
}

router.use('/servers/:guildId', requireGuildAccess);

router.get('/servers/:guildId/settings', (req, res) => {
  const data = getServerDashboard(req.params.guildId);
  res.json({ guild: req.dashboardGuild, ...data });
});

router.post('/servers/:guildId/protection', (req, res) => {
  const allowed = ['anti_spam', 'anti_links', 'anti_mass_mentions', 'anti_raid', 'anti_mass_actions'];
  const changes = {};
  for (const key of allowed) if (typeof req.body[key] !== 'undefined') changes[key] = req.body[key] ? 1 : 0;
  res.json({ ok: true, protection: updateProtectionSettings(req.params.guildId, changes) });
});

router.post('/servers/:guildId/logs', (req, res) => {
  if (req.body.enabled === false) {
    disableLogs(req.params.guildId);
    return res.json({ ok: true, enabled: false });
  }
  if (!req.body.channelId) return res.status(400).json({ ok: false, error: 'channelId is required' });
  return res.json({ ok: true, logs: setLogChannel(req.params.guildId, req.body.channelId) });
});

router.post('/servers/:guildId/tickets', (req, res) => {
  const values = {};
  for (const key of ['category_id', 'support_role_id', 'panel_channel_id', 'panel_message_id', 'log_channel_id']) {
    if (typeof req.body[key] !== 'undefined') values[key] = req.body[key] || null;
  }
  return res.json({ ok: true, tickets: updateTicketSettings(req.params.guildId, values) });
});

router.post('/servers/:guildId/backups', (req, res) => {
  const backup = createBackup(req.params.guildId, req.body.name || undefined);
  return res.json({ ok: true, backup });
});

module.exports = router;
