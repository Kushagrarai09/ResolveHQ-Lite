function validateRequest(req, res, next) {
  const { validationResult } = require("express-validator");
  const result = validationResult(req);
  if (!result.isEmpty()) return res.status(400).json({ success: false, message: "Request validation failed.", errors: result.array().map(({ path, msg }) => ({ field: path, message: msg })) });
  next();
}
function notFound(req, res) { res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` }); }
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err.code === 11000) return res.status(409).json({ success: false, message: "An account with this email already exists." });
  if (err.name === "ValidationError") return res.status(400).json({ success: false, message: "Database validation failed.", errors: Object.values(err.errors).map(e => e.message) });
  if (err.name === "CastError") return res.status(400).json({ success: false, message: "Invalid resource ID." });
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({ success: false, message: status >= 500 ? "Internal server error." : err.message });
}
module.exports = { validateRequest, notFound, errorHandler };
