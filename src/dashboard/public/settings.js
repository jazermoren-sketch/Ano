const $ = (s) => document.querySelector(s);
const guildId = document.body.dataset.guildId;

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[c]));
}

async function load() {
  const data = await request(`/api/servers/${guildId}/settings`);
  const tickets = data.dashboard?.tickets || data.tickets || {};
  const protection = data.protection || {};
  const logs = data.dashboard?.logs || data.logs || {};

  for (const key of ['category_id', 'support_role_id', 'panel_channel_id', 'panel_message_id', 'log_channel_id']) {
    const el = $(`#${key}`);
    if (el) el.value = tickets[key] || '';
  }

  if ($('#protectionEnabled')) $('#protectionEnabled').checked = protection.enabled !== false;
  if ($('#whitelist')) $('#whitelist').value = (protection.whitelist || []).join(',');
  if ($('#protectionWindow')) $('#protectionWindow').value = protection.windowMs || 10000;
  if ($('#auditMaxAge')) $('#auditMaxAge').value = protection.auditMaxAgeMs || 15000;

  if ($('#dashboardLogChannel')) $('#dashboardLogChannel').value = logs.channel_id || '';
  if ($('#logsEnabled')) $('#logsEnabled').checked = logs.enabled !== false;

  renderEmbeds(data.embeds || []);
  renderBackups(data.backups || []);
}

async function saveLogs() {
  const enabled = $('#logsEnabled').checked;
  const channelId = $('#dashboardLogChannel').value.trim();
  const data = await request(`/api/servers/${guildId}/logs`, {
    method: 'POST',
    body: JSON.stringify(enabled ? { enabled: true, channelId } : { enabled: false }),
  });
  $('#logsStatus').textContent = data.ok ? 'Logs settings saved.' : 'Logs settings were not saved.';
}

function renderEmbeds(embeds) {
  const list = $('#embedList');
  if (!list) return;
  list.innerHTML = embeds.length
    ? embeds.map(name => `<li><button type="button" class="embed-select" data-name="${escapeHtml(name)}">${escapeHtml(name)}</button></li>`).join('')
    : '<li>No embeds yet.</li>';
  list.querySelectorAll('.embed-select').forEach(button => {
    button.addEventListener('click', () => loadEmbed(button.dataset.name).catch(e => { $('#embedStatus').textContent = e.message; }));
  });
}

async function loadEmbed(name) {
  const data = await request(`/api/servers/${guildId}/embeds/${encodeURIComponent(name)}`);
  const payload = data.embed?.payload || {};
  $('#embedName').value = name;
  $('#embedTitle').value = payload.title || '';
  $('#embedDescription').value = payload.description || '';
  $('#embedColor').value = payload.color ?? '0x5865f2';
  $('#embedStatus').textContent = `Loaded embed: ${name}`;
}

function getEmbedPayload() {
  return {
    title: $('#embedTitle').value.trim(),
    description: $('#embedDescription').value,
    color: $('#embedColor').value.trim() || '0x5865f2',
  };
}

async function saveEmbed() {
  const name = $('#embedName').value.trim();
  if (!name) throw new Error('Embed name is required.');
  const data = await request(`/api/servers/${guildId}/embeds/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify(getEmbedPayload()),
  });
  $('#embedStatus').textContent = `Embed "${name}" saved.`;
  await refreshSettings(data);
}

async function sendEmbed() {
  const name = $('#embedName').value.trim();
  const channelId = $('#embedChannelId').value.trim();
  if (!name || !channelId) throw new Error('Embed name and channel ID are required.');
  await request(`/api/servers/${guildId}/embeds/${encodeURIComponent(name)}/send`, {
    method: 'POST',
    body: JSON.stringify({ channelId }),
  });
  $('#embedStatus').textContent = `Embed "${name}" sent.`;
}

async function deleteEmbed() {
  const name = $('#embedName').value.trim();
  if (!name) throw new Error('Embed name is required.');
  if (!window.confirm(`Delete embed "${name}"?`)) return;
  await request(`/api/servers/${guildId}/embeds/${encodeURIComponent(name)}`, { method: 'DELETE' });
  $('#embedStatus').textContent = `Embed "${name}" deleted.`;
  await load();
}

async function createBackup() {
  const data = await request(`/api/servers/${guildId}/backups`, { method: 'POST', body: JSON.stringify({}) });
  $('#backupStatus').textContent = `Backup created: ${data.backup.filename}`;
  await load();
}

function renderBackups(backups) {
  const list = $('#backupList');
  if (!list) return;
  list.innerHTML = backups.length
    ? backups.map(filename => `<li><code>${escapeHtml(filename)}</code> <button type="button" class="restore-backup" data-filename="${escapeHtml(filename)}">Restore</button></li>`).join('')
    : '<li>No backups yet.</li>';
  list.querySelectorAll('.restore-backup').forEach(button => {
    button.addEventListener('click', () => restoreBackup(button.dataset.filename).catch(e => { $('#backupStatus').textContent = e.message; }));
  });
}

async function restoreBackup(filename) {
  if (!window.confirm(`Restore backup "${filename}"? This will overwrite matching guild settings.`)) return;
  const dryRun = await request(`/api/servers/${guildId}/backups/${encodeURIComponent(filename)}/restore`, {
    method: 'POST',
    body: JSON.stringify({ dryRun: true }),
  });
  if (!dryRun.ok) throw new Error('Backup validation failed.');
  if (!window.confirm(`Validation passed for "${filename}". Continue with restore?`)) return;
  await request(`/api/servers/${guildId}/backups/${encodeURIComponent(filename)}/restore`, {
    method: 'POST',
    body: JSON.stringify({ dryRun: false }),
  });
  $('#backupStatus').textContent = `Backup restored: ${filename}`;
  await load();
}

async function refreshSettings(data) {
  if (data?.embed) {
    $('#embedStatus').textContent = `Embed "${data.embed.name}" saved.`;
  }
  await load();
}

document.addEventListener('DOMContentLoaded', () => {
  $('#saveLogs')?.addEventListener('click', () => saveLogs().catch(e => { $('#logsStatus').textContent = e.message; }));
  $('#saveEmbed')?.addEventListener('click', () => saveEmbed().catch(e => { $('#embedStatus').textContent = e.message; }));
  $('#sendEmbed')?.addEventListener('click', () => sendEmbed().catch(e => { $('#embedStatus').textContent = e.message; }));
  $('#deleteEmbed')?.addEventListener('click', () => deleteEmbed().catch(e => { $('#embedStatus').textContent = e.message; }));
  $('#createBackup')?.addEventListener('click', () => createBackup().catch(e => { $('#backupStatus').textContent = e.message; }));
  load().catch(e => {
    const target = $('#backupStatus') || $('#status');
    if (target) target.textContent = e.message;
  });
});
