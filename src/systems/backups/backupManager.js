const { createBackup, listBackups, deleteBackup } = require('./backupService');

function createServerBackup(guildId, name) {
  return createBackup(guildId, name || `backup-${new Date().toISOString().slice(0,10)}`);
}

function getServerBackups(guildId) {
  return listBackups(guildId);
}

function removeServerBackup(guildId, backupId) {
  return deleteBackup(guildId, backupId);
}

module.exports = { createServerBackup, getServerBackups, removeServerBackup };
