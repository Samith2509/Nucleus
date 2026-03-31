const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  // Check if authorization header is present and formatted as 'Bearer token'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract the token
      token = req.headers.authorization.split(' ')[1];

      // Verify the token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret_key'
      );

      // Attach the decoded user information to the request object
      // The payload contains userId, tenantId, and role as configured in authController
      req.user = decoded;

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // No token provided in the headers
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
