const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  // Keep the ObjectId value without a Ticket ref so history survives ticket deletion.
  ticket: { type: mongoose.Schema.Types.ObjectId, required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, enum: ["ticket_created", "ticket_updated", "ticket_deleted"], required: true },
  changes: [{
    field: { type: String, enum: ["title", "description", "status", "priority"], required: true },
    oldValue: { type: String },
    newValue: { type: String }
  }],
  ticketSnapshot: { title: { type: String, maxlength: 120 } }
}, { timestamps: true, versionKey: false });

activitySchema.index({ ticket: 1, createdAt: -1 });
module.exports = mongoose.model("Activity", activitySchema);
