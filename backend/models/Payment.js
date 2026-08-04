const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true },
    installmentNumber: { type: Number, required: true, min: 1, max: 10 },
    amount: { type: Number, required: true, min: 0 },
    program: { type: String, trim: true, required: true },
    domain: { type: String, trim: true, required: true },
    utr: { type: String, trim: true, required: true },
    paymentDate: { type: Date, default: Date.now },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Operation / invoice tracking - each payment is pushed to Operation individually
    sentToOperation: { type: Boolean, default: false },
    sentToOperationAt: { type: Date, default: null },
    sentToOperationBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    invoiceNumber: { type: String, trim: true, default: "" },
    invoiceSentAt: { type: Date, default: null },
    invoiceSentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Locked once invoice number is submitted by Operation. Only super_admin bypasses this.
    locked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

paymentSchema.index({ leadId: 1, installmentNumber: 1 }, { unique: true });

module.exports = mongoose.model("Payment", paymentSchema);
