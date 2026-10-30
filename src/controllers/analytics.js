const Ticket = require("../models/Ticket");
const STATUS_KEYS = ["open", "in_progress", "resolved"];
const PRIORITY_KEYS = ["low", "medium", "high"];

async function overview(req, res, next) {
  try {
    const [summary] = await Ticket.aggregate([
      { $match: { $or: [{ owner: req.user._id }, { assignedTo: req.user._id }], ...(req.user.role === "admin" ? {} : {}) } },
      { $group: {
        _id: null, total: { $sum: 1 },
        open: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
        low: { $sum: { $cond: [{ $eq: ["$priority", "low"] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ["$priority", "medium"] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
        overdue: { $sum: { $cond: [{ $and: [{ $ne: ["$status", "resolved"] }, { $ne: ["$dueAt", null] }, { $lt: ["$dueAt", "$$NOW"] }] }, 1, 0] } },
        avgResolutionMs: { $avg: { $cond: [{ $and: [{ $eq: ["$status", "resolved"] }, { $ne: ["$resolvedAt", null] }] }, { $subtract: ["$resolvedAt", "$createdAt"] }, null] } }
      } },
      { $project: { _id: 0, total: 1, open: 1, inProgress: 1, resolved: 1, overdue: 1, averageResolutionHours: { $cond: [{ $gt: ["$avgResolutionMs", 0] }, { $round: [{ $divide: ["$avgResolutionMs", 3600000] }, 2] }, 0] }, byPriority: { low: "$low", medium: "$medium", high: "$high" } } }
    ]);
    const data = summary || { total: 0, open: 0, inProgress: 0, resolved: 0, overdue: 0, averageResolutionHours: 0, byPriority: { low: 0, medium: 0, high: 0 } };
    for (const key of STATUS_KEYS) data[key] = data[key] || 0;
    for (const key of PRIORITY_KEYS) data.byPriority[key] = data.byPriority[key] || 0;
    res.json({ success: true, data });
  } catch (error) { next(error); }
}
module.exports = { overview };
