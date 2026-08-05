const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const XLSX = require("xlsx");
const Lead = require("../models/Lead");
const User = require("../models/User");
const { leadVisibilityFilter } = require("../utils/hierarchy");

// Resolve the assignment chain fields to store on a lead being created by `user`
// Uploaded/created leads should remain unassigned until the hierarchy owner assigns them.
function baseAssignmentFor() {
  return {};
}

async function applyLeadAssignment(lead, actor, body = {}) {
  const { asstManagerId, teamLeadId, employeeId } = body;

  if (actor.role === "manager" && (lead.asstManagerId || lead.teamLeadId || lead.employeeId)) {
    throw new Error("Lead already assigned and cannot be assigned again");
  }
  if (actor.role === "asst_manager" && (lead.teamLeadId || lead.employeeId)) {
    throw new Error("Lead already assigned and cannot be assigned again");
  }
  if (actor.role === "team_lead" && lead.employeeId) {
    throw new Error("Lead already assigned and cannot be assigned again");
  }

  if (actor.role === "manager") {
    if (!asstManagerId) {
      throw new Error("asstManagerId is required");
    }
    const target = await User.findOne({ _id: asstManagerId, role: "asst_manager" });
    if (!target) throw new Error("Invalid asst_manager");
    lead.managerId = lead.managerId || actor._id;
    lead.asstManagerId = asstManagerId;
    lead.teamLeadId = null;
    lead.employeeId = null;
    return;
  }

  if (actor.role === "asst_manager") {
    if (!teamLeadId) {
      throw new Error("teamLeadId is required");
    }
    const target = await User.findOne({ _id: teamLeadId, role: "team_lead", parentId: actor._id });
    if (!target) throw new Error("Invalid team_lead (must be in your team)");
    lead.managerId = lead.managerId || actor.parentId || null;
    lead.asstManagerId = lead.asstManagerId || actor._id;
    lead.teamLeadId = teamLeadId;
    lead.employeeId = null;
    return;
  }

  if (actor.role === "team_lead") {
    if (!employeeId) {
      throw new Error("employeeId is required");
    }
    const target = await User.findOne({ _id: employeeId, role: "employee", parentId: actor._id });
    if (!target) throw new Error("Invalid employee (must be in your team)");
    lead.managerId = lead.managerId || actor.parentId || null;
    lead.asstManagerId = lead.asstManagerId || actor.parentId || null;
    lead.teamLeadId = lead.teamLeadId || actor._id;
    lead.employeeId = employeeId;
    return;
  }

if (actor.role === "super_admin") {
    const { managerId } = body;
    if (managerId) lead.managerId = managerId;
    if (asstManagerId) lead.asstManagerId = asstManagerId;
    if (teamLeadId) lead.teamLeadId = teamLeadId;
    if (employeeId) lead.employeeId = employeeId;
    return;
  }

  throw new Error("Not allowed to assign this lead");
}

