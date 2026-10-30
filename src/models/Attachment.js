const mongoose = require("mongoose");
const attachmentSchema = new mongoose.Schema({
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fileName: { type: String, required: true, maxlength: 180 },
  mimeType: { type: String, required: true, enum: ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain", "application/zip"] },
  size: { type: Number, required: true, max: 5 * 1024 * 1024 },
  data: { type: Buffer, required: true, select: false }
}, { timestamps: true });
attachmentSchema.index({ ticket: 1, createdAt: 1 });
module.exports = mongoose.model("Attachment", attachmentSchema);
