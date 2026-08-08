const { getSettings: getTicketSettings } = require('../systems/tickets/ticketService');
const { getProtectionConfig } = require('../systems/protection/protectionConfigService');
const { getLogSettings } = require('../systems/logs/logService');
const { listGuildBackups } = require('../systems/backup/backupService');

function getServerDashboard(guildId) {
  return {
    tickets: getTicketSettings(guildId),
    protection: getProtectionConfig(guildId),
    logs: getLogSettings(guildId),
    backups: listGuildBackups(guildId),
  };
}

module.exports = { getServerDashboard };