// POST /api/leads
const createLead = async (req, res) => {
  try {
    const { name, mobile, email, program, domain } = req.body;
    if (!name || !mobile) return res.status(400).json({ message: "name and mobile are required" });

    const existingLead = await Lead.findOne({ isDeleted: false, $or: [{ mobile: String(mobile).trim() }, { email: String(email || "").trim().toLowerCase() }] }).lean();
    if (existingLead) {
      return res.status(409).json({ message: "Duplicate lead detected for this mobile/email" });
    }

    const lead = await Lead.create({
      name,
      mobile,
      email,
      program,
      domain,
      source: "manual",
      createdBy: req.user._id,
      ...baseAssignmentFor(req.user),
    });
    res.status(201).json({ lead });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/leads/bulk  (manager / asst_manager upload csv or xlsx)
const bulkUploadLeads = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    let rows = [];
    if (ext === ".csv") {
      const content = fs.readFileSync(filePath, "utf8");
      rows = parse(content, { columns: true, skip_empty_lines: true, trim: true });
    } else {
      const wb = XLSX.readFile(filePath);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    }

    // Expect columns (case-insensitive): name, mobile, email, program, domain
    const normalize = (obj) => {
      const out = {};
      Object.keys(obj).forEach((k) => (out[k.trim().toLowerCase()] = obj[k]));
      return out;
    };

    const docs = [];
    const errors = [];
    rows.forEach((raw, idx) => {
      const row = normalize(raw);
      if (!row.name || !row.mobile) {
        errors.push({ row: idx + 2, message: "Missing name or mobile" });
        return;
      }
      const mobile = String(row.mobile).trim();
      const email = row.email ? String(row.email).trim().toLowerCase() : "";
      if (mobile || email) {
        const duplicate = docs.find((doc) => doc.mobile === mobile || doc.email === email);
        if (duplicate) {
          errors.push({ row: idx + 2, message: "Duplicate mobile/email in this upload" });
          return;
        }
      }
      docs.push({
        name: String(row.name).trim(),
        mobile,
        email,
        program: row.program ? String(row.program).trim() : "",
        domain: row.domain ? String(row.domain).trim() : "",
        source: "bulk_upload",
        createdBy: req.user._id,
        ...baseAssignmentFor(req.user),
      });
    });

    let inserted = [];
    if (docs.length) {
      const existing = await Lead.find({ isDeleted: false, $or: docs.map((doc) => ({ mobile: doc.mobile, email: doc.email })) }).select("_id mobile email");
      if (existing.length) {
        const duplicateIds = new Set(existing.map((x) => String(x.mobile || x.email)));
        const filtered = docs.filter((doc) => !duplicateIds.has(String(doc.mobile)) && !duplicateIds.has(String(doc.email)));
        inserted = await Lead.insertMany(filtered);
      } else {
        inserted = await Lead.insertMany(docs);
      }
    }

    fs.unlink(filePath, () => {});
    res.status(201).json({
      insertedCount: inserted.length,
      skippedCount: errors.length,
      errors,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/leads
const getLeads = async (req, res) => {
  try {
    const filter = await leadVisibilityFilter(req.user);
    filter.isDeleted = false;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.converted !== undefined) filter.converted = req.query.converted === "true";
    if (req.query.lmsRequested !== undefined) filter.lmsRequested = req.query.lmsRequested === "true";
    if (req.query.q) {
      filter.$or = [
        { name: new RegExp(req.query.q, "i") },
        { mobile: new RegExp(req.query.q, "i") },
        { email: new RegExp(req.query.q, "i") },
      ];
    }
    // month/year filter for dashboards
    if (req.query.month && req.query.year) {
      const y = Number(req.query.year);
      const m = Number(req.query.month) - 1;
      filter.createdAt = { $gte: new Date(y, m, 1), $lt: new Date(y, m + 1, 1) };
    } else if (req.query.year) {
      const y = Number(req.query.year);
      filter.createdAt = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) };
    }

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("managerId asstManagerId teamLeadId employeeId createdBy", "name role email"),
      Lead.countDocuments(filter),
    ]);
    res.json({ leads, total, page, limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/leads/:id
const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, isDeleted: false }).populate(
      "managerId asstManagerId teamLeadId employeeId createdBy",
      "name role email"
    );
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/leads/:id/assign   { asstManagerId? , teamLeadId?, employeeId? }
// manager -> assigns asstManagerId
// asst_manager -> assigns teamLeadId (own leads / leads assigned to them)
// team_lead -> assigns employeeId (own leads)
const assignLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    await applyLeadAssignment(lead, req.user, req.body);
    await lead.save();
    res.json({ lead });
  } catch (err) {
    const status = err.message.includes("Invalid") || err.message.includes("required") ? 400 : 403;
    res.status(status).json({ message: err.message });
  }
};

// PUT /api/leads/bulk-assign
const bulkAssignLeads = async (req, res) => {
  try {
    const { leadIds = [], asstManagerId, teamLeadId, employeeId } = req.body;
    if (!Array.isArray(leadIds) || !leadIds.length) {
      return res.status(400).json({ message: "leadIds array is required" });
    }

    const leads = await Lead.find({ _id: { $in: leadIds } });
    if (!leads.length) {
      return res.status(404).json({ message: "No leads found" });
    }

    for (const lead of leads) {
      await applyLeadAssignment(lead, req.user, { asstManagerId, teamLeadId, employeeId });
      await lead.save();
    }

    res.json({ updatedCount: leads.length });
  } catch (err) {
    const status = err.message.includes("Invalid") || err.message.includes("required") ? 400 : 403;
    res.status(status).json({ message: err.message });
  }
};

