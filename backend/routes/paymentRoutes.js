const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { allowRoles } = require("../middleware/role");
const {
  addPayment,
  getPaymentsForLead,
  sendPaymentToOperation,
  getOperationPayments,
  submitInvoice,
  updatePayment,
  deletePayment,
  getAllPayments,
} = require("../controllers/paymentController");

router.use(protect);

router.post("/", allowRoles("super_admin", "manager", "asst_manager", "team_lead", "employee"), addPayment);
router.get("/", allowRoles("super_admin"), getAllPayments);
router.get("/lead/:leadId", getPaymentsForLead);
router.get("/operation", allowRoles("super_admin", "operation"), getOperationPayments);
router.put("/:id/send-to-operation", allowRoles("super_admin", "manager"), sendPaymentToOperation);
router.put("/:id/invoice", allowRoles("super_admin", "operation"), submitInvoice);
router.put("/:id", allowRoles("super_admin"), updatePayment);
router.delete("/:id", allowRoles("super_admin"), deletePayment);

module.exports = router;
