const { getProtectionConfig, updateProtectionConfig } = require('../systems/protection/protectionConfigService');

function getProtectionForDashboard(guildId) {
  return getProtectionConfig(guildId);
}

function updateProtectionFromDashboard(guildId, payload = {}) {
  return updateProtectionConfig(guildId, {
    enabled: payload.enabled,
    whitelist: payload.whitelist,
    limits: payload.limits,
    windowMs: payload.windowMs,
    auditMaxAgeMs: payload.auditMaxAgeMs,
  });
}

module.exports = { getProtectionForDashboard, updateProtectionFromDashboard };
