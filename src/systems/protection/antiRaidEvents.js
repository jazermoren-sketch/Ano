const { Events } = require('discord.js');
const { recordJoin, isRaid } = require('./antiRaidService');
const { getSettings, isWhitelisted } = require('./protectionConfig');
const { lockdownRaid } = require('./antiRaidResponse');

function registerAntiRaid(client, options = {}) {
  client.on(Events.GuildMemberAdd, async member => {
    const config = getSettings(member.guild.id);
    if (!config.antiRaid || isWhitelisted(member.guild.id, member.id)) return;
    const count = recordJoin(member.guild.id, member.id);
    if (!isRaid(count, Number(config.raidJoinLimit) || 8)) return;
    if (options.onRaidDetected) return options.onRaidDetected({ guild: member.guild, count, member });
    await lockdownRaid(member.guild);
  });
}
module.exports = { registerAntiRaid };
