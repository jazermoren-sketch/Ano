const { getProtectionSettings, saveProtectionSettings } = require('./protectionSettings');

function getProtectionConfig(guildId) {
  const settings = getProtectionSettings(guildId);
  return {
    enabled: settings.enabled,
    whitelist: settings.whitelist,
    limits: settings.limits,
    windowMs: settings.window_ms,
    auditMaxAgeMs: settings.audit_max_age_ms,
  };
}

function updateProtectionConfig(guildId, patch = {}) {
  const current = getProtectionSettings(guildId);
  return saveProtectionSettings(guildId, {
    enabled: patch.enabled === undefined ? current.enabled : Boolean(patch.enabled),
    whitelist: patch.whitelist === undefined ? current.whitelist : patch.whitelist,
    limits: patch.limits === undefined ? current.limits : patch.limits,
    window_ms: patch.windowMs === undefined ? current.window_ms : patch.windowMs,
    audit_max_age_ms: patch.auditMaxAgeMs === undefined ? current.audit_max_age_ms : patch.auditMaxAgeMs,
  });
}

module.exports = { getProtectionConfig, updateProtectionConfig };
