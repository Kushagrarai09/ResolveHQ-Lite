const User = require("../models/User");

async function listUsers(req, res, next) {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter).select("_id name email role createdAt").sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: { users } });
  } catch (error) { next(error); }
}

async function updateRole(req, res, next) {
  try {
    const { role } = req.body;
    const target = await User.findById(req.params.id).select("_id name email role");
    if (!target) return res.status(404).json({ success: false, message: "User not found." });
    if (String(target._id) === String(req.user._id) && role !== "admin") {
      return res.status(400).json({ success: false, message: "You cannot remove your own admin role." });
    }
    if (target.role === "admin" && role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) return res.status(409).json({ success: false, message: "The last administrator cannot be demoted." });
    }
    target.role = role;
    await target.save();
    res.json({ success: true, data: { user: { id: target.id, name: target.name, email: target.email, role: target.role } } });
  } catch (error) { next(error); }
}

module.exports = { listUsers, updateRole };
