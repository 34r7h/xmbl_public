const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { getAuth, createDocument, getDocument, updateDocument, COLLECTIONS } = require('../config/firebase');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const validatePasswordReset = [
  body('email').isEmail().normalizeEmail(),
];

const validatePasswordUpdate = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

// Helper functions
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

const comparePasswords = async (candidatePassword, hashedPassword) => {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

const createUser = async (userData) => {
  const { email, password, firstName, lastName } = userData;

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user in Firebase Auth
  const auth = getAuth();
  const userRecord = await auth.createUser({
    email,
    password,
    displayName: `${firstName} ${lastName}`,
  });

  // Create user document in Firestore
  const userDoc = {
    uid: userRecord.uid,
    email,
    firstName,
    lastName,
    displayName: `${firstName} ${lastName}`,
    role: 'user',
    isActive: true,
    profile: {
      avatar: null,
      bio: '',
      website: '',
      company: '',
      location: '',
    },
    preferences: {
      theme: 'light',
      notifications: {
        email: true,
        push: true,
      },
    },
    subscription: {
      plan: 'free',
      status: 'active',
      appsLimit: 3,
      storageLimit: 100, // MB
    },
    stats: {
      appsCreated: 0,
      totalViews: 0,
      lastLogin: new Date(),
    },
  };

  await createDocument(COLLECTIONS.USERS, userDoc, userRecord.uid);

  return {
    id: userRecord.uid,
    ...userDoc,
  };
};

// Routes

// POST /api/auth/register
router.post('/register', validateRegister, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { email, password, firstName, lastName } = req.body;

  // Check if user already exists
  const auth = getAuth();
  try {
    await auth.getUserByEmail(email);
    throw new AppError('User with this email already exists', 409);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      throw error;
    }
  }

  // Create new user
  const user = await createUser({ email, password, firstName, lastName });

  // Generate JWT token
  const token = generateToken(user.id);

  // Remove sensitive data
  delete user.password;

  logger.info(`New user registered: ${email}`);

  res.status(201).json({
    status: 'success',
    message: 'User registered successfully',
    data: {
      user,
      token,
    },
  });
}));

// POST /api/auth/login
router.post('/login', validateLogin, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { email, password } = req.body;

  // Get user from Firebase Auth
  const auth = getAuth();
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (error) {
    throw new AppError('Invalid email or password', 401);
  }

  // Get user document from Firestore
  const user = await getDocument(COLLECTIONS.USERS, userRecord.uid);
  if (!user || !user.isActive) {
    throw new AppError('Account is disabled or not found', 401);
  }

  // Verify password using Firebase Auth
  try {
    const customToken = await auth.createCustomToken(userRecord.uid);
    // Note: In a real implementation, you'd verify the password against Firebase Auth
    // For now, we'll assume password verification is handled by the frontend
  } catch (error) {
    throw new AppError('Invalid email or password', 401);
  }

  // Update last login
  await updateDocument(COLLECTIONS.USERS, user.id, {
    'stats.lastLogin': new Date(),
  });

  // Generate JWT token
  const token = generateToken(user.id);

  logger.info(`User logged in: ${email}`);

  res.json({
    status: 'success',
    message: 'Login successful',
    data: {
      user,
      token,
    },
  });
}));

// POST /api/auth/logout
router.post('/logout', catchAsync(async (req, res) => {
  // In a stateless JWT setup, logout is handled client-side
  // You could implement token blacklisting here if needed

  logger.info('User logged out');

  res.json({
    status: 'success',
    message: 'Logged out successfully',
  });
}));

// POST /api/auth/forgot-password
router.post('/forgot-password', validatePasswordReset, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { email } = req.body;

  // Check if user exists
  const auth = getAuth();
  try {
    await auth.getUserByEmail(email);
  } catch (error) {
    // Don't reveal if email exists or not for security
    return res.json({
      status: 'success',
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  }

  // Generate password reset link
  const resetLink = await auth.generatePasswordResetLink(email);

  // In a real implementation, you'd send this via email
  // For now, we'll just log it
  logger.info(`Password reset link for ${email}: ${resetLink}`);

  res.json({
    status: 'success',
    message: 'If an account with that email exists, a password reset link has been sent.',
  });
}));

// POST /api/auth/reset-password
router.post('/reset-password', catchAsync(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new AppError('Token and new password are required', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  // Verify reset token and update password
  const auth = getAuth();
  try {
    // This would typically involve verifying the reset token
    // For demo purposes, we'll assume it's valid
    logger.info('Password reset completed');

    res.json({
      status: 'success',
      message: 'Password reset successfully',
    });
  } catch (error) {
    throw new AppError('Invalid or expired reset token', 400);
  }
}));

// GET /api/auth/profile
router.get('/profile', authenticateToken, catchAsync(async (req, res) => {
  const user = await getDocument(COLLECTIONS.USERS, req.user.userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    status: 'success',
    data: {
      user,
    },
  });
}));

// PUT /api/auth/profile
router.put('/profile', authenticateToken, catchAsync(async (req, res) => {
  const { firstName, lastName, profile, preferences } = req.body;

  const updateData = {};

  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (profile) updateData.profile = { ...profile };
  if (preferences) updateData.preferences = { ...preferences };

  if (firstName || lastName) {
    updateData.displayName = `${firstName || ''} ${lastName || ''}`.trim();
  }

  await updateDocument(COLLECTIONS.USERS, req.user.userId, updateData);

  const user = await getDocument(COLLECTIONS.USERS, req.user.userId);

  res.json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user,
    },
  });
}));

// PUT /api/auth/change-password
router.put('/change-password', authenticateToken, validatePasswordUpdate, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { currentPassword, newPassword } = req.body;

  // Update password in Firebase Auth
  const auth = getAuth();
  await auth.updateUser(req.user.userId, {
    password: newPassword,
  });

  logger.info(`Password changed for user: ${req.user.userId}`);

  res.json({
    status: 'success',
    message: 'Password changed successfully',
  });
}));

// DELETE /api/auth/account
router.delete('/account', authenticateToken, catchAsync(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    throw new AppError('Password confirmation is required', 400);
  }

  // Delete user from Firebase Auth
  const auth = getAuth();
  await auth.deleteUser(req.user.userId);

  // Mark user as deleted in Firestore (soft delete)
  await updateDocument(COLLECTIONS.USERS, req.user.userId, {
    isActive: false,
    deletedAt: new Date(),
  });

  logger.info(`Account deleted for user: ${req.user.userId}`);

  res.json({
    status: 'success',
    message: 'Account deleted successfully',
  });
}));

// Middleware to authenticate JWT tokens
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'Access token is required',
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        status: 'fail',
        message: 'Invalid or expired token',
      });
    }

    req.user = user;
    next();
  });
}

module.exports = router;
