const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { allowRoles } = require("../middleware/role");
const upload = require("../middleware/upload");
const {
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
  sendToOperationLMS,
  sendToPaymentInvoice,
  updateLmsAction,
} = require("../controllers/leadController");

router.use(protect);

router.post("/", allowRoles("super_admin", "manager", "asst_manager", "team_lead", "employee"), createLead);
router.post(
  "/bulk",
  allowRoles("super_admin", "manager", "asst_manager"),
  upload.single("file"),
  bulkUploadLeads
);
router.get("/", getLeads);
router.get("/:id", getLeadById);
router.put("/bulk-assign", allowRoles("super_admin", "manager", "asst_manager", "team_lead"), bulkAssignLeads);
router.delete("/bulk", allowRoles("super_admin", "manager"), bulkDeleteLeads);
router.put("/:id/assign", allowRoles("super_admin", "manager", "asst_manager", "team_lead"), assignLead);
router.put("/:id/restore", allowRoles("super_admin"), restoreLead);
router.delete("/:id", allowRoles("super_admin", "manager"), deleteLead);
router.put("/:id/status", updateLeadStatus);
router.put("/:id/program-domain", updateLeadProgramDomain);
router.put("/:id/send-to-lms", allowRoles("super_admin", "manager", "asst_manager", "team_lead", "employee"), sendToOperationLMS);
router.put("/:id/send-to-invoice", allowRoles("super_admin", "manager", "asst_manager"), sendToPaymentInvoice);
router.put("/:id/lms-action", allowRoles("super_admin", "operation"), updateLmsAction);

module.exports = router;
