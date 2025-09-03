const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDocument, updateDocument, queryDocuments, COLLECTIONS } = require('../config/firebase');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

const router = express.Router();

// Middleware to authenticate JWT tokens (imported from auth.js)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'Access token is required',
    });
  }

  const jwt = require('jsonwebtoken');
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

// Middleware to check admin role
const requireAdmin = catchAsync(async (req, res, next) => {
  const user = await getDocument(COLLECTIONS.USERS, req.user.userId);

  if (!user || user.role !== 'admin') {
    throw new AppError('Admin access required', 403);
  }

  next();
});

// GET /api/users/me - Get current user profile
router.get('/me', authenticateToken, catchAsync(async (req, res) => {
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

// PUT /api/users/me - Update current user profile
router.put('/me', authenticateToken, [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('profile.bio').optional().isLength({ max: 500 }),
  body('profile.website').optional().isURL(),
  body('profile.company').optional().trim().isLength({ max: 100 }),
  body('profile.location').optional().trim().isLength({ max: 100 }),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { firstName, lastName, profile, preferences } = req.body;
  const updateData = {};

  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;

  if (firstName !== undefined || lastName !== undefined) {
    updateData.displayName = `${firstName || ''} ${lastName || ''}`.trim();
  }

  if (profile) {
    updateData['profile.bio'] = profile.bio;
    updateData['profile.website'] = profile.website;
    updateData['profile.company'] = profile.company;
    updateData['profile.location'] = profile.location;
    if (profile.avatar) updateData['profile.avatar'] = profile.avatar;
  }

  if (preferences) {
    if (preferences.theme) updateData['preferences.theme'] = preferences.theme;
    if (preferences.notifications) {
      updateData['preferences.notifications'] = preferences.notifications;
    }
  }

  await updateDocument(COLLECTIONS.USERS, req.user.userId, updateData);

  const updatedUser = await getDocument(COLLECTIONS.USERS, req.user.userId);

  res.json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user: updatedUser,
    },
  });
}));

// GET /api/users/me/stats - Get current user statistics
router.get('/me/stats', authenticateToken, catchAsync(async (req, res) => {
  const user = await getDocument(COLLECTIONS.USERS, req.user.userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Get user's apps count
  const userApps = await queryDocuments(COLLECTIONS.APPS, [
    { field: 'userId', operator: '==', value: req.user.userId },
    { field: 'isDeleted', operator: '==', value: false },
  ]);

  // Calculate storage usage (mock calculation)
  const storageUsed = userApps.reduce((total, app) => {
    return total + (app.metadata?.size || 0);
  }, 0);

  const stats = {
    appsCreated: userApps.length,
    totalViews: user.stats?.totalViews || 0,
    storageUsed: Math.round(storageUsed / (1024 * 1024)), // Convert to MB
    storageLimit: user.subscription?.storageLimit || 100,
    appsLimit: user.subscription?.appsLimit || 3,
    lastLogin: user.stats?.lastLogin,
    memberSince: user.createdAt,
  };

  res.json({
    status: 'success',
    data: {
      stats,
    },
  });
}));

// PUT /api/users/me/preferences - Update user preferences
router.put('/me/preferences', authenticateToken, [
  body('theme').optional().isIn(['light', 'dark', 'system']),
  body('notifications.email').optional().isBoolean(),
  body('notifications.push').optional().isBoolean(),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { theme, notifications } = req.body;
  const updateData = {};

  if (theme) updateData['preferences.theme'] = theme;
  if (notifications) updateData['preferences.notifications'] = notifications;

  await updateDocument(COLLECTIONS.USERS, req.user.userId, updateData);

  const user = await getDocument(COLLECTIONS.USERS, req.user.userId);

  res.json({
    status: 'success',
    message: 'Preferences updated successfully',
    data: {
      preferences: user.preferences,
    },
  });
}));

// POST /api/users/me/upload-avatar - Upload user avatar
router.post('/me/upload-avatar', authenticateToken, catchAsync(async (req, res) => {
  const { avatar } = req.body;

  if (!avatar) {
    throw new AppError('Avatar data is required', 400);
  }

  // In a real implementation, you'd handle file upload to cloud storage
  // For now, we'll just store the base64 data or URL
  await updateDocument(COLLECTIONS.USERS, req.user.userId, {
    'profile.avatar': avatar,
  });

  const user = await getDocument(COLLECTIONS.USERS, req.user.userId);

  res.json({
    status: 'success',
    message: 'Avatar uploaded successfully',
    data: {
      avatar: user.profile.avatar,
    },
  });
}));

