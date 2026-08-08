require('dotenv').config();

const { Client, GatewayIntentBits, Partials } = require('discord.js');

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

client.once('ready', () => {
  console.log(`[BOT] Logged in as ${client.user.tag}`);
  console.log(`[BOT] Ready in ${client.guilds.cache.size} guild(s).`);
});

client.on('error', (error) => {
  console.error('[DISCORD] Client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('[PROCESS] Unhandled rejection:', error);
});

if (!process.env.DISCORD_TOKEN) {
  console.error('Missing DISCORD_TOKEN in environment.');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
