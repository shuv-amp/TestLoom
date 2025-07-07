/**
 * Request validation middleware
 * Provides common validation functions for API endpoints
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with errors
 */
const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password cannot exceed 128 characters');
  }
  
  // Optional: Add more strength requirements
  // if (!/(?=.*[a-z])/.test(password)) {
  //   errors.push('Password must contain at least one lowercase letter');
  // }
  // if (!/(?=.*[A-Z])/.test(password)) {
  //   errors.push('Password must contain at least one uppercase letter');
  // }
  // if (!/(?=.*\d)/.test(password)) {
  //   errors.push('Password must contain at least one number');
  // }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate user registration data
 */
const validateRegistration = (req, res, next) => {
  const { name, email, password, role } = req.body;
  const errors = [];

  // Validate name
  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  if (name && name.trim().length > 50) {
    errors.push('Name cannot exceed 50 characters');
  }

  // Validate email
  if (!email) {
    errors.push('Email is required');
  } else if (!isValidEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }

  // Validate role (if provided)
  if (role && !['student', 'admin', 'moderator'].includes(role)) {
    errors.push('Invalid role specified');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate login data
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push('Email is required');
  } else if (!isValidEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate password change data
 */
const validatePasswordChange = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const errors = [];

  if (!currentPassword) {
    errors.push('Current password is required');
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push('New password must be different from current password');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate profile update data
 */
const validateProfileUpdate = (req, res, next) => {
  const { name } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  if (name && name.trim().length > 50) {
    errors.push('Name cannot exceed 50 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validatePasswordChange,
  validateProfileUpdate,
  isValidEmail,
  validatePassword
};
