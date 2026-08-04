const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { createCallLog, getCallLogsForLead } = require("../controllers/callController");

router.use(protect);

router.post("/", createCallLog);
router.get("/lead/:leadId", getCallLogsForLead);

module.exports = router;
