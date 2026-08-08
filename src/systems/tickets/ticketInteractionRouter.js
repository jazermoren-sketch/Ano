const { Events } = require('discord.js');
const { buildTicketModal } = require('./ticketComponents');

function registerTicketInteractions(client, handlers = {}) {
  client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isStringSelectMenu() && interaction.customId === 'ano:ticket:create') {
      const type = interaction.values?.[0];
      if (!type) return;
      if (handlers.canCreate && !(await handlers.canCreate(interaction))) return;
      return interaction.showModal(buildTicketModal(type));
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('ano:ticket:modal:')) {
      const type = interaction.customId.split(':').pop();
      const data = {
        type,
        subject: interaction.fields.getTextInputValue('subject'),
        details: interaction.fields.getTextInputValue('details'),
      };
      if (handlers.create) return handlers.create(interaction, data);
      return interaction.reply({ content: 'Ticket handler is not configured yet.', ephemeral: true });
    }

    if (!interaction.isButton() || !interaction.customId.startsWith('ano:ticket:')) return;
    const [, , action, ticketId] = interaction.customId.split(':');
    if (!ticketId || !['claim', 'close', 'delete'].includes(action)) return;
    const handler = handlers[action];
    if (handler) return handler(interaction, ticketId);
    return interaction.reply({ content: `Ticket action \`${action}\` is not configured yet.`, ephemeral: true });
  });
}

module.exports = { registerTicketInteractions };
