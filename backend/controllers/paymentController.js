const Payment = require("../models/Payment");
const Lead = require("../models/Lead");

const MAX_INSTALLMENTS = 10;

// POST /api/payments   { leadId, amount, program, domain, utr, paymentDate }
// Employee / team_lead / asst_manager add a payment against a converted lead
const addPayment = async (req, res) => {
  try {
    const { leadId, amount, program, domain, utr, paymentDate } = req.body;
    if (!leadId || !amount || !program || !domain || !utr) {
      return res.status(400).json({ message: "leadId, amount, program, domain, utr are required" });
    }
    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    if (lead.installmentsCount >= MAX_INSTALLMENTS) {
      return res.status(400).json({ message: `Maximum ${MAX_INSTALLMENTS} payment submissions reached for this lead` });
    }

    const nextInstallment = lead.installmentsCount + 1;

    const payment = await Payment.create({
      leadId,
      installmentNumber: nextInstallment,
      amount,
      program,
      domain,
      utr,
      paymentDate: paymentDate || new Date(),
      submittedBy: req.user._id,
    });

    lead.converted = true;
    lead.status = "converted";
    lead.totalPaidAmount += Number(amount);
    lead.installmentsCount = nextInstallment;
    if (!lead.program) lead.program = program;
    if (!lead.domain) lead.domain = domain;
    await lead.save();

    res.status(201).json({ payment, lead });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/payments/lead/:leadId
const getPaymentsForLead = async (req, res) => {
  try {
    const payments = await Payment.find({ leadId: req.params.leadId })
      .sort({ installmentNumber: 1 })
      .populate("submittedBy", "name role");
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/payments/:id/send-to-operation   (manager sends each payment individually)
const sendPaymentToOperation = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (payment.sentToOperation) {
      return res.status(400).json({ message: "Payment already sent to Operation" });
    }
    payment.sentToOperation = true;
    payment.sentToOperationAt = new Date();
    payment.sentToOperationBy = req.user._id;
    await payment.save();
    res.json({ payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/payments/operation   (Operation dept inbox: payments sent to them)
const getOperationPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ sentToOperation: true })
      .sort({ sentToOperationAt: -1 })
      .populate("leadId", "name mobile email program domain totalPaidAmount")
      .populate("submittedBy sentToOperationBy", "name role");
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/payments/:id/invoice   { invoiceNumber }   (Operation submits invoice number; locks the row)
const submitInvoice = async (req, res) => {
  try {
    const { invoiceNumber } = req.body;
    if (!invoiceNumber) return res.status(400).json({ message: "invoiceNumber is required" });

    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    if (!payment.sentToOperation) {
      return res.status(400).json({ message: "Payment has not been sent to Operation yet" });
    }
    if (payment.locked) {
      return res.status(400).json({ message: "This payment row is locked and cannot be edited" });
    }

    payment.invoiceNumber = invoiceNumber;
    payment.invoiceSentAt = new Date();
    payment.invoiceSentBy = req.user._id;
    payment.locked = true;
    await payment.save();

    res.json({ payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/payments/:id   (super_admin only - can edit even locked rows)
const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    const editable = ["amount", "program", "domain", "utr", "paymentDate", "invoiceNumber", "locked"];
    editable.forEach((f) => {
      if (req.body[f] !== undefined) payment[f] = req.body[f];
    });
    await payment.save();
    res.json({ payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/payments/:id   (super_admin only)
const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    const lead = await Lead.findById(payment.leadId);
    if (lead) {
      lead.totalPaidAmount = Math.max(0, lead.totalPaidAmount - payment.amount);
      lead.installmentsCount = Math.max(0, lead.installmentsCount - 1);
      await lead.save();
    }
    await payment.deleteOne();
    res.json({ message: "Payment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/payments   (super_admin only - every payment in the system)
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .sort({ createdAt: -1 })
      .populate("leadId", "name mobile email program domain")
      .populate("submittedBy sentToOperationBy invoiceSentBy", "name role");
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  addPayment,
  getPaymentsForLead,
  sendPaymentToOperation,
  getOperationPayments,
  submitInvoice,
  updatePayment,
  deletePayment,
  getAllPayments,
};
