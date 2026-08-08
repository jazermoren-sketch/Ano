const { PermissionFlagsBits } = require('discord.js');
const { buildEmbed } = require('../systems/embeds/embedBuilder');

module.exports = {
  data: {
    name: 'embed',
    description: 'Create a custom embed.',
    default_member_permissions: PermissionFlagsBits.ManageMessages.toString(),
    options: [
      { type: 3, name: 'title', description: 'Embed title.', required: true },
      { type: 3, name: 'description', description: 'Embed description.', required: true },
      { type: 3, name: 'color', description: 'Hex color, e.g. #5865F2.', required: false },
      { type: 3, name: 'image', description: 'Image URL.', required: false },
      { type: 3, name: 'thumbnail', description: 'Thumbnail URL.', required: false },
      { type: 3, name: 'footer', description: 'Footer text.', required: false },
    ],
  },

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ content: '❌ تحتاج إلى صلاحية Manage Messages.', ephemeral: true });
    }

    const rawColor = interaction.options.getString('color') || '#5865F2';
    const color = /^#[0-9a-f]{6}$/i.test(rawColor) ? parseInt(rawColor.slice(1), 16) : 0x5865f2;
    const image = interaction.options.getString('image');
    const thumbnail = interaction.options.getString('thumbnail');

    const embed = buildEmbed({
      title: interaction.options.getString('title'),
      description: interaction.options.getString('description'),
      color,
      image: image && /^https?:\/\//i.test(image) ? image : undefined,
      thumbnail: thumbnail && /^https?:\/\//i.test(thumbnail) ? thumbnail : undefined,
      footer: interaction.options.getString('footer') || undefined,
    });

    await interaction.channel.send({ embeds: [embed] });
    return interaction.reply({ content: '✅ تم إرسال الـEmbed.', ephemeral: true });
  },
};
