// Helpers to figure out which leads/users a given role can see,
// based on the parentId tree: manager -> asst_manager -> team_lead -> employee

const User = require("../models/User");

// Return array of userIds that are "under" this user (direct + indirect reports)
async function getDescendantIds(userId) {
  const all = [String(userId)];
  let frontier = [userId];
  while (frontier.length) {
    const children = await User.find({ parentId: { $in: frontier } }).select("_id");
    const ids = children.map((c) => String(c._id));
    if (!ids.length) break;
    all.push(...ids);
    frontier = ids;
  }
  return all;
}

// Build a Lead query filter based on requesting user's role/hierarchy
async function leadVisibilityFilter(user) {
  if (user.role === "super_admin") return {}; // sees everything
  if (user.role === "operation") return { sentToOperation: true };

  const visibleIds = await getDescendantIds(user._id);
  const scopeIds = visibleIds.concat(user._id);

  if (user.role === "manager") {
    return {
      $or: [
        { managerId: { $in: scopeIds } },
        { createdBy: { $in: scopeIds } },
      ],
    };
  }
  if (user.role === "asst_manager") {
    return {
      $or: [
        { asstManagerId: { $in: scopeIds } },
        { createdBy: { $in: scopeIds } },
      ],
    };
  }
  if (user.role === "team_lead") {
    return {
      $or: [
        { teamLeadId: { $in: scopeIds } },
        { createdBy: { $in: scopeIds } },
      ],
    };
  }
  if (user.role === "employee") {
    return {
      $or: [
        { employeeId: user._id },
        { createdBy: user._id },
      ],
    };
  }
  return { _id: null }; // no access by default
}

module.exports = { getDescendantIds, leadVisibilityFilter };
