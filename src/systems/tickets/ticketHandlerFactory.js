const { createTicketChannel, claimTicket, closeTicket, deleteTicket } = require('./ticketOperations');

function createTicketHandlers(options = {}) {
  return {
    canCreate: async interaction => Boolean(interaction.guild && interaction.member),
    create: async (interaction, data) => {
      try {
        const channel = await createTicketChannel(interaction, data, options);
        return interaction.reply({ content: `🎫 Ticket created: ${channel}`, ephemeral: true });
      } catch (error) {
        return interaction.reply({ content: `❌ ${error.message}`, ephemeral: true });
      }
    },
    claim: async (interaction, ticketId) => {
      const channel = interaction.guild?.channels.cache.get(ticketId);
      if (!channel) return interaction.reply({ content: '❌ Ticket channel not found.', ephemeral: true });
      return claimTicket(interaction, channel);
    },
    close: async (interaction, ticketId) => {
      const channel = interaction.guild?.channels.cache.get(ticketId);
      if (!channel) return interaction.reply({ content: '❌ Ticket channel not found.', ephemeral: true });
      return closeTicket(interaction, channel);
    },
    delete: async (interaction, ticketId) => {
      const channel = interaction.guild?.channels.cache.get(ticketId);
      if (!channel) return interaction.reply({ content: '❌ Ticket channel not found.', ephemeral: true });
      return deleteTicket(interaction, channel);
    },
  };
}

module.exports = { createTicketHandlers };
