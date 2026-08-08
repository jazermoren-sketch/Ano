const { getSettings: getTicketSettings } = require('../systems/tickets/ticketService');
const { getSettings: getProtectionSettings } = require('../systems/protection/protectionService');
const { getLogSettings } = require('../systems/logs/logService');
const { listBackups } = require('../systems/backups/backupService');

function getServerDashboard(guildId) {
  return {
    tickets: getTicketSettings(guildId),
    protection: getProtectionSettings(guildId),
    logs: getLogSettings(guildId),
    backups: listBackups(guildId),
  };
}

module.exports = { getServerDashboard };
