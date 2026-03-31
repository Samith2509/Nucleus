const tenantMiddleware = (req, res, next) => {
  // Ensure the user object exists (meaning authMiddleware ran successfully)
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  // Ensure the tenantId exists on the parsed user payload
  if (!req.user.tenantId) {
    return res.status(403).json({ message: 'Tenant ID is missing from user token' });
  }

  // Attach tenantId directly to the request object for easy query usage
  req.tenantId = req.user.tenantId;

  next();
};

module.exports = { tenantMiddleware };
