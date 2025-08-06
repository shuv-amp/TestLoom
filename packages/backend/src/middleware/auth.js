const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

/**
 * Enhanced middleware to verify JWT access token and protect routes
 * Includes proper error handling and security measures
 */
const authenticateToken = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    // Extract token from Authorization header
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    // Verify access token with enhanced options
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'testloom-api',
      audience: 'testloom-client'
    });

    // Ensure it's an access token
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type.',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    // Check if user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated.',
        code: 'USER_DEACTIVATED'
      });
    }

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      role: user.role,
      email: user.email
    };

    next();

  } catch (error) {
    console.error('JWT verification error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        message: 'Token not active yet.',
        code: 'TOKEN_NOT_ACTIVE'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
      code: 'AUTH_ERROR'
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
