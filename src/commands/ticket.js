const { PermissionFlagsBits } = require('discord.js');
const { buildTicketPanel } = require('../systems/tickets/ticketPanel');
const { upsertSettings } = require('../systems/tickets/ticketService');

module.exports = {
  data: {
    name: 'ticket',
    description: 'Manage the ticket system.',
    options: [
      {
        type: 1,
        name: 'panel',
        description: 'Send the ticket panel in this channel.',
      },
      {
        type: 1,
        name: 'config',
        description: 'Configure the ticket system.',
        options: [
          { type: 7, name: 'category', description: 'Ticket category.', required: false, channel_types: [4] },
          { type: 8, name: 'support_role', description: 'Staff role that can access tickets.', required: false },
          { type: 7, name: 'logs', description: 'Ticket logs channel.', required: false, channel_types: [0, 5] },
        ],
      },
    ],
  },

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: '❌ تحتاج إلى صلاحية Manage Server.', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'panel') {
      const message = await interaction.channel.send(buildTicketPanel());
      upsertSettings(interaction.guild.id, {
        panel_channel_id: interaction.channel.id,
        panel_message_id: message.id,
      });
      return interaction.reply({ content: '✅ تم إرسال Ticket Panel.', ephemeral: true });
    }

    const category = interaction.options.getChannel('category');
    const supportRole = interaction.options.getRole('support_role');
    const logs = interaction.options.getChannel('logs');

    upsertSettings(interaction.guild.id, {
      category_id: category?.id,
      support_role_id: supportRole?.id,
      log_channel_id: logs?.id,
    });

    return interaction.reply({ content: '✅ تم تحديث إعدادات Tickets.', ephemeral: true });
  },
};