// DELETE /api/leads/bulk
const bulkDeleteLeads = async (req, res) => {
  try {
    const { leadIds = [] } = req.body;
    if (!Array.isArray(leadIds) || !leadIds.length) {
      return res.status(400).json({ message: "leadIds array is required" });
    }

    const result = await Lead.deleteMany({ _id: { $in: leadIds } });
    if (!result.deletedCount) {
      return res.status(404).json({ message: "No leads found" });
    }

    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/leads/:id   (soft delete)
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    lead.isDeleted = true;
    lead.deletedAt = new Date();
    await lead.save();
    res.json({ message: "Lead deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/leads/:id/restore
const restoreLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    lead.isDeleted = false;
    lead.deletedAt = null;
    await lead.save();
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/leads/:id/status
const updateLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const lead = await Lead.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/leads/:id/program-domain   { program?, domain? }
// Any logged-in user can edit only the program and/or domain of a lead.
const updateLeadProgramDomain = async (req, res) => {
  try {
    const { program, domain } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    if (program !== undefined) lead.program = String(program).trim();
    if (domain !== undefined) lead.domain = String(domain).trim();
    await lead.save();

    res.json({ lead });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/leads/:id/send-to-lms
// employee / team_lead / asst_manager / manager can queue a converted lead into LMS.
// manager / asst_manager can then approve the final handoff to operation.
const sendToOperationLMS = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    if (!lead.converted) {
      return res.status(400).json({ message: "Lead must be converted before sending to LMS" });
    }

    const canQueue = ["employee", "team_lead", "asst_manager", "manager"].includes(req.user.role);
    const canApprove = ["asst_manager", "manager"].includes(req.user.role);

    if (!lead.lmsRequested && !canQueue) {
      return res.status(403).json({ message: "Not allowed to send this lead to LMS" });
    }

    if (!lead.lmsRequested && canQueue) {
      lead.lmsRequested = true;
      lead.lmsRequestedAt = new Date();
      lead.lmsRequestedBy = req.user._id;
      await lead.save();
      return res.json({ lead });
    }

    if (lead.lmsRequested && !lead.sentToOperation && canApprove) {
      lead.sentToOperation = true;
      lead.sentToOperationAt = new Date();
      lead.sentToOperationBy = req.user._id;
      await lead.save();
      return res.json({ lead });
    }

    return res.status(400).json({ message: "Lead is already queued or already sent to operation" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/leads/:id/send-to-invoice
// manager / asst_manager mark a converted lead as sent to the Payment & Invoice queue.
// This is distinct from the LMS handoff — it is used when there are partial payments
// that need invoicing. The lead still shows in the sender's dashboard (locked for edits).
const sendToPaymentInvoice = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    if (!lead.converted) {
      return res.status(400).json({ message: "Lead must be converted before sending to Payment & Invoice" });
    }
    if (!["manager", "asst_manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not allowed to send this lead to Payment & Invoice" });
    }
    if (lead.invoiceRequested) {
      return res.status(400).json({ message: "Lead is already sent to Payment & Invoice" });
    }

    lead.invoiceRequested = true;
    lead.invoiceRequestedAt = new Date();
    lead.invoiceRequestedBy = req.user._id;
    await lead.save();
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/leads/:id/lms-action   { action: "offerLetter" | "lmsAccess" | "certificate" }
const updateLmsAction = async (req, res) => {
  try {
    const { action } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    if (!lead.sentToOperation) {
      return res.status(400).json({ message: "Lead has not been sent to LMS yet" });
    }
    const now = new Date();
    if (action === "offerLetter") {
      lead.lms.offerLetterSent = true;
      lead.lms.offerLetterSentAt = now;
    } else if (action === "lmsAccess") {
      lead.lms.lmsAccessGranted = true;
      lead.lms.lmsAccessGrantedAt = now;
    } else if (action === "certificate") {
      lead.lms.certificateSent = true;
      lead.lms.certificateSentAt = now;
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }
    await lead.save();
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createLead,
  bulkUploadLeads,
  getLeads,
  getLeadById,
  assignLead,
  bulkAssignLeads,
  bulkDeleteLeads,
  deleteLead,
  restoreLead,
  updateLeadStatus,
  updateLeadProgramDomain,
  sendToOperationLMS,
  sendToPaymentInvoice,
  updateLmsAction,
};
