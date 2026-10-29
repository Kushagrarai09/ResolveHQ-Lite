const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
function tokenFor(userId) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1d" });
}
async function register(req, res, next) {
  try {
    const email = req.body.email.toLowerCase().trim();
    if (await User.exists({ email })) return res.status(409).json({ success: false, message: "Email is already registered." });
    const user = await User.create({ name: req.body.name, email, password: await bcrypt.hash(req.body.password, 12) });
    res.status(201).json({ success: true, message: "Account created.", data: { user: { id: user.id, name: user.name, email: user.email }, token: tokenFor(user.id) } });
  } catch (error) { next(error); }
}
async function login(req, res, next) {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase().trim() }).select("+password");
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) return res.status(401).json({ success: false, message: "Email or password is incorrect." });
    res.json({ success: true, message: "Login successful.", data: { user: { id: user.id, name: user.name, email: user.email }, token: tokenFor(user.id) } });
  } catch (error) { next(error); }
}
function me(req, res) { res.json({ success: true, data: { user: { id: req.user.id, name: req.user.name, email: req.user.email } } }); }
module.exports = { register, login, me };
