const { createGuildBackup, listGuildBackups, readGuildBackup } = require('../systems/backup/backupService');

function createBackupForDashboard(guildId) { return createGuildBackup(guildId); }
function listBackupsForDashboard(guildId) { return listGuildBackups(guildId); }
function getBackupForDashboard(guildId, filename) { return readGuildBackup(guildId, filename); }

module.exports = { createBackupForDashboard, listBackupsForDashboard, getBackupForDashboard };
