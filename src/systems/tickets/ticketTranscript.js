const fs = require('node:fs');
const path = require('node:path');

async function collectMessages(channel) {
  const messages = [];
  let before;
  while (true) {
    const batch = await channel.messages.fetch({ limit: 100, before });
    if (!batch.size) break;
    messages.push(...batch.values());
    if (batch.size < 100) break;
    before = batch.last().id;
  }
  return messages.reverse();
}

async function createTranscript(channel, outputDir = path.join(process.cwd(), 'data', 'transcripts')) {
  const messages = await collectMessages(channel);
  fs.mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, `${channel.id}.html`);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c]));
  const body = messages.map(m => `<article><b>${esc(m.author?.tag || m.author?.username || 'Unknown')}</b> <time>${esc(m.createdAt?.toISOString?.() || '')}</time><p>${esc(m.content || '[attachment/embed/component]')}</p></article>`).join('\n');
  fs.writeFileSync(filePath, `<!doctype html><meta charset="utf-8"><title>Ticket ${esc(channel.name)}</title><h1>${esc(channel.name)}</h1>${body}`, 'utf8');
  return filePath;
}

module.exports = { createTranscript };
