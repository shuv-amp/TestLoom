const express = require('express');
const router = express.Router();
const { registerUser, loginUser, refreshToken, logoutUser, getUserProfile, updateProfile, changePassword, getCurrentUser } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateRegistration, validateLogin, validatePasswordChange, validateProfileUpdate } = require('../middleware/validation');

/**
 * Authentication Routes
 * Handles user registration, login, and profile management
 */

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegistration, registerUser);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, loginUser);

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public (requires refresh token cookie)
router.post('/refresh-token', refreshToken);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, logoutUser);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, getUserProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, validateProfileUpdate, updateProfile);

// @route   PUT /api/auth/password
// @desc    Change user password
// @access  Private
router.put('/password', authenticateToken, validatePasswordChange, changePassword);

// @route   GET /api/auth/me
// @desc    Get current user from session (cookie)
// @access  Private
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router;
