const { Router } = require('express');
const { getServerDashboard } = require('./dashboardService');
const { updateProtectionConfig, getProtectionConfig } = require('../systems/protection/protectionConfigService');
const { setLogChannel, disableLogs } = require('../systems/logs/logService');
const { upsertSettings: updateTicketSettings } = require('../systems/tickets/ticketService');
const { createGuildBackup, listGuildBackups, readGuildBackup } = require('../systems/backup/backupService');
const { restoreGuildBackup } = require('../systems/backup/restoreService');
const { createEmbed, getEmbedForDashboard, listEmbedsForDashboard, removeEmbed, sendEmbedToChannel } = require('./embedController');

const router = Router();

function requireGuildAccess(req, res, next) {
  if (!req.session.user) return res.redirect('/auth/discord');
  const guild = (req.session.guilds || []).find(g => g.id === req.params.guildId);
  if (!guild) return res.status(403).json({ ok: false, error: 'You cannot manage this server.' });
  req.dashboardGuild = guild;
  next();
}

router.use('/servers/:guildId', requireGuildAccess);

router.get('/servers/:guildId/settings', (req, res) => {
  res.json({
    guild: req.dashboardGuild,
    dashboard: getServerDashboard(req.params.guildId),
    protection: getProtectionConfig(req.params.guildId),
    embeds: listEmbedsForDashboard(req.params.guildId),
    backups: listGuildBackups(req.params.guildId),
  });
});

router.post('/servers/:guildId/protection', (req, res, next) => {
  try {
    const body = req.body || {};
    const settings = updateProtectionConfig(req.params.guildId, {
      enabled: body.enabled,
      whitelist: Array.isArray(body.whitelist) ? body.whitelist.filter(x => /^\d{17,20}$/.test(String(x))).slice(0, 100) : undefined,
      limits: body.limits,
      windowMs: body.windowMs,
      auditMaxAgeMs: body.auditMaxAgeMs,
    });
    res.json({ ok: true, protection: settings });
  } catch (error) { next(error); }
});

router.post('/servers/:guildId/logs', (req, res) => {
  if (req.body.enabled === false) {
    disableLogs(req.params.guildId);
    return res.json({ ok: true, enabled: false });
  }
  if (!/^\d{17,20}$/.test(String(req.body.channelId || ''))) return res.status(400).json({ ok: false, error: 'Valid channelId is required' });
  return res.json({ ok: true, logs: setLogChannel(req.params.guildId, req.body.channelId) });
});

router.post('/servers/:guildId/tickets', (req, res) => {
  const values = {};
  for (const key of ['category_id', 'support_role_id', 'panel_channel_id', 'panel_message_id', 'log_channel_id']) {
    if (typeof req.body[key] !== 'undefined') values[key] = req.body[key] || null;
  }
  return res.json({ ok: true, tickets: updateTicketSettings(req.params.guildId, values) });
});

router.get('/servers/:guildId/backups', (req, res) => res.json({ ok: true, backups: listGuildBackups(req.params.guildId) }));

router.post('/servers/:guildId/backups', (req, res, next) => {
  try {
    const result = createGuildBackup(req.params.guildId);
    res.status(201).json({ ok: true, backup: { filename: result.filename, createdAt: result.backup.createdAt } });
  } catch (error) { next(error); }
});

router.get('/servers/:guildId/backups/:filename', (req, res, next) => {
  try { res.json({ ok: true, backup: readGuildBackup(req.params.guildId, req.params.filename) }); }
  catch (error) { res.status(404).json({ ok: false, error: 'Backup not found' }); }
});

router.post('/servers/:guildId/backups/:filename/restore', (req, res) => {
  try {
    const result = restoreGuildBackup(req.params.guildId, req.params.filename, { dryRun: Boolean(req.body?.dryRun) });
    res.json({ ok: true, restored: result.restored, dryRun: result.dryRun, filename: req.params.filename });
  } catch (error) { res.status(400).json({ ok: false, error: error.message || 'Restore failed' }); }
});

router.get('/servers/:guildId/embeds', (req, res) => res.json({ ok: true, embeds: listEmbedsForDashboard(req.params.guildId) }));
router.get('/servers/:guildId/embeds/:name', (req, res) => {
  const embed = getEmbedForDashboard(req.params.guildId, req.params.name);
  if (!embed) return res.status(404).json({ ok: false, error: 'Embed not found' });
  return res.json({ ok: true, embed });
});
router.put('/servers/:guildId/embeds/:name', (req, res, next) => {
  try { return res.json({ ok: true, embed: createEmbed(req.params.guildId, req.params.name, req.body || {}) }); }
  catch (error) { return next(error); }
});
router.delete('/servers/:guildId/embeds/:name', (req, res) => res.json({ ok: removeEmbed(req.params.guildId, req.params.name) }));
router.post('/servers/:guildId/embeds/:name/send', async (req, res) => {
  try {
    if (!req.app.locals.discordClient) return res.status(503).json({ ok: false, error: 'Discord client unavailable' });
    const guild = req.app.locals.discordClient.guilds.cache.get(req.params.guildId) || await req.app.locals.discordClient.guilds.fetch(req.params.guildId);
    const message = await sendEmbedToChannel(guild, req.body?.channelId, req.params.name);
    res.json({ ok: true, messageId: message.id, channelId: message.channelId });
  } catch (error) { res.status(400).json({ ok: false, error: error.message || 'Failed to send embed' }); }
});

module.exports = router;
