const mongoose = require("mongoose");

const callLogSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true },
    calledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    callDate: { type: Date, default: Date.now },
    leadResponse: { type: String, required: true, trim: true }, // what the lead said
    remark: { type: String, trim: true, default: "" },
    nextFollowUpDate: { type: Date, default: null },
    statusAfterCall: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CallLog", callLogSchema);
