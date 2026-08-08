const { PermissionFlagsBits } = require('discord.js');
const { createBackup, listBackups, getBackup, deleteBackup } = require('../systems/backups/backupService');

module.exports = {
  data: {
    name: 'backup',
    description: 'Manage bot server-settings backups.',
    default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
    options: [
      {
        type: 1,
        name: 'create',
        description: 'Create a backup of bot settings.',
        options: [{ type: 3, name: 'name', description: 'Backup name.', required: false }],
      },
      { type: 1, name: 'list', description: 'List available backups.' },
      {
        type: 1,
        name: 'info',
        description: 'Show backup information.',
        options: [{ type: 4, name: 'id', description: 'Backup ID.', required: true }],
      },
      {
        type: 1,
        name: 'delete',
        description: 'Delete a backup.',
        options: [{ type: 4, name: 'id', description: 'Backup ID.', required: true }],
      },
    ],
  },

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: '❌ تحتاج إلى صلاحية Manage Server.', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
      const backup = createBackup(interaction.guild.id, interaction.options.getString('name') || undefined);
      return interaction.reply({ content: `✅ تم إنشاء Backup #${backup.id}: **${backup.name}**`, ephemeral: true });
    }

    if (subcommand === 'list') {
      const backups = listBackups(interaction.guild.id);
      if (!backups.length) return interaction.reply({ content: '📦 ما كاين حتى Backup.', ephemeral: true });
      const text = backups.slice(0, 20).map(b => `#${b.id} — **${b.name}** — ${b.created_at}`).join('\n');
      return interaction.reply({ content: `📦 Backups:\n${text}`, ephemeral: true });
    }

    if (subcommand === 'info') {
      const backup = getBackup(interaction.guild.id, interaction.options.getInteger('id'));
      if (!backup) return interaction.reply({ content: '❌ Backup غير موجود أو الملف مفقود.', ephemeral: true });
      return interaction.reply({
        content: `📦 Backup #${backup.id}\n**Name:** ${backup.name}\n**Created:** ${backup.created_at}\n**Version:** ${backup.payload.version}`,
        ephemeral: true,
      });
    }

    const deleted = deleteBackup(interaction.guild.id, interaction.options.getInteger('id'));
    return interaction.reply({ content: deleted ? '🗑️ تم حذف Backup.' : '❌ Backup غير موجود.', ephemeral: true });
  },
};
