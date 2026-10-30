const router = require("express").Router();
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");
const { register, login, me } = require("../controllers/auth");
const protect = require("../middleware/auth");
const { validateRequest } = require("../middleware/errors");

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false, message: { success: false, message: "Too many authentication attempts. Try again later." } });
router.post("/register", authLimiter, [body("name").isString().trim().isLength({ min: 2, max: 80 }), body("email").isEmail().normalizeEmail(), body("password").isString().isLength({ min: 8, max: 72 }), validateRequest], register);
router.post("/login", authLimiter, [body("email").isEmail().normalizeEmail(), body("password").isString().notEmpty(), validateRequest], login);
router.get("/me", protect, me);
module.exports = router;
