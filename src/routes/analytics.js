const router = require("express").Router();
const protect = require("../middleware/auth");
const analytics = require("../controllers/analytics");

router.use(protect);
router.get("/overview", analytics.overview);

module.exports = router;
