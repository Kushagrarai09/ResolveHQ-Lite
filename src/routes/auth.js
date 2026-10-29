const router = require("express").Router();
const { body } = require("express-validator");
const { register, login, me } = require("../controllers/auth");
const protect = require("../middleware/auth");
const { validateRequest } = require("../middleware/errors");
router.post("/register", [body("name").isString().trim().isLength({ min: 2, max: 80 }), body("email").isEmail().normalizeEmail(), body("password").isString().isLength({ min: 8, max: 72 }), validateRequest], register);
router.post("/login", [body("email").isEmail().normalizeEmail(), body("password").isString().notEmpty(), validateRequest], login);
router.get("/me", protect, me);
module.exports = router;
