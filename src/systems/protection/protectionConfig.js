const whitelist = new Map();
const settings = new Map();

function getSettings(guildId) {
  return settings.get(guildId) || { antiNuke: true, antiRaid: true, raidJoinLimit: 8 };
}
function updateSettings(guildId, changes) {
  const next = { ...getSettings(guildId), ...changes };
  settings.set(guildId, next);
  return next;
}
function getWhitelist(guildId) { return [...(whitelist.get(guildId) || new Set())]; }
function setWhitelist(guildId, ids) { whitelist.set(guildId, new Set(ids)); return getWhitelist(guildId); }
function isWhitelisted(guildId, userId) { return whitelist.get(guildId)?.has(userId) || false; }
module.exports = { getSettings, updateSettings, getWhitelist, setWhitelist, isWhitelisted };
