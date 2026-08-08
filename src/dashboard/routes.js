const { Router } = require('express');
const { getServerDashboard } = require('./dashboardService');
const { updateSettings: updateProtectionSettings } = require('../systems/protection/protectionService');
const { setLogChannel, disableLogs } = require('../systems/logs/logService');
const { upsertSettings: updateTicketSettings } = require('../systems/tickets/ticketService');
const { createBackup } = require('../systems/backups/backupService');
const protectionConfig = require('../systems/protection/protectionConfig');
const embedService = require('../systems/embeds/embedService');
const router = Router();
function requireGuildAccess(req,res,next){if(!req.session.user)return res.redirect('/auth/discord');const guild=(req.session.guilds||[]).find(g=>g.id===req.params.guildId);if(!guild)return res.status(403).send('You cannot manage this server.');req.dashboardGuild=guild;next()}
router.use('/servers/:guildId',requireGuildAccess);
router.get('/servers/:guildId/settings',(req,res)=>res.json({guild:req.dashboardGuild,...getServerDashboard(req.params.guildId),protectionAdvanced:protectionConfig.getSettings(req.params.guildId),whitelist:protectionConfig.getWhitelist(req.params.guildId),embeds:embedService.listEmbeds(req.params.guildId)}));
router.post('/servers/:guildId/protection',(req,res)=>{const allowed=['anti_spam','anti_links','anti_mass_mentions','anti_raid','anti_mass_actions'];const changes={};for(const key of allowed)if(typeof req.body[key]!=='undefined')changes[key]=req.body[key]?1:0;const basic=updateProtectionSettings(req.params.guildId,changes);const advanced={};for(const key of ['antiNuke','antiRaid'])if(typeof req.body[key]!=='undefined')advanced[key]=Boolean(req.body[key]);if(req.body.raidJoinLimit!==undefined)advanced.raidJoinLimit=Math.max(1,Math.min(100,Number(req.body.raidJoinLimit)||8));const current=Object.keys(advanced).length?protectionConfig.updateSettings(req.params.guildId,advanced):protectionConfig.getSettings(req.params.guildId);if(Array.isArray(req.body.whitelist))protectionConfig.setWhitelist(req.params.guildId,req.body.whitelist.filter(x=>/^\d{17,20}$/.test(String(x))).slice(0,100));res.json({ok:true,protection:basic,advanced:current,whitelist:protectionConfig.getWhitelist(req.params.guildId)})});
router.post('/servers/:guildId/logs',(req,res)=>{if(req.body.enabled===false){disableLogs(req.params.guildId);return res.json({ok:true,enabled:false})}if(!req.body.channelId)return res.status(400).json({ok:false,error:'channelId is required'});return res.json({ok:true,logs:setLogChannel(req.params.guildId,req.body.channelId)})});
router.post('/servers/:guildId/tickets',(req,res)=>{const values={};for(const key of ['category_id','support_role_id','panel_channel_id','panel_message_id','log_channel_id'])if(typeof req.body[key]!=='undefined')values[key]=req.body[key]||null;return res.json({ok:true,tickets:updateTicketSettings(req.params.guildId,values)})});
router.post('/servers/:guildId/backups',(req,res)=>res.json({ok:true,backup:createBackup(req.params.guildId,req.body.name||undefined)}));
router.post('/servers/:guildId/embeds',(req,res)=>res.json({ok:true,embed:embedService.saveEmbed(req.params.guildId,req.body)}));
router.get('/servers/:guildId/embeds',(req,res)=>res.json({ok:true,embeds:embedService.listEmbeds(req.params.guildId)}));
module.exports=router;
