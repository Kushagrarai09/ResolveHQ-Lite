const mongoose = require("mongoose");
const Ticket = require("../models/Ticket");
const Comment = require("../models/Comment");
const Activity = require("../models/Activity");
const User = require("../models/User");
const Attachment = require("../models/Attachment");
const { notifyTicketParticipants } = require("../services/notifications");

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const canSeeAllTickets = user => user.role === "admin";
const ticketAccessFilter = user => canSeeAllTickets(user)
  ? {}
  : user.role === "agent"
    ? { $or: [{ owner: user._id }, { assignedTo: user._id }] }
    : { owner: user._id };

async function findAccessibleTicket(ticketId, user, projection) {
  return Ticket.findOne({ _id: ticketId, ...ticketAccessFilter(user) }).select(projection || "");
}

async function recordActivity({ ticket, ticketId, actor, action, changes = [], snapshot }) {
  return Activity.create({ ticket: ticketId || ticket._id, actor, action, changes, ticketSnapshot: snapshot || (ticket ? { title: ticket.title } : undefined) });
}

function getChanges(before, after) {
  return ["title", "description", "status", "priority", "category", "dueAt", "assignedTo", "tags"]
    .filter(field => {
      const a = before[field] == null ? null : String(before[field]);
      const b = after[field] == null ? null : String(after[field]);
      return a !== b;
    })
    .map(field => ({ field, oldValue: before[field] == null ? "" : String(before[field]), newValue: after[field] == null ? "" : String(after[field]) }));
}

function snapshot(ticket) {
  return { title: ticket.title, description: ticket.description, status: ticket.status, priority: ticket.priority, category: ticket.category, tags: ticket.tags, owner: ticket.owner, assignedTo: ticket.assignedTo, dueAt: ticket.dueAt };
}

async function create(req, res, next) {
  try {
    const ticket = await Ticket.create({
      title: req.body.title, description: req.body.description, priority: req.body.priority || "medium",
      category: req.body.category || "general", tags: req.body.tags || [], status: "open",
      owner: req.user._id, dueAt: req.body.dueAt || null
    });
    await recordActivity({ ticket, actor: req.user._id, action: "ticket_created", changes: [
      { field: "title", newValue: ticket.title }, { field: "status", newValue: ticket.status }, { field: "priority", newValue: ticket.priority }
    ] });
    res.status(201).json({ success: true, data: { ticket } });
  } catch (error) { next(error); }
}

async function list(req, res, next) {
  try {
    const filter = { ...ticketAccessFilter(req.user) };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.tag) filter.tags = req.query.tag;
    if (req.query.overdue === "true") filter.dueAt = { $lt: new Date() }, filter.status = { $ne: "resolved" };
    if (req.query.overdue === "false") filter.$or = [...(filter.$or || []), { dueAt: null }, { dueAt: { $gte: new Date() } }, { status: "resolved" }];
    if (req.query.search) {
      const term = escapeRegex(req.query.search);
      const clauses = [
        { title: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } }
      ];
      if (mongoose.isValidObjectId(req.query.search)) clauses.push({ _id: new mongoose.Types.ObjectId(req.query.search) });
      const existingOr = filter.$or;
      filter.$and = [{ $or: clauses }];
      if (existingOr) filter.$and.push({ $or: existingOr });
      delete filter.$or;
    }
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const [tickets, total] = await Promise.all([
      Ticket.find(filter).populate("owner", "name email").populate("assignedTo", "name email role")
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Ticket.countDocuments(filter)
    ]);
    res.json({ success: true, data: { tickets, pagination: { total, page, limit, pages: Math.ceil(total / limit) } } });
  } catch (error) { next(error); }
}

async function getOne(req, res, next) {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, ...ticketAccessFilter(req.user) })
      .populate("owner", "name email").populate("assignedTo", "name email role");
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });
    res.json({ success: true, data: { ticket } });
  } catch (error) { next(error); }
}

async function update(req, res, next) {
  try {
    const allowed = {};
    for (const key of ["title", "description", "status", "priority", "category", "tags", "dueAt"]) {
      if (req.body[key] !== undefined) allowed[key] = req.body[key];
    }
    if (!Object.keys(allowed).length) return res.status(400).json({ success: false, message: "Provide at least one supported field to update." });
    const ticket = await findAccessibleTicket(req.params.id, req.user);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });
    const before = snapshot(ticket);
    const after = { ...before, ...allowed };
    const changes = getChanges(before, after);
    if (!changes.length) return res.json({ success: true, data: { ticket } });
    if (allowed.status === "resolved" && ticket.status !== "resolved") ticket.resolvedAt = new Date();
    if (allowed.status && allowed.status !== "resolved") ticket.resolvedAt = null;
    Object.assign(ticket, allowed);
    await ticket.save();
    await recordActivity({ ticket, actor: req.user._id, action: "ticket_updated", changes });
    await notifyTicketParticipants({ ticket, actor: req.user._id, type: "ticket_updated", message: `Ticket "${ticket.title}" was updated.` });
    res.json({ success: true, data: { ticket } });
  } catch (error) { next(error); }
}

async function remove(req, res, next) {
  try {
    const ticket = await Ticket.findOneAndDelete({ _id: req.params.id, ...ticketAccessFilter(req.user) });
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });
    await recordActivity({ ticketId: ticket._id, actor: req.user._id, action: "ticket_deleted", snapshot: { title: ticket.title } });
    await Promise.all([Comment.deleteMany({ ticket: ticket._id }), Attachment.deleteMany({ ticket: ticket._id })]);
    res.json({ success: true, message: "Ticket, comments and attachments deleted. Activity history retained." });
  } catch (error) { next(error); }
}

