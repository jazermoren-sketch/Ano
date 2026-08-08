require('dotenv').config();
const express = require('express');
const session = require('express-session');
const crypto = require('node:crypto');
const { buildAuthorizationUrl, exchangeCode, getIdentity, getGuilds, canManageGuild } = require('./oauth');
const dashboardRoutes = require('./routes');

const app = express();
const port = Number(process.env.PORT || 3000);
app.set('view engine', 'ejs');
app.use('/static', express.static(require('node:path').join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'), resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' } }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'Ano Dashboard' }));
app.get('/', (req, res) => req.session.user ? res.redirect('/servers') : res.send('<!doctype html><html><body style="font-family:system-ui;max-width:900px;margin:60px auto"><h1>Ano Dashboard</h1><p>Manage your Discord servers.</p><a href="/auth/discord">Login with Discord</a></body></html>'));
app.get('/auth/discord', (req, res) => { try { const { url, state } = buildAuthorizationUrl(); req.session.oauthState = state; res.redirect(url); } catch (e) { res.status(503).send(e.message); } });
app.get('/auth/discord/callback', async (req, res) => { try { if (!req.query.code || !req.query.state || req.query.state !== req.session.oauthState) return res.status(400).send('Invalid OAuth2 state or authorization code.'); delete req.session.oauthState; const token = await exchangeCode(req.query.code); req.session.user = await getIdentity(token.access_token); req.session.guilds = (await getGuilds(token.access_token)).filter(canManageGuild); req.session.accessToken = token.access_token; res.redirect('/servers'); } catch (e) { console.error('[DASHBOARD] OAuth error:', e); res.status(500).send('Discord login failed.'); } });
app.get('/servers', (req, res) => { if (!req.session.user) return res.redirect('/auth/discord'); const guilds = req.session.guilds || []; const items = guilds.map(g => `<li><strong>${String(g.name).replace(/[<>]/g, '')}</strong> — <a href="/servers/${encodeURIComponent(g.id)}">Manage</a></li>`).join(''); res.send(`<!doctype html><html><body style="font-family:system-ui;max-width:900px;margin:40px auto"><h1>Welcome, ${String(req.session.user.username).replace(/[<>]/g, '')}</h1><h2>Servers</h2><ul>${items || '<li>No manageable servers found.</li>'}</ul><a href="/logout">Logout</a></body></html>`); });
app.get('/servers/:guildId', (req, res) => { if (!req.session.user) return res.redirect('/auth/discord'); const guild = (req.session.guilds || []).find(g => g.id === req.params.guildId); if (!guild) return res.status(403).send('You cannot manage this server.'); const id = encodeURIComponent(guild.id); const safeName = String(guild.name).replace(/[<>]/g, ''); res.send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/static/dashboard.css"><title>Ano — ${safeName}</title></head><body><div class="layout"><aside class="sidebar"><div class="brand">🤖 Ano</div><div class="server">${safeName}</div><nav class="nav"><a class="active" href="/servers/${id}">Overview</a><a href="/servers/${id}?tab=tickets">🎫 Tickets</a><a href="/servers/${id}?tab=protection">🛡️ Protection</a><a href="/servers/${id}?tab=logs">📋 Logs</a><a href="/servers/${id}?tab=backups">💾 Backups</a></nav></aside><main class="content"><div class="topbar"><h1>Server Dashboard</h1><a href="/logout">Logout</a></div><div class="grid"><div class="card"><h3>🎫 Tickets</h3><p class="muted">Configure categories, staff role and panel.</p></div><div class="card"><h3>🛡️ Protection</h3><p class="muted">Anti-spam, links, mentions and raid detection.</p></div><div class="card"><h3>📋 Logs</h3><p class="muted">Centralized server activity logs.</p></div><div class="card"><h3>💾 Backups</h3><p class="muted">Save and manage bot configuration backups.</p></div></div><div class="card" style="margin-top:16px"><h3>Configuration API</h3><p class="muted">Dashboard configuration endpoints are active for this server.</p><code>GET /api/servers/${id}/settings</code></div></main></div><script src="/static/dashboard.js"></script></body></html>`); });
app.get('/logout', (req, res) => req.session.destroy(() => res.redirect('/')));
app.use('/api', dashboardRoutes);
module.exports = { app };
if (require.main === module) app.listen(port, () => console.log(`[DASHBOARD] Listening on ${port}`));
