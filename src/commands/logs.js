const { PermissionFlagsBits } = require('discord.js');
const { setLogChannel, disableLogs } = require('../systems/logs/logService');

module.exports = {
  data: {
    name: 'logs',
    description: 'Configure server logging.',
    options: [
      {
        type: 1,
        name: 'set',
        description: 'Set the channel used for logs.',
        options: [{ type: 7, name: 'channel', description: 'Logs channel.', required: true }],
      },
      { type: 1, name: 'disable', description: 'Disable server logs.' },
    ],
    default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
  },

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: '❌ تحتاج إلى صلاحية Manage Server.', ephemeral: true });
    }

    if (interaction.options.getSubcommand() === 'disable') {
      disableLogs(interaction.guild.id);
      return interaction.reply({ content: '✅ تم تعطيل Logs.', ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel');
    setLogChannel(interaction.guild.id, channel.id);
    return interaction.reply({ content: `✅ تم تعيين ${channel} كقناة Logs.`, ephemeral: true });
  },
};
