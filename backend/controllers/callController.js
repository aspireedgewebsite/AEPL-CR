const CallLog = require("../models/CallLog");
const Lead = require("../models/Lead");
const Payment = require("../models/Payment");

const deriveLeadScore = (leadResponse = "", statusAfterCall = "") => {
  const responseText = String(leadResponse).toLowerCase();
  const isInterested = /interested|confirm|yes|ok|want|join|paid|converted/.test(responseText);
  if (statusAfterCall === "converted" || isInterested) return "hot";
  if (statusAfterCall === "follow_up" || /call back|later|need time|maybe/.test(responseText)) return "warm";
  return "cold";
};

// POST /api/calls   { leadId, leadResponse, remark, nextFollowUpDate, statusAfterCall,
//                     totalAgreedAmount, paidNow, program, domain, utr }
// When statusAfterCall === "converted", the caller may also supply the final agreed
// amount and an amount paid now (creates the first payment installment).
const createCallLog = async (req, res) => {
  try {
    const { leadId, leadResponse, remark, nextFollowUpDate, statusAfterCall, totalAgreedAmount, paidNow, program, domain, utr } = req.body;
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
      if (statusAfterCall === "converted") {
        lead.converted = true;
        // Capture the final agreed amount (only if not already set)
        if (totalAgreedAmount) {
          lead.totalAgreedAmount = Number(totalAgreedAmount);
        }
        // If an amount is paid now, create the first payment installment
        if (paidNow && Number(paidNow) > 0) {
          const payAmount = Number(paidNow);
          const nextInstallment = lead.installmentsCount + 1;
          if (nextInstallment <= 10) {
            await Payment.create({
              leadId: lead._id,
              installmentNumber: nextInstallment,
              amount: payAmount,
              program: program || lead.program || "",
              domain: domain || lead.domain || "",
              utr: utr || "",
              paymentDate: new Date(),
              submittedBy: req.user._id,
            });
            lead.totalPaidAmount += payAmount;
            lead.installmentsCount = nextInstallment;
            if (program && !lead.program) lead.program = program;
            if (domain && !lead.domain) lead.domain = domain;
          }
        }
      }
    }

    await lead.save();

    res.status(201).json({ callLog: log, lead });
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
