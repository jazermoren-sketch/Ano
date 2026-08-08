const { PermissionFlagsBits } = require('discord.js');
const { getSettings, updateSettings } = require('../systems/protection/protectionService');

const flags = {
  'anti-spam': 'anti_spam',
  'anti-links': 'anti_links',
  'anti-mentions': 'anti_mass_mentions',
  'anti-raid': 'anti_raid',
  'anti-mass-actions': 'anti_mass_actions',
};

module.exports = {
  data: {
    name: 'protection',
    description: 'Configure server protection.',
    default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
    options: [
      { type: 1, name: 'status', description: 'Show protection status.' },
      {
        type: 1,
        name: 'set',
        description: 'Enable or disable a protection module.',
        options: [
          { type: 3, name: 'module', description: 'Protection module.', required: true, choices: Object.keys(flags).map(name => ({ name, value: name })) },
          { type: 5, name: 'enabled', description: 'Enabled or disabled.', required: true },
        ],
      },
    ],
  },

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: '❌ تحتاج إلى صلاحية Manage Server.', ephemeral: true });
    }

    if (interaction.options.getSubcommand() === 'status') {
      const s = getSettings(interaction.guild.id);
      return interaction.reply({
        ephemeral: true,
        content: [
          `🛡️ Anti-Spam: ${s.anti_spam ? 'ON' : 'OFF'}`,
          `🔗 Anti-Links: ${s.anti_links ? 'ON' : 'OFF'}`,
          `📣 Anti-Mentions: ${s.anti_mass_mentions ? 'ON' : 'OFF'}`,
          `🚨 Anti-Raid: ${s.anti_raid ? 'ON' : 'OFF'}`,
          `⚙️ Anti-Mass-Actions: ${s.anti_mass_actions ? 'ON' : 'OFF'}`,
        ].join('\n'),
      });
    }

    const moduleName = interaction.options.getString('module');
    const enabled = interaction.options.getBoolean('enabled');
    updateSettings(interaction.guild.id, { [flags[moduleName]]: enabled ? 1 : 0 });
    return interaction.reply({ content: `✅ ${moduleName}: ${enabled ? 'ON' : 'OFF'}`, ephemeral: true });
  },
};
