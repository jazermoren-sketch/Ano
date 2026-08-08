const raidWindows = new Map();
const WINDOW_MS = 15_000;
const DEFAULT_JOIN_LIMIT = 8;

function recordJoin(guildId, userId) {
  const now = Date.now();
  const entries = (raidWindows.get(guildId) || []).filter(e => now - e.timestamp < WINDOW_MS);
  entries.push({ userId, timestamp: now });
  raidWindows.set(guildId, entries);
  return entries.length;
}

function clear(guildId) { raidWindows.delete(guildId); }
function isRaid(count, limit = DEFAULT_JOIN_LIMIT) { return count >= limit; }

module.exports = { recordJoin, clear, isRaid, WINDOW_MS, DEFAULT_JOIN_LIMIT };
