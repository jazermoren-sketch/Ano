require('dotenv').config();
const express = require('express');
const session = require('express-session');
const crypto = require('node:crypto');
const { buildAuthorizationUrl, exchangeCode, getIdentity, getGuilds, canManageGuild } = require('./oauth');

const app = express();
const port = Number(process.env.PORT || 3000);

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' },
}));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'Ano Dashboard' }));

app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Ano Dashboard</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui;max-width:900px;margin:60px auto;padding:20px}a{display:inline-block;padding:10px 16px;background:#5865f2;color:#fff;text-decoration:none;border-radius:8px}</style></head><body><h1>Ano Dashboard</h1><p>Manage your Discord servers from one place.</p><a href="/auth/discord">Login with Discord</a></body></html>`);
  }
  return res.redirect('/servers');
});

app.get('/auth/discord', (req, res) => {
  try {
    const { url, state } = buildAuthorizationUrl();
    req.session.oauthState = state;
    res.redirect(url);
  } catch (error) {
    res.status(503).send(error.message);
  }
});

app.get('/auth/discord/callback', async (req, res) => {
  try {
    if (!req.query.code || !req.query.state || req.query.state !== req.session.oauthState) {
      return res.status(400).send('Invalid OAuth2 state or authorization code.');
    }
    delete req.session.oauthState;
    const token = await exchangeCode(req.query.code);
    const user = await getIdentity(token.access_token);
    const guilds = await getGuilds(token.access_token);
    req.session.user = user;
    req.session.guilds = guilds.filter(canManageGuild);
    req.session.accessToken = token.access_token;
    return res.redirect('/servers');
  } catch (error) {
    console.error('[DASHBOARD] OAuth error:', error);
    return res.status(500).send('Discord login failed.');
  }
});

app.get('/servers', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/discord');
  const guilds = req.session.guilds || [];
  const items = guilds.map(g => `<li><strong>${g.name}</strong> <small>(${g.id})</small> — <a href="/servers/${encodeURIComponent(g.id)}">Manage</a></li>`).join('');
  res.send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ano Servers</title></head><body><main style="max-width:900px;margin:40px auto;font-family:system-ui"><h1>Welcome, ${String(req.session.user.username).replace(/[<>]/g, '')}</h1><h2>Your manageable servers</h2><ul>${items || '<li>No manageable servers found.</li>'}</ul><p><a href="/logout">Logout</a></p></main></body></html>`);
});

app.get('/servers/:guildId', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/discord');
  const guild = (req.session.guilds || []).find(g => g.id === req.params.guildId);
  if (!guild) return res.status(403).send('You cannot manage this server.');
  res.send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ano — ${guild.name}</title></head><body><main style="max-width:900px;margin:40px auto;font-family:system-ui"><h1>${String(guild.name).replace(/[<>]/g, '')}</h1><p>Server dashboard access verified.</p><p>Tickets • Protection • Logs • Embeds • Backups</p><a href="/servers">← Servers</a></main></body></html>`);
});

app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));

module.exports = { app };

if (require.main === module) app.listen(port, () => console.log(`[DASHBOARD] Listening on ${port}`));
