const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const crypto = require('crypto');

/**
 * Generate JWT Access Token
 * @param {string} userId - User ID to encode in token
 * @returns {string} - JWT access token
 */
const generateAccessToken = (userId) => {
  const token = jwt.sign(
    {
      userId,
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
      issuer: 'testloom-api',
      audience: 'testloom-client'
    }
  );
  return token;
};

/**
 * Generate JWT Refresh Token with unique identifier
 * @param {string} userId - User ID to encode in token
 * @returns {object} - Object containing refresh token and token ID
 */
const generateRefreshToken = (userId) => {
  const tokenId = crypto.randomUUID();
  const token = jwt.sign(
    {
      userId,
      tokenId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'testloom-api',
      audience: 'testloom-client'
    }
  );
  return { token, tokenId };
};

/**
 * Hashes the refresh token for storing in the database
 * @param {string} token - The refresh token
 * @returns {string} - The hashed token
 */
const hashRefreshToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Set secure refresh token cookie
 * @param {object} res - Express response object
 * @param {string} token - The refresh token
 */
const setRefreshTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth'
  });
};

/**
 * Clear refresh token cookie
 * @param {object} res - Express response object
 */
const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/auth'
  });
};

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      role: role || 'student'
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshTokenData = generateRefreshToken(user._id);

    // Hash and save refresh token with token ID
    user.refreshTokens = [{
      tokenId: refreshTokenData.tokenId,
      token: hashRefreshToken(refreshTokenData.token),
      createdAt: new Date(),
      userAgent: req.get('User-Agent') || 'Unknown',
      ipAddress: req.ip || req.connection.remoteAddress
    }];

    await user.save();

    // Set refresh token in secure cookie
    setRefreshTokenCookie(res, refreshTokenData.token);

    // Set security headers
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    // Find user and include password and refreshTokens fields
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshTokens');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Clean up expired refresh tokens (keep only last 5 active sessions)
    const now = new Date();
    user.refreshTokens = user.refreshTokens.filter(rt => {
      const tokenAge = now - rt.createdAt;
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      return tokenAge < maxAge;
    }).slice(-4); // Keep only 4 previous tokens, will add 1 new

    // Generate new tokens
    const accessToken = generateAccessToken(user._id);
    const refreshTokenData = generateRefreshToken(user._id);

    // Add new refresh token to user
    user.refreshTokens.push({
      tokenId: refreshTokenData.tokenId,
      token: hashRefreshToken(refreshTokenData.token),
      createdAt: new Date(),
      userAgent: req.get('User-Agent') || 'Unknown',
      ipAddress: req.ip || req.connection.remoteAddress
    });

    user.lastLogin = new Date();
    await user.save();

    // Set refresh token in secure cookie
    setRefreshTokenCookie(res, refreshTokenData.token);

    // Set security headers
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin
        },
        accessToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Refresh access token using refresh token rotation
 * @route POST /api/auth/refresh-token
 * @access Public
 */
const refreshToken = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token not found'
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, {
      issuer: 'testloom-api',
      audience: 'testloom-client'
    });

    // Ensure it's a refresh token
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Find user and check if refresh token is valid
    const user = await User.findById(decoded.userId).select('+refreshTokens');
    if (!user) {
      clearRefreshTokenCookie(res);
      return res.status(403).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find the specific refresh token
    const hashedToken = hashRefreshToken(refreshToken);
    const tokenIndex = user.refreshTokens.findIndex(rt =>
      rt.token === hashedToken && rt.tokenId === decoded.tokenId
    );

    if (tokenIndex === -1) {
      // Possible token reuse attack - invalidate all tokens
      user.refreshTokens = [];
      await user.save();
      clearRefreshTokenCookie(res);
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token - all sessions terminated'
      });
    }

    // Remove the used refresh token (rotation)
    user.refreshTokens.splice(tokenIndex, 1);

    // Generate new tokens
    const accessToken = generateAccessToken(user._id);
    const newRefreshTokenData = generateRefreshToken(user._id);

    // Add new refresh token
    user.refreshTokens.push({
      tokenId: newRefreshTokenData.tokenId,
      token: hashRefreshToken(newRefreshTokenData.token),
      createdAt: new Date(),
      userAgent: req.get('User-Agent') || 'Unknown',
      ipAddress: req.ip || req.connection.remoteAddress
    });

    await user.save();

    // Set new refresh token in cookie
    setRefreshTokenCookie(res, newRefreshTokenData.token);

    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        accessToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    clearRefreshTokenCookie(res);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired. Please login again.'
      });
    }

    res.status(403).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

/**
 * Logout user from current session
 * @route POST /api/auth/logout
 * @access Private
 */
const logoutUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Decode to get token ID for targeted removal
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(userId).select('+refreshTokens');

        if (user && decoded.tokenId) {
          // Remove only the current refresh token
          user.refreshTokens = user.refreshTokens.filter(rt => rt.tokenId !== decoded.tokenId);
          await user.save();
        }
      } catch (error) {
        console.error('Error removing specific refresh token:', error);
      }
    }

    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Logout user from all sessions
 * @route POST /api/auth/logout-all
 * @access Private
 */
const logoutAllSessions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('+refreshTokens');

    if (user) {
      user.refreshTokens = [];
      await user.save();
    }

    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: 'Logged out from all sessions'
    });

  } catch (error) {
    console.error('Logout all sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get current user from session (cookie)
 * @route GET /api/auth/me
 * @access Private
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/profile
 * @access Private
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/auth/profile
 * @access Private
 */
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.userId;

    const user = await User.findByIdAndUpdate(
      userId,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Change user password
 * @route PUT /api/auth/password
 * @access Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Find user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  logoutAllSessions,
  getCurrentUser,
  getUserProfile,
  updateProfile,
  changePassword
};
