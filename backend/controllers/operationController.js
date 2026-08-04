const Lead = require("../models/Lead");

// GET /api/operation/leads   -> LMS tab: leads handed off by Manager
const getLmsLeads = async (req, res) => {
  try {
    const leads = await Lead.find({ sentToOperation: true })
      .sort({ sentToOperationAt: -1 })
      .populate("managerId asstManagerId teamLeadId employeeId", "name role email");
    res.json({ leads });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getLmsLeads };
