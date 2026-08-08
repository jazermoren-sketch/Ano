const { createTicketChannel, claimTicket, closeTicket, deleteTicket } = require('./ticketOperations');

function createTicketHandlers(options = {}) {
  return {
    canCreate: async interaction => Boolean(interaction.guild && interaction.member),
    create: async (interaction, data) => {
      try {
        const result = await createTicketChannel(interaction, data, options);
        return interaction.reply({ content: `🎫 Ticket created: ${result.channel}`, ephemeral: true });
      } catch (error) {
        return interaction.reply({ content: `❌ ${error.message}`, ephemeral: true });
      }
    },
    claim: async (interaction, ticketId) => {
      const channel = interaction.guild?.channels.cache.get(ticketId);
      if (!channel) return interaction.reply({ content: '❌ Ticket channel not found.', ephemeral: true });
      try { return claimTicket(interaction, channel); } catch (error) { return interaction.reply({ content: `❌ ${error.message}`, ephemeral: true }); }
    },
    close: async (interaction, ticketId) => {
      const channel = interaction.guild?.channels.cache.get(ticketId);
      if (!channel) return interaction.reply({ content: '❌ Ticket channel not found.', ephemeral: true });
      try { return closeTicket(interaction, channel); } catch (error) { return interaction.reply({ content: `❌ ${error.message}`, ephemeral: true }); }
    },
    delete: async (interaction, ticketId) => {
      const channel = interaction.guild?.channels.cache.get(ticketId);
      if (!channel) return interaction.reply({ content: '❌ Ticket channel not found.', ephemeral: true });
      try { return deleteTicket(interaction, channel); } catch (error) { return interaction.reply({ content: `❌ ${error.message}`, ephemeral: true }); }
    },
  };
}

module.exports = { createTicketHandlers };
