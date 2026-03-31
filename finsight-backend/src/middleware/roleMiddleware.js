const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Check if the user exists and has a role attached
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'User not authenticated or missing role' });
    }

    // Check if the user's role is included in the array of allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access forbidden: Insufficient permissions' });
    }

    // User is authorized
    next();
  };
};

module.exports = { requireRole };