async function listActivity(req, res, next) {
  try {
    const ticket = await findAccessibleTicket(req.params.id, req.user, "_id");
    if (!ticket) {
      const deletion = await Activity.findOne({ ticket: req.params.id, actor: req.user._id, action: "ticket_deleted" }).select("_id");
      if (!deletion) return res.status(404).json({ success: false, message: "Ticket not found." });
    }
    const activities = await Activity.find({ ticket: req.params.id }).populate("actor", "name").sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: { activities } });
  } catch (error) { next(error); }
}

async function listComments(req, res, next) {
  try {
    const ticket = await findAccessibleTicket(req.params.id, req.user, "_id");
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });
    const comments = await Comment.find({ ticket: ticket._id }).populate("author", "name").sort({ createdAt: 1 });
    res.json({ success: true, data: { comments } });
  } catch (error) { next(error); }
}

async function addComment(req, res, next) {
  try {
    const ticket = await findAccessibleTicket(req.params.id, req.user, "_id title owner assignedTo");
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });
    const comment = await Comment.create({ ticket: ticket._id, author: req.user._id, text: req.body.text });
    await comment.populate("author", "name");
    await notifyTicketParticipants({ ticket, actor: req.user._id, type: "comment_added", message: `New comment on "${ticket.title}".` });
    res.status(201).json({ success: true, data: { comment } });
  } catch (error) { next(error); }
}

async function assign(req, res, next) {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, owner: req.user._id });
    if (!ticket && req.user.role !== "admin") return res.status(404).json({ success: false, message: "Ticket not found." });
    const targetTicket = ticket || await Ticket.findById(req.params.id);
    if (!targetTicket) return res.status(404).json({ success: false, message: "Ticket not found." });
    if (!["user", "admin"].includes(req.user.role)) return res.status(403).json({ success: false, message: "Only ticket owners and admins can assign tickets." });
    const agent = await User.findOne({ _id: req.body.assignedTo, role: { $in: ["agent", "admin"] } }).select("_id name role");
    if (!agent) return res.status(400).json({ success: false, message: "assignedTo must identify an existing agent or admin account." });
    const previous = targetTicket.assignedTo;
    targetTicket.assignedTo = agent._id;
    await targetTicket.save();
    await recordActivity({ ticket: targetTicket, actor: req.user._id, action: "ticket_updated", changes: [{ field: "assignedTo", oldValue: previous ? String(previous) : "", newValue: String(agent._id) }] });
    await notifyTicketParticipants({ ticket: targetTicket, actor: req.user._id, type: "ticket_assigned", message: `Ticket "${targetTicket.title}" was assigned to you.` });
    res.json({ success: true, data: { ticket: await targetTicket.populate("assignedTo", "name email role") } });
  } catch (error) { next(error); }
}

async function listOverdue(req, res, next) {
  try {
    const now = new Date();
    const tickets = await Ticket.find({ ...ticketAccessFilter(req.user), dueAt: { $lt: now }, status: { $ne: "resolved" } })
      .populate("owner", "name email").populate("assignedTo", "name email role").sort({ dueAt: 1 }).limit(100);
    res.json({ success: true, data: { tickets, count: tickets.length, asOf: now } });
  } catch (error) { next(error); }
}

async function addAttachment(req, res, next) {
  try {
    const ticket = await findAccessibleTicket(req.params.id, req.user, "_id");
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });
    const { fileName, mimeType, dataBase64 } = req.body;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain", "application/zip"];
    if (!fileName || typeof fileName !== "string" || fileName.length > 180 || /[\\/]/.test(fileName)) return res.status(400).json({ success: false, message: "Provide a safe fileName of at most 180 characters." });
    if (!allowedTypes.includes(mimeType)) return res.status(400).json({ success: false, message: "Unsupported attachment type." });
    if (typeof dataBase64 !== "string" || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(dataBase64)) return res.status(400).json({ success: false, message: "dataBase64 must be a valid base64 string." });
    const data = Buffer.from(dataBase64, "base64");
    if (!data.length || data.length > 5 * 1024 * 1024) return res.status(413).json({ success: false, message: "Attachment must be between 1 byte and 5 MB." });
    const attachment = await Attachment.create({ ticket: ticket._id, uploader: req.user._id, fileName, mimeType, size: data.length, data });
    res.status(201).json({ success: true, data: { attachment: { id: attachment.id, fileName, mimeType, size: data.length, createdAt: attachment.createdAt } } });
  } catch (error) { next(error); }
}

async function listAttachments(req, res, next) {
  try {
    const ticket = await findAccessibleTicket(req.params.id, req.user, "_id");
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });
    const attachments = await Attachment.find({ ticket: ticket._id }).select("-data").populate("uploader", "name").sort({ createdAt: 1 });
    res.json({ success: true, data: { attachments } });
  } catch (error) { next(error); }
}

async function downloadAttachment(req, res, next) {
  try {
    const ticket = await findAccessibleTicket(req.params.id, req.user, "_id");
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found." });
    const attachment = await Attachment.findOne({ _id: req.params.attachmentId, ticket: ticket._id }).select("+data");
    if (!attachment) return res.status(404).json({ success: false, message: "Attachment not found." });
    res.set({ "Content-Type": attachment.mimeType, "Content-Length": String(attachment.size), "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`, "X-Content-Type-Options": "nosniff" });
    res.send(attachment.data);
  } catch (error) { next(error); }
}

module.exports = { create, list, getOne, update, remove, listComments, addComment, listActivity, assign, listOverdue, addAttachment, listAttachments, downloadAttachment };
