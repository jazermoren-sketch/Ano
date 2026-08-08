const $ = (s) => document.querySelector(s);
const guildId = document.body.dataset.guildId;

async function request(path, body) {
  const r = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
}

async function save() {
  const whitelist = $('#whitelist').value
    .split(',')
    .map(x => x.trim())
    .filter(x => /^\d{17,20}$/.test(x))
    .slice(0, 100);

  const limits = {
    channelDelete: 3,
    roleDelete: 3,
    ban: 5,
    kick: 5,
  };

  const result = await request(`/api/servers/${guildId}/protection`, {
    enabled: $('#antiNuke').checked || $('#antiRaid').checked,
    whitelist,
    limits,
    windowMs: Math.max(1000, Number($('#raidLimit').dataset.windowMs || 10000)),
    auditMaxAgeMs: 15000,
  });

  $('#protectionStatus').textContent = result.ok ? 'Protection settings saved.' : 'Protection settings were not saved.';
}

document.addEventListener('DOMContentLoaded', () => {
  $('#saveProtectionAdvanced')?.addEventListener('click', () =>
    save().catch(e => { $('#protectionStatus').textContent = e.message; })
  );
});
