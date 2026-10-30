const Ticket = require("../models/Ticket");

const STATUS_KEYS = ["open", "in_progress", "resolved"];
const PRIORITY_KEYS = ["low", "medium", "high"];

async function overview(req, res, next) {
  try {
    const [summary] = await Ticket.aggregate([
      { $match: { owner: req.user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
          low: { $sum: { $cond: [{ $eq: ["$priority", "low"] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ["$priority", "medium"] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          total: 1,
          open: 1,
          inProgress: 1,
          resolved: 1,
          byPriority: { low: "$low", medium: "$medium", high: "$high" }
        }
      }
    ]);

    const data = summary || {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      byPriority: { low: 0, medium: 0, high: 0 }
    };

    // Normalize missing groups for a stable, predictable API response.
    for (const key of STATUS_KEYS) data[key] = data[key] || 0;
    for (const key of PRIORITY_KEYS) data.byPriority[key] = data.byPriority[key] || 0;

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { overview };
