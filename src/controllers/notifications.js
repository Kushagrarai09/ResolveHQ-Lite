const Notification = require("../models/Notification");

async function list(req, res, next) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const filter = { recipient: req.user._id };
    if (req.query.unread === "true") filter.readAt = null;
    const [notifications, total, unread] = await Promise.all([
      Notification.find(filter).populate("actor", "name").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, readAt: null })
    ]);
    res.json({ success: true, data: { notifications, unread, pagination: { total, page, limit, pages: Math.ceil(total / limit) } } });
  } catch (error) { next(error); }
}

async function markRead(req, res, next) {
  try {
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { $set: { readAt: new Date() } }, { new: true });
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found." });
    res.json({ success: true, data: { notification } });
  } catch (error) { next(error); }
}

async function markAllRead(req, res, next) {
  try {
    const result = await Notification.updateMany({ recipient: req.user._id, readAt: null }, { $set: { readAt: new Date() } });
    res.json({ success: true, data: { modified: result.modifiedCount } });
  } catch (error) { next(error); }
}

module.exports = { list, markRead, markAllRead };
