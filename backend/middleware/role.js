// Restrict a route to a set of roles. Super admin always has full access.
const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (req.user.role === "super_admin" || roles.includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ message: "Forbidden: insufficient role permissions" });
};

module.exports = { allowRoles };
