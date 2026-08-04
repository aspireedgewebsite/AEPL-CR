const mongoose = require("mongoose");

const LEAD_STATUS = [
  "new",
  "contacted",
  "follow_up",
  "converted",
  "not_interested",
  "invalid",
];

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    program: { type: String, trim: true, default: "" },
    domain: { type: String, trim: true, default: "" },
    source: { type: String, trim: true, default: "manual" }, // manual | bulk_upload
    status: { type: String, enum: LEAD_STATUS, default: "new" },

    // Assignment chain
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    asstManagerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    teamLeadId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },

    // Conversion / payment summary (denormalized for fast dashboard reads)
    converted: { type: Boolean, default: false },
    totalAgreedAmount: { type: Number, default: 0 },
    totalPaidAmount: { type: Number, default: 0 },
    installmentsCount: { type: Number, default: 0 }, // max 10, enforced in controller

    callAttemptCount: { type: Number, default: 0 },
    lastContactedAt: { type: Date, default: null },
    nextFollowUpDate: { type: Date, default: null },
    leadScore: { type: String, enum: ["hot", "warm", "cold"], default: "cold" },

    // Operation handoff - LMS record
    lmsRequested: { type: Boolean, default: false },
    lmsRequestedAt: { type: Date, default: null },
    lmsRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    sentToOperation: { type: Boolean, default: false },
    sentToOperationAt: { type: Date, default: null },
    sentToOperationBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    lms: {
      offerLetterSent: { type: Boolean, default: false },
      offerLetterSentAt: { type: Date, default: null },
      lmsAccessGranted: { type: Boolean, default: false },
      lmsAccessGrantedAt: { type: Date, default: null },
      certificateSent: { type: Boolean, default: false },
      certificateSentAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

leadSchema.index({ name: "text", mobile: "text", email: "text" });
leadSchema.index({ mobile: 1, isDeleted: 1 });
leadSchema.index({ email: 1, isDeleted: 1 });
leadSchema.index({ nextFollowUpDate: 1, isDeleted: 1 });

module.exports = mongoose.model("Lead", leadSchema);
module.exports.LEAD_STATUS = LEAD_STATUS;
