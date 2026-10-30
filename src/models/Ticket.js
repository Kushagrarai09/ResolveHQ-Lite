const mongoose = require("mongoose");
const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  category: { type: String, enum: ["general", "billing", "technical", "account", "bug", "feature"], default: "general" },
  tags: { type: [String], default: [], validate: { validator: tags => tags.length <= 10 && tags.every(tag => typeof tag === "string" && tag.length <= 30), message: "A ticket may have up to 10 tags of 30 characters each." } },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  dueAt: { type: Date, default: null },
  resolvedAt: { type: Date, default: null }
}, { timestamps: true });
ticketSchema.index({ owner: 1, createdAt: -1 });
ticketSchema.index({ owner: 1, status: 1, priority: 1 });
ticketSchema.index({ assignedTo: 1, status: 1, dueAt: 1 });
ticketSchema.index({ owner: 1, dueAt: 1, status: 1 });
ticketSchema.index({ title: "text", description: "text" });
module.exports = mongoose.model("Ticket", ticketSchema);
