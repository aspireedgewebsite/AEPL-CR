const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { allowRoles } = require("../middleware/role");
const { createUser, getUsers, updateUser, deleteUser, restoreUser } = require("../controllers/userController");

router.use(protect);

router.post("/", allowRoles("super_admin", "manager", "asst_manager"), createUser);
router.get("/", getUsers);
router.put("/:id", allowRoles("super_admin", "manager", "asst_manager"), updateUser);
router.put("/:id/restore", allowRoles("super_admin"), restoreUser);
router.delete("/:id", allowRoles("super_admin"), deleteUser);

module.exports = router;
