const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

/**
 * Middleware to verify JWT access token and protect routes
 * Adds user information to req.user if token is valid
 */
const authenticateToken = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify access token
    console.log('Raw JWT:', token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded);
    if (decoded.exp) {
      const expDate = new Date(decoded.exp * 1000);
      console.log('JWT expires at:', expDate.toISOString());
    }
    // Attach user to the request
    req.user = { userId: decoded.userId };

    next();

  } catch (error) {
    console.error('JWT verification error:', error);
    console.log('Current server time:', new Date().toISOString());
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please refresh your token.'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

/**
 * Middleware to check user role
 * @param {string|Array<string>} requiredRoles - The role(s) that are allowed access
 */
const authorizeRoles = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      // Support both string and array
      const allowed = Array.isArray(requiredRoles)
        ? requiredRoles.includes(user.role)
        : user.role === requiredRoles;
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: `Access denied. User with role '${user.role}' is not authorized.`
        });
      }
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during authorization.'
      });
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
