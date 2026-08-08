require('dotenv').config();

const { Client, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const ticketCommand = require('./commands/ticket');
const interactionCreate = require('./events/interactionCreate');
const { ensureTicketTables } = require('./systems/tickets/ticketService');
const { ensureProtectionTable } = require('./systems/protection/protectionSettings');
const { registerProtectionEvents } = require('./systems/protection/protectionEvents');
const { app: dashboardApp } = require('./dashboard/app');

ensureTicketTables();
ensureProtectionTable();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel, Partials.GuildMember, Partials.Message, Partials.User],
});

dashboardApp.locals.discordClient = client;
registerProtectionEvents(client);

client.once('ready', async () => {
  console.log(`[BOT] Logged in as ${client.user.tag}`);
  console.log(`[BOT] Ready in ${client.guilds.cache.size} guild(s).`);

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
    body: [ticketCommand.data],
  });
  console.log('[COMMANDS] Registered application commands.');
});

client.on('interactionCreate', interactionCreate);
client.on('error', error => console.error('[DISCORD] Client error:', error));
process.on('unhandledRejection', error => console.error('[PROCESS] Unhandled rejection:', error));
process.on('uncaughtException', error => console.error('[PROCESS] Uncaught exception:', error));

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID in environment.');
  process.exit(1);
}

if (process.env.DASHBOARD_ENABLED !== 'false') {
  const dashboardPort = Number(process.env.DASHBOARD_PORT || process.env.PORT || 3000);
  dashboardApp.listen(dashboardPort, () => console.log(`[DASHBOARD] Listening on ${dashboardPort}`));
}

client.login(process.env.DISCORD_TOKEN);
