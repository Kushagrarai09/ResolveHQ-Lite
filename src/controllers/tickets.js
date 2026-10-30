const Ticket = require("../models/Ticket");
const Comment = require("../models/Comment");
const Activity = require("../models/Activity");

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function recordActivity({ ticket, ticketId, actor, action, changes = [], snapshot }) {
  return Activity.create({
    ticket: ticketId || ticket._id,
    actor,
    action,
    changes,
    ticketSnapshot: snapshot || (ticket ? { title: ticket.title } : undefined)
  });
}

function getChanges(before, after) {
  return ["title", "description", "status", "priority"]
    .filter(field => before[field] !== after[field])
    .map(field => ({ field, oldValue: before[field], newValue: after[field] }));
}

async function create(req, res, next) {
  try {
    const ticket = await Ticket.create({ title: req.body.title, description: req.body.description, priority: req.body.priority || "medium", status: "open", owner: req.user._id });
    await recordActivity({ ticket, actor: req.user._id, action: "ticket_created", changes: [
      { field: "title", newValue: ticket.title }, { field: "status", newValue: ticket.status }, { field: "priority", newValue: ticket.priority }
    ] });
    res.status(201).json({ success: true, data: { ticket } });
  } catch (error) { next(error); }
}

async function list(req, res, next) {
  try {
    const filter = { owner: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.search) filter.title = { $regex: escapeRegex(req.query.search), $options: "i" };
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const [tickets, total] = await Promise.all([Ticket.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Ticket.countDocuments(filter)]);
    res.json({ success: true, data: { tickets, pagination: { total, page, limit, pages: Math.ceil(total / limit) } } });
  } catch (error) { next(error); }
}

async function getOne(req, res, next) {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, owner: req.user._id });
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });
    res.json({ success: true, data: { ticket } });
  } catch (error) { next(error); }
}

async function update(req, res, next) {
  try {
    const allowed = {};
    for (const key of ["title", "description", "status", "priority"]) if (req.body[key] !== undefined) allowed[key] = req.body[key];
    if (!Object.keys(allowed).length) return res.status(400).json({ success: false, message: "Provide at least one supported field to update." });
    const ticket = await Ticket.findOne({ _id: req.params.id, owner: req.user._id });
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });
    const before = { title: ticket.title, description: ticket.description, status: ticket.status, priority: ticket.priority };
    const changes = getChanges(before, { ...before, ...allowed });
    if (!changes.length) return res.json({ success: true, data: { ticket } });
    Object.assign(ticket, allowed);
    await ticket.save();
    await recordActivity({ ticket, actor: req.user._id, action: "ticket_updated", changes });
    res.json({ success: true, data: { ticket } });
  } catch (error) { next(error); }
}

async function remove(req, res, next) {
  try {
    const ticket = await Ticket.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });
    await recordActivity({ ticketId: ticket._id, actor: req.user._id, action: "ticket_deleted", snapshot: { title: ticket.title } });
    await Comment.deleteMany({ ticket: ticket._id });
    res.json({ success: true, message: "Ticket and comments deleted. Activity history retained." });
  } catch (error) { next(error); }
}

async function listActivity(req, res, next) {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, owner: req.user._id }).select("_id");
    if (!ticket) {
      const deletion = await Activity.findOne({ ticket: req.params.id, actor: req.user._id, action: "ticket_deleted" }).select("_id");
      if (!deletion) return res.status(404).json({ success: false, message: "Ticket not found." });
    }
    const activities = await Activity.find({ ticket: req.params.id }).populate("actor", "name").sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: { activities } });
  } catch (error) { next(error); }
}

async function listComments(req, res, next) {
  try { const ticket = await Ticket.findOne({ _id: req.params.id, owner: req.user._id }).select("_id"); if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." }); const comments = await Comment.find({ ticket: ticket._id }).populate("author", "name").sort({ createdAt: 1 }); res.json({ success: true, data: { comments } }); }
  catch (error) { next(error); }
}

async function addComment(req, res, next) {
  try { const ticket = await Ticket.findOne({ _id: req.params.id, owner: req.user._id }).select("_id"); if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." }); const comment = await Comment.create({ ticket: ticket._id, author: req.user._id, text: req.body.text }); await comment.populate("author", "name"); res.status(201).json({ success: true, data: { comment } }); }
  catch (error) { next(error); }
}

module.exports = { create, list, getOne, update, remove, listComments, addComment, listActivity };
