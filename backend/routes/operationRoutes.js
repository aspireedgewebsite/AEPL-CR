const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { allowRoles } = require("../middleware/role");
const { getLmsLeads } = require("../controllers/operationController");

router.use(protect);
router.get("/leads", allowRoles("super_admin", "operation"), getLmsLeads);

module.exports = router;
