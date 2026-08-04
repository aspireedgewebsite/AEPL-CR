const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { allowRoles } = require("../middleware/role");
const {
  getSummary,
  getMonthlyStats,
  getYearlyStats,
} = require("../controllers/dashboardController");

router.use(protect);
router.get("/summary", getSummary);
router.get("/monthly", allowRoles("super_admin"), getMonthlyStats);
router.get("/yearly", allowRoles("super_admin"), getYearlyStats);

module.exports = router;
