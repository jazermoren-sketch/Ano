require('dotenv').config();
const express = require('express');
const session = require('express-session');
const crypto = require('node:crypto');
const path = require('node:path');
const { buildAuthorizationUrl, exchangeCode, getIdentity, getGuilds, canManageGuild } = require('./oauth');
const dashboardRoutes = require('./routes');

const app = express();
const port = Number(process.env.PORT || 3000);

app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
}));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'Ano Dashboard' }));

app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/servers');
  res.send('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ano Dashboard</title></head><body><main style="max-width:720px;margin:80px auto;font-family:system-ui;padding:24px"><h1>🤖 Ano Dashboard</h1><p>Manage your Discord server from one place.</p><a href="/auth/discord">Login with Discord</a></main></body></html>');
});

app.get('/auth/discord', (req, res) => {
  try {
    const x = buildAuthorizationUrl();
    req.session.oauthState = x.state;
    res.redirect(x.url);
  } catch (e) {
    res.status(503).send(e.message);
  }
});

app.get('/auth/discord/callback', async (req, res) => {
  try {
    if (!req.query.code || req.query.state !== req.session.oauthState) {
      return res.status(400).send('Invalid OAuth2 state.');
    }
    delete req.session.oauthState;
    const token = await exchangeCode(req.query.code);
    req.session.user = await getIdentity(token.access_token);
    req.session.guilds = (await getGuilds(token.access_token)).filter(canManageGuild);
    res.redirect('/servers');
  } catch (e) {
    console.error('[DASHBOARD] Discord login failed:', e);
    res.status(500).send('Discord login failed. Check OAuth configuration.');
  }
});

app.get('/servers', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/discord');
  const items = (req.session.guilds || [])
    .map(g => `<li>${String(g.name).replace(/[<>]/g, '')} — <a href="/servers/${encodeURIComponent(g.id)}">Manage</a></li>`)
    .join('');
  res.send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ano Servers</title></head><body><main style="max-width:720px;margin:40px auto;font-family:system-ui;padding:24px"><h1>Welcome, ${String(req.session.user.username).replace(/[<>]/g, '')}</h1><ul>${items || '<li>No manageable servers.</li>'}</ul><p><a href="/logout">Logout</a></p></main></body></html>`);
});

app.get('/servers/:guildId', (req, res) => {
  if (!req.session.user) return res.redirect('/auth/discord');
  const guild = (req.session.guilds || []).find(g => g.id === req.params.guildId);
  if (!guild) return res.status(403).send('You cannot manage this server.');

  const id = encodeURIComponent(guild.id);
  const safe = String(guild.name).replace(/[<>]/g, '');

  res.send(`<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/static/dashboard.css">
<title>Ano Dashboard — ${safe}</title>
</head>
<body data-guild-id="${id}">
<div class="layout">
  <aside class="sidebar">
    <div class="brand">🤖 Ano</div>
    <div class="server">${safe}</div>
    <nav class="nav">
      <a href="#tickets">🎫 Tickets</a>
      <a href="#protection">🛡️ Protection</a>
      <a href="#logs">📋 Logs</a>
      <a href="#embeds">🖼️ Embeds</a>
      <a href="#backups">💾 Backups</a>
    </nav>
  </aside>
  <main class="content">
    <div class="topbar"><h1>${safe}</h1><a href="/logout">Logout</a></div>

    <section class="card" id="tickets">
      <h2>🎫 Tickets</h2>
      <label>Category ID<input class="input" id="category_id" placeholder="Discord ID"></label>
      <label>Support Role ID<input class="input" id="support_role_id" placeholder="Discord ID"></label>
      <label>Panel Channel ID<input class="input" id="panel_channel_id" placeholder="Discord ID"></label>
      <label>Panel Message ID<input class="input" id="panel_message_id" placeholder="Discord ID"></label>
      <label>Ticket Log Channel ID<input class="input" id="log_channel_id" placeholder="Discord ID"></label>
      <button class="btn" id="saveTickets">Save Tickets</button>
      <p id="ticketStatus" class="muted"></p>
    </section>

    <section class="card" id="protection" style="margin-top:16px">
      <h2>🛡️ Protection</h2>
      <label class="switch"><span>Enable Protection</span><input id="protectionEnabled" type="checkbox" checked></label>
      <label>Whitelist User IDs<input class="input" id="whitelist" placeholder="123...,456..."></label>
      <label>Action Window (ms)<input class="input" id="protectionWindow" type="number" min="1000" value="10000"></label>
      <label>Audit Log Max Age (ms)<input class="input" id="auditMaxAge" type="number" min="1000" value="15000"></label>
      <button class="btn" id="saveProtectionAdvanced">Save Protection</button>
      <p id="protectionStatus" class="muted"></p>
    </section>

    <section class="card" id="logs" style="margin-top:16px">
      <h2>📋 Logs</h2>
      <label>Log Channel ID<input class="input" id="dashboardLogChannel" placeholder="Discord channel ID"></label>
      <label class="switch"><span>Enable Logs</span><input id="logsEnabled" type="checkbox" checked></label>
      <button class="btn" id="saveLogs">Save Logs</button>
      <p id="logsStatus" class="muted"></p>
    </section>

    <section class="card" id="embeds" style="margin-top:16px">
      <h2>🖼️ Embeds</h2>
      <label>Embed Name<input class="input" id="embedName" placeholder="welcome"></label>
      <label>Title<input class="input" id="embedTitle"></label>
      <label>Description<textarea class="input" id="embedDescription" rows="4"></textarea></label>
      <label>Color<input class="input" id="embedColor" value="0x5865f2"></label>
      <label>Send to Channel ID<input class="input" id="embedChannelId" placeholder="Discord channel ID"></label>
      <button class="btn" id="saveEmbed">Save Embed</button>
      <button class="btn" id="sendEmbed">Send Embed</button>
      <button class="btn" id="deleteEmbed">Delete Embed</button>
      <p id="embedStatus" class="muted"></p>
      <ul id="embedList"></ul>
    </section>

    <section class="card" id="backups" style="margin-top:16px">
      <h2>💾 Backups</h2>
      <button class="btn" id="createBackup">Create Backup</button>
      <p id="backupStatus" class="muted"></p>
      <ul id="backupList"></ul>
    </section>
  </main>
</div>
<script src="/static/settings.js"></script>
<script src="/static/tickets.js"></script>
<script src="/static/protection.js"></script>
</body>
</html>`);
});

app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));
app.use('/api', dashboardRoutes);

module.exports = { app };

if (require.main === module) {
  app.listen(port, () => console.log(`[DASHBOARD] Listening on ${port}`));
}
