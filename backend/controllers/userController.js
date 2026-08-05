const User = require("../models/User");
const { getDescendantIds } = require("../utils/hierarchy");

// Which roles each role is allowed to create
const CREATION_RULES = {
  super_admin: ["super_admin", "manager", "asst_manager", "team_lead", "employee", "operation"],
  manager: ["asst_manager", "team_lead", "employee", "operation"],
  asst_manager: ["team_lead", "employee"],
  team_lead: [],
  employee: [],
  operation: [],
};

// POST /api/users
const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, parentId, teamName, monthlyTarget } = req.body;
    const allowed = CREATION_RULES[req.user.role] || [];
    if (!allowed.includes(role)) {
      return res.status(403).json({ message: `${req.user.role} cannot create a ${role}` });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: "Email already in use" });

let finalParentId = parentId || req.user._id;
    let resolvedTeamName = teamName || "";

    // A super_admin created by another super_admin has no hierarchy parent.
    if (role === "super_admin") {
      finalParentId = null;
    }

    if (req.user.role === "manager") {
      if (role === "asst_manager") {
        finalParentId = req.user._id;
      } else if (role === "team_lead") {
        const asst = await User.findOne({ _id: parentId, role: "asst_manager" });
        if (!asst) return res.status(400).json({ message: "Invalid asst_manager parent" });
        finalParentId = parentId;
      } else if (role === "employee") {
        const lead = await User.findOne({ _id: parentId, role: "team_lead" });
        if (!lead) return res.status(400).json({ message: "Invalid team_lead parent" });
        finalParentId = parentId;
      }
    }

    if (req.user.role === "asst_manager") {
      finalParentId = req.user._id;
      if (role === "employee") {
        const teamLead = await User.findOne({ _id: parentId, role: "team_lead", parentId: req.user._id });
        if (!teamLead) return res.status(400).json({ message: "Invalid team_lead parent" });
        finalParentId = parentId;
      }
    }

    const parentUser = await User.findById(finalParentId).select("teamName role parentId");
    if (parentUser && role === "team_lead" && parentUser.role === "asst_manager") {
      resolvedTeamName = parentUser.teamName || resolvedTeamName;
    }
    if (parentUser && role === "employee" && parentUser.role === "team_lead") {
      const teamParent = await User.findById(parentUser.parentId).select("teamName");
      resolvedTeamName = teamParent?.teamName || resolvedTeamName;
    }

    if (!["super_admin", "manager"].includes(req.user.role) && parentId && parentId !== req.user._id) {
      return res.status(403).json({ message: "You can only assign yourself as the parent for this user" });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role,
      parentId: finalParentId,
      teamName: resolvedTeamName || "",
      monthlyTarget: Number(monthlyTarget || 0),
      createdBy: req.user._id,
    });

    res.status(201).json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users  (scoped to hierarchy)
const getUsers = async (req, res) => {
  try {
    let filter = { isDeleted: false };
    if (req.user.role === "super_admin") {
      filter = {};
    } else if (req.user.role === "operation") {
      filter = { role: "operation" };
    } else if (req.user.role === "asst_manager" && req.query.role === "employee") {
      filter = { role: "employee" };
    } else {
      const ids = await getDescendantIds(req.user._id);
      filter = { _id: { $in: ids } };
    }
    if (req.query.role) filter.role = req.query.role;

    const users = await User.find(filter).select("-password").populate("parentId", "name role email");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/:id  (update basic info / reassign parent / activate-deactivate)
const updateUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });

    // Only super_admin, manager (over asst_manager placement) or asst_manager
    // (over employee->team_lead placement) may reassign hierarchy
    const { name, phone, teamName, parentId, isActive, monthlyTarget } = req.body;
    if (name !== undefined) target.name = name;
    if (phone !== undefined) target.phone = phone;
    if (teamName !== undefined) target.teamName = teamName;
    if (monthlyTarget !== undefined && ["super_admin", "manager"].includes(req.user.role)) {
      target.monthlyTarget = Number(monthlyTarget || 0);
    }
    if (isActive !== undefined && ["super_admin", "manager"].includes(req.user.role)) {
      target.isActive = isActive;
    }
    if (parentId !== undefined) {
      const allowedReassign =
        req.user.role === "super_admin" ||
        (req.user.role === "manager" && ["asst_manager", "team_lead", "employee"].includes(target.role)) ||
        (req.user.role === "asst_manager" && ["team_lead", "employee"].includes(target.role));
      if (!allowedReassign) {
        return res.status(403).json({ message: "Not allowed to reassign this user's team" });
      }

      const parentUser = await User.findById(parentId).select("role teamName parentId");
      if (req.user.role === "manager" && target.role === "team_lead" && (!parentUser || parentUser.role !== "asst_manager")) {
        return res.status(400).json({ message: "Team lead must be assigned under an asst_manager" });
      }
      if (req.user.role === "manager" && target.role === "employee" && (!parentUser || parentUser.role !== "team_lead")) {
        return res.status(400).json({ message: "Employee must be assigned under a team lead" });
      }
      if (req.user.role === "asst_manager" && target.role === "employee" && (!parentUser || parentUser.role !== "team_lead" || String(parentUser.parentId) !== String(req.user._id))) {
        return res.status(400).json({ message: "Employee must be assigned under a team lead in your team" });
      }

      target.parentId = parentId;
      if (parentUser?.teamName) {
        target.teamName = parentUser.teamName;
      }
    }

    await target.save();
    res.json({ user: target.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/users/:id  (soft delete)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/:id/restore
const restoreUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isDeleted = false;
    user.deletedAt = null;
    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createUser, getUsers, updateUser, deleteUser, restoreUser };
