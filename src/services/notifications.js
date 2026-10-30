const Notification = require("../models/Notification");

async function notify({ recipient, actor, ticket, type, message }) {
  if (!recipient || String(recipient) === String(actor)) return null;
  return Notification.create({ recipient, actor, ticket, type, message });
}

async function notifyTicketParticipants({ ticket, actor, type, message }) {
  const recipients = new Set([String(ticket.owner)]);
  if (ticket.assignedTo) recipients.add(String(ticket.assignedTo));
  recipients.delete(String(actor));
  return Promise.all([...recipients].map(recipient => notify({ recipient, actor, ticket: ticket._id, type, message })));
}

module.exports = { notify, notifyTicketParticipants };
