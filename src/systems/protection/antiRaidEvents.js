const { Events } = require('discord.js');
const { recordJoin, isRaid } = require('./antiRaidService');
const { getSettings, isWhitelisted } = require('./protectionConfig');

function registerAntiRaid(client, options = {}) {
  client.on(Events.GuildMemberAdd, async member => {
    const config = getSettings(member.guild.id);
    if (!config.antiRaid || isWhitelisted(member.guild.id, member.id)) return;
    const count = recordJoin(member.guild.id, member.id);
    if (!isRaid(count, Number(config.raidJoinLimit) || 8)) return;
    if (options.onRaidDetected) await options.onRaidDetected({ guild: member.guild, count, member });
  });
}
module.exports = { registerAntiRaid };