// Admin routes

// GET /api/users - Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const { page = 1, limit = 20, search, role, status } = req.query;

  const queries = [];

  if (role) {
    queries.push({ field: 'role', operator: '==', value: role });
  }

  if (status === 'active') {
    queries.push({ field: 'isActive', operator: '==', value: true });
  } else if (status === 'inactive') {
    queries.push({ field: 'isActive', operator: '==', value: false });
  }

  const users = await queryDocuments(
    COLLECTIONS.USERS,
    queries,
    { field: 'createdAt', direction: 'desc' },
    parseInt(limit)
  );

  // Filter by search term if provided
  let filteredUsers = users;
  if (search) {
    const searchTerm = search.toLowerCase();
    filteredUsers = users.filter(user =>
      user.email.toLowerCase().includes(searchTerm) ||
      user.displayName?.toLowerCase().includes(searchTerm) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm)
    );
  }

  // Simple pagination
  const startIndex = (page - 1) * limit;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + parseInt(limit));

  res.json({
    status: 'success',
    data: {
      users: paginatedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredUsers.length / limit),
        totalUsers: filteredUsers.length,
        hasNextPage: startIndex + parseInt(limit) < filteredUsers.length,
        hasPrevPage: page > 1,
      },
    },
  });
}));

// GET /api/users/:id - Get user by ID (Admin only)
router.get('/:id', authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const { id } = req.params;

  const user = await getDocument(COLLECTIONS.USERS, id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Get user's apps
  const userApps = await queryDocuments(COLLECTIONS.APPS, [
    { field: 'userId', operator: '==', value: id },
  ]);

  res.json({
    status: 'success',
    data: {
      user: {
        ...user,
        appsCount: userApps.length,
      },
    },
  });
}));

// PUT /api/users/:id - Update user (Admin only)
router.put('/:id', authenticateToken, requireAdmin, [
  body('role').optional().isIn(['user', 'admin']),
  body('isActive').optional().isBoolean(),
  body('subscription.plan').optional().isIn(['free', 'pro', 'enterprise']),
  body('subscription.appsLimit').optional().isInt({ min: 0 }),
  body('subscription.storageLimit').optional().isInt({ min: 0 }),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { id } = req.params;
  const { role, isActive, subscription } = req.body;

  const user = await getDocument(COLLECTIONS.USERS, id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const updateData = {};
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (subscription) {
    if (subscription.plan) updateData['subscription.plan'] = subscription.plan;
    if (subscription.appsLimit !== undefined) updateData['subscription.appsLimit'] = subscription.appsLimit;
    if (subscription.storageLimit !== undefined) updateData['subscription.storageLimit'] = subscription.storageLimit;
  }

  await updateDocument(COLLECTIONS.USERS, id, updateData);

  const updatedUser = await getDocument(COLLECTIONS.USERS, id);

  logger.info(`User ${id} updated by admin ${req.user.userId}`);

  res.json({
    status: 'success',
    message: 'User updated successfully',
    data: {
      user: updatedUser,
    },
  });
}));

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const { id } = req.params;

  const user = await getDocument(COLLECTIONS.USERS, id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Soft delete - mark as inactive and set deletion date
  await updateDocument(COLLECTIONS.USERS, id, {
    isActive: false,
    deletedAt: new Date(),
    deletedBy: req.user.userId,
  });

  logger.info(`User ${id} deleted by admin ${req.user.userId}`);

  res.json({
    status: 'success',
    message: 'User deleted successfully',
  });
}));

// GET /api/users/stats/overview - Get user statistics overview (Admin only)
router.get('/stats/overview', authenticateToken, requireAdmin, catchAsync(async (req, res) => {
  const allUsers = await queryDocuments(COLLECTIONS.USERS, []);

  const stats = {
    total: allUsers.length,
    active: allUsers.filter(user => user.isActive).length,
    inactive: allUsers.filter(user => !user.isActive).length,
    admins: allUsers.filter(user => user.role === 'admin').length,
    byPlan: {
      free: allUsers.filter(user => user.subscription?.plan === 'free').length,
      pro: allUsers.filter(user => user.subscription?.plan === 'pro').length,
      enterprise: allUsers.filter(user => user.subscription?.plan === 'enterprise').length,
    },
    recentSignups: allUsers.filter(user => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return user.createdAt && new Date(user.createdAt.seconds * 1000) > oneWeekAgo;
    }).length,
  };

  res.json({
    status: 'success',
    data: {
      stats,
    },
  });
}));

module.exports = router;
