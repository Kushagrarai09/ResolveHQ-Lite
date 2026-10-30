const router = require("express").Router();
const { query, param, body } = require("express-validator");
const protect = require("../middleware/auth");
const { requireRoles } = require("../middleware/auth");
const { validateRequest } = require("../middleware/errors");
const admin = require("../controllers/admin");

router.use(protect, requireRoles("admin"));
router.get("/users", [query("role").optional().isIn(["user", "agent", "admin"]), validateRequest], admin.listUsers);
router.patch("/users/:id/role", [param("id").isMongoId(), body("role").isIn(["user", "agent", "admin"]), validateRequest], admin.updateRole);
module.exports = router;
