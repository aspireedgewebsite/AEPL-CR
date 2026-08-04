const CallLog = require("../models/CallLog");
const Lead = require("../models/Lead");

const deriveLeadScore = (leadResponse = "", statusAfterCall = "") => {
  const responseText = String(leadResponse).toLowerCase();
  const isInterested = /interested|confirm|yes|ok|want|join|paid|converted/.test(responseText);
  if (statusAfterCall === "converted" || isInterested) return "hot";
  if (statusAfterCall === "follow_up" || /call back|later|need time|maybe/.test(responseText)) return "warm";
  return "cold";
};

// POST /api/calls   { leadId, leadResponse, remark, nextFollowUpDate, statusAfterCall }
const createCallLog = async (req, res) => {
  try {
    const { leadId, leadResponse, remark, nextFollowUpDate, statusAfterCall } = req.body;
    if (!leadId || !leadResponse) {
      return res.status(400).json({ message: "leadId and leadResponse are required" });
    }
    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    const log = await CallLog.create({
      leadId,
      calledBy: req.user._id,
      leadResponse,
      remark,
      nextFollowUpDate: nextFollowUpDate || null,
      statusAfterCall: statusAfterCall || "",
    });

    lead.callAttemptCount = (lead.callAttemptCount || 0) + 1;
    lead.lastContactedAt = new Date();
    lead.nextFollowUpDate = nextFollowUpDate || lead.nextFollowUpDate || null;
    lead.leadScore = deriveLeadScore(leadResponse, statusAfterCall);

    if (statusAfterCall) {
      lead.status = statusAfterCall;
      if (statusAfterCall === "converted") lead.converted = true;
    }

    await lead.save();

    res.status(201).json({ callLog: log });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/calls/lead/:leadId
const getCallLogsForLead = async (req, res) => {
  try {
    const logs = await CallLog.find({ leadId: req.params.leadId })
      .sort({ callDate: -1 })
      .populate("calledBy", "name role");
    res.json({ callLogs: logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createCallLog, getCallLogsForLead };
