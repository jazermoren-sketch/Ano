const { PermissionFlagsBits } = require('discord.js');
const { getSettings, addStrike } = require('./protectionService');
const { sendLog } = require('../logs/logService');

const messageHistory = new Map();
const joinHistory = new Map();

function isStaff(member) {
  return member?.permissions?.has(PermissionFlagsBits.ManageGuild) || member?.permissions?.has(PermissionFlagsBits.ManageMessages);
}

function rememberMessage(guildId, userId, now, windowMs) {
  const key = `${guildId}:${userId}`;
  const list = (messageHistory.get(key) || []).filter(t => now - t <= windowMs);
  list.push(now);
  messageHistory.set(key, list);
  return list.length;
}

async function punish(message, reason) {
  const member = message.member;
  if (!member || isStaff(member)) return;
  const strikes = addStrike(message.guild.id, member.id);
  await message.delete().catch(() => {});
  await sendLog(message.guild, {
    title: '🛡️ Protection Action',
    color: 0xed4245,
    fields: [
      { name: 'Member', value: `${member.user.tag} (${member.id})` },
      { name: 'Reason', value: reason },
      { name: 'Strikes', value: String(strikes), inline: true },
    ],
  });

  if (strikes >= 3 && member.moderatable) {
    await member.timeout(10 * 60 * 1000, `Protection: ${reason}`).catch(() => {});
  }
}

async function handleMessage(message) {
  if (!message.guild || message.author?.bot || !message.member) return;
  const settings = getSettings(message.guild.id);
  if (isStaff(message.member)) return;

  const now = Date.now();
  if (settings.anti_spam) {
    const count = rememberMessage(message.guild.id, message.author.id, now, settings.spam_window_seconds * 1000);
    if (count >= settings.spam_messages) return punish(message, 'Spam detected');
  }

  if (settings.anti_links && /(https?:\/\/|discord\.gg\/|www\.)/i.test(message.content)) {
    return punish(message, 'Unauthorized link detected');
  }

  if (settings.anti_mass_mentions) {
    const mentions = message.mentions.users.size + message.mentions.roles.size;
    if (message.mentions.everyone || mentions >= settings.max_mentions) {
      return punish(message, 'Mass mention detected');
    }
  }
}

async function handleJoin(member) {
  const settings = getSettings(member.guild.id);
  if (!settings.anti_raid) return;
  const now = Date.now();
  const list = (joinHistory.get(member.guild.id) || []).filter(t => now - t < 15_000);
  list.push(now);
  joinHistory.set(member.guild.id, list);
  if (list.length >= 8) {
    await sendLog(member.guild, {
      title: '🚨 Possible Raid Detected',
      color: 0xed4245,
      description: `تم رصد ${list.length} عمليات دخول خلال 15 ثانية.`
    });
  }
}

module.exports = { handleMessage, handleJoin };
