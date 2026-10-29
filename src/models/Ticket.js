const mongoose = require("mongoose");
const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
ticketSchema.index({ owner: 1, createdAt: -1 });
ticketSchema.index({ owner: 1, status: 1, priority: 1 });
module.exports = mongoose.model("Ticket", ticketSchema);
