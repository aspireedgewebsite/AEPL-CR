const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    entityType: { type: String, trim: true, default: "lead" },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

activityLogSchema.index({ leadId: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
