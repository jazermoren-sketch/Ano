const { EmbedBuilder } = require('discord.js');

function buildEmbed({ title, description, color = 0x5865f2, image, thumbnail, footer, author, url, fields = [] }) {
  const embed = new EmbedBuilder().setColor(color).setTimestamp();
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (url) embed.setURL(url);
  if (image) embed.setImage(image);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (footer) embed.setFooter({ text: footer });
  if (author) embed.setAuthor({ name: author });
  if (fields.length) embed.addFields(fields);
  return embed;
}

module.exports = { buildEmbed };
