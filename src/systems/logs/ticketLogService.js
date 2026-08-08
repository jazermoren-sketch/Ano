const { EmbedBuilder } = require('discord.js');

function buildTicketLogEmbed(action, ticket = {}, actorId) {
  const labels = { create: 'Ticket Created', claim: 'Ticket Claimed', close: 'Ticket Closed', delete: 'Ticket Deleted' };
  return new EmbedBuilder()
    .setTitle(`🎫 ${labels[action] || 'Ticket Event'}`)
    .setDescription(`**Action:** ${action}\n**Ticket:** ${ticket.channelId || ticket.id || 'unknown'}\n**Actor:** ${actorId ? `<@${actorId}>` : 'Unknown'}`)
    .addFields(
      { name: 'Owner', value: ticket.ownerId ? `<@${ticket.ownerId}>` : 'Unknown', inline: true },
      { name: 'Status', value: ticket.status || 'unknown', inline: true },
      { name: 'Claimed By', value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : 'Not claimed', inline: true },
    )
    .setTimestamp();
}

async function sendTicketLog(channel, action, ticket, actorId) {
  if (!channel?.send) return null;
  return channel.send({ embeds: [buildTicketLogEmbed(action, ticket, actorId)] });
}

module.exports = { buildTicketLogEmbed, sendTicketLog };
