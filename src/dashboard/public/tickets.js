const $ = (s) => document.querySelector(s);
const guildId = document.body.dataset.guildId;
async function saveTickets() {
  const payload = {};
  for (const id of ['category_id','support_role_id','panel_channel_id','panel_message_id','log_channel_id']) payload[id] = $(`#${id}`).value.trim() || null;
  const r = await fetch(`/api/servers/${guildId}/tickets`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
  const data = await r.json(); if (!r.ok) throw new Error(data.error || 'Failed'); $('#ticketStatus').textContent = 'Ticket settings saved.';
}
document.addEventListener('DOMContentLoaded',()=>$('#saveTickets')?.addEventListener('click',()=>saveTickets().catch(e=>$('#ticketStatus').textContent=e.message)));
