const tickets = new Map();

function createTicket(data) {
  const id = String(data.channelId);
  const ticket = { id, guildId: String(data.guildId), channelId: id, ownerId: String(data.ownerId), type: String(data.type || 'general'), subject: String(data.subject || '').slice(0, 100), status: 'open', claimedBy: null, createdAt: new Date().toISOString(), closedAt: null };
  tickets.set(id, ticket);
  return ticket;
}

function getTicket(id) { return tickets.get(String(id)) || null; }
function claimTicketRecord(id, userId) { const t = getTicket(id); if (!t || t.status !== 'open') return null; t.claimedBy = String(userId); return t; }
function closeTicketRecord(id) { const t = getTicket(id); if (!t) return null; t.status = 'closed'; t.closedAt = new Date().toISOString(); return t; }
function deleteTicketRecord(id) { return tickets.delete(String(id)); }

module.exports = { createTicket, getTicket, claimTicketRecord, closeTicketRecord, deleteTicketRecord };
