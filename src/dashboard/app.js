require('dotenv').config();
const express = require('express');
const session = require('express-session');
const crypto = require('node:crypto');

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
  res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Ano Dashboard</title><style>body{font-family:system-ui;max-width:900px;margin:60px auto;padding:20px}a{display:inline-block;padding:10px 16px;background:#5865f2;color:#fff;text-decoration:none;border-radius:8px}</style></head><body><h1>Ano Dashboard</h1><p>Dashboard backend is online.</p><a href="/auth/discord">Login with Discord</a></body></html>`);
});

app.get('/auth/discord', (_req, res) => {
  const clientId = process.env.CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  if (!clientId || !redirectUri) return res.status(503).send('Discord OAuth2 is not configured yet.');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds',
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

app.get('/auth/discord/callback', (_req, res) => {
  res.status(501).send('OAuth2 callback will be enabled in the next dashboard phase.');
});

module.exports = { app };

if (require.main === module) app.listen(port, () => console.log(`[DASHBOARD] Listening on ${port}`));
