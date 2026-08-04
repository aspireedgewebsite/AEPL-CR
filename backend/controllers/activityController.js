const ActivityLog = require("../models/ActivityLog");
const { leadVisibilityFilter } = require("../utils/hierarchy");

const getActivityLogs = async (req, res) => {
  try {
    const filter = await leadVisibilityFilter(req.user);
    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name role")
      .populate("leadId", "name mobile");

    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getActivityLogs };
