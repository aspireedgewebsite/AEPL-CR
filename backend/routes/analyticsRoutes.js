const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getFollowUpAlerts,
  getFunnel,
  getLeaderboard,
  getSourcePerformance,
  getTargetTracker,
} = require("../controllers/analyticsController");

router.use(protect);

router.get("/followups", getFollowUpAlerts);
router.get("/funnel", getFunnel);
router.get("/leaderboard", getLeaderboard);
router.get("/source-performance", getSourcePerformance);
router.get("/targets", getTargetTracker);

module.exports = router;
