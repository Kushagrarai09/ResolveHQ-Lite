const router = require("express").Router();
const { body, query, param } = require("express-validator");
const protect = require("../middleware/auth");
const { validateRequest } = require("../middleware/errors");
const tickets = require("../controllers/tickets");

router.use(protect);
const statusBody = body("status").optional().isIn(["open", "in_progress", "resolved"]);
const priorityBody = body("priority").optional().isIn(["low", "medium", "high"]);
const categoryBody = body("category").optional().isIn(["general", "billing", "technical", "account", "bug", "feature"]);
const idParam = param("id").isMongoId().withMessage("Ticket ID must be a valid MongoDB ID.");

router.post("/", [
  body("title").isString().trim().isLength({ min: 3, max: 120 }),
  body("description").isString().trim().isLength({ min: 1, max: 5000 }),
  priorityBody, categoryBody, body("tags").optional().isArray({ max: 10 }),
  body("tags.*").optional().isString().trim().isLength({ min: 1, max: 30 }),
  body("dueAt").optional({ nullable: true }).isISO8601().toDate(),
  validateRequest
], tickets.create);
router.get("/", [
  query("status").optional().isIn(["open", "in_progress", "resolved"]),
  query("priority").optional().isIn(["low", "medium", "high"]),
  query("category").optional().isIn(["general", "billing", "technical", "account", "bug", "feature"]),
  query("tag").optional().isString().isLength({ max: 30 }),
  query("overdue").optional().isIn(["true", "false"]),
  query("search").optional().isString().isLength({ max: 120 }),
  query("page").optional().isInt({ min: 1 }), query("limit").optional().isInt({ min: 1, max: 50 }),
  validateRequest
], tickets.list);
router.get("/overdue", tickets.listOverdue);
router.get("/:id", [idParam, validateRequest], tickets.getOne);
router.patch("/:id", [
  idParam,
  body("title").optional().isString().trim().isLength({ min: 3, max: 120 }),
  body("description").optional().isString().trim().isLength({ min: 1, max: 5000 }),
  statusBody, priorityBody, categoryBody,
  body("tags").optional().isArray({ max: 10 }), body("tags.*").optional().isString().trim().isLength({ min: 1, max: 30 }),
  body("dueAt").optional({ nullable: true }).isISO8601().toDate(),
  validateRequest
], tickets.update);
router.patch("/:id/assign", [idParam, body("assignedTo").isMongoId(), validateRequest], tickets.assign);
router.get("/:id/activity", [idParam, validateRequest], tickets.listActivity);
router.get("/:id/comments", [idParam, validateRequest], tickets.listComments);
router.post("/:id/comments", [idParam, body("text").isString().trim().isLength({ min: 1, max: 2000 }), validateRequest], tickets.addComment);
router.get("/:id/attachments", [idParam, validateRequest], tickets.listAttachments);
router.post("/:id/attachments", [idParam, body("fileName").isString().trim().notEmpty(), body("mimeType").isString(), body("dataBase64").isString(), validateRequest], tickets.addAttachment);
router.get("/:id/attachments/:attachmentId", [idParam, param("attachmentId").isMongoId(), validateRequest], tickets.downloadAttachment);
router.delete("/:id", [idParam, validateRequest], tickets.remove);
module.exports = router;
