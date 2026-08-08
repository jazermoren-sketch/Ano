const crypto = require('node:crypto');

const DISCORD_API = 'https://discord.com/api/v10';

function getOAuthConfig() {
  return {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: process.env.DISCORD_REDIRECT_URI,
  };
}

function buildAuthorizationUrl() {
  const { clientId, redirectUri } = getOAuthConfig();
  if (!clientId || !redirectUri) throw new Error('Discord OAuth2 is not configured.');
  const state = crypto.randomBytes(24).toString('hex');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds',
    state,
  });
  return { url: `https://discord.com/oauth2/authorize?${params}`, state };
}

async function exchangeCode(code) {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();
  if (!clientId || !clientSecret || !redirectUri) throw new Error('Discord OAuth2 credentials are incomplete.');
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });
  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) throw new Error(`OAuth token exchange failed: ${response.status}`);
  return response.json();
}

async function discordGet(path, accessToken) {
  const response = await fetch(`${DISCORD_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Discord API request failed: ${response.status}`);
  return response.json();
}

async function getIdentity(accessToken) { return discordGet('/users/@me', accessToken); }
async function getGuilds(accessToken) { return discordGet('/users/@me/guilds', accessToken); }

function canManageGuild(guild) {
  const permissions = BigInt(guild.permissions || 0);
  return guild.owner === true || (permissions & BigInt(0x20)) === BigInt(0x20);
}

module.exports = { buildAuthorizationUrl, exchangeCode, getIdentity, getGuilds, canManageGuild };
