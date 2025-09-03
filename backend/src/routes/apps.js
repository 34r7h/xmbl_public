const express = require('express');
const { v4: uuidv4 } = require('uuid');
const slugify = require('slugify');
const { body, validationResult } = require('express-validator');
const {
  createDocument,
  updateDocument,
  getDocument,
  deleteDocument,
  queryDocuments,
  batchWrite,
  COLLECTIONS
} = require('../config/firebase');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

const router = express.Router();

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

// Middleware to check app ownership
const checkAppOwnership = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const app = await getDocument(COLLECTIONS.APPS, id);

  if (!app) {
    throw new AppError('App not found', 404);
  }

  if (app.userId !== req.user.userId) {
    throw new AppError('You do not have permission to access this app', 403);
  }

  req.app = app;
  next();
});

// Helper functions
const generateSubdomain = (name) => {
  const baseSlug = slugify(name, { lower: true, strict: true });
  return `${baseSlug}-${uuidv4().slice(0, 8)}`;
};

const validateAppLimits = async (userId) => {
  const user = await getDocument(COLLECTIONS.USERS, userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const userApps = await queryDocuments(COLLECTIONS.APPS, [
    { field: 'userId', operator: '==', value: userId },
    { field: 'isDeleted', operator: '==', value: false },
  ]);

  const appsLimit = user.subscription?.appsLimit || 3;

  if (userApps.length >= appsLimit) {
    throw new AppError(`You have reached your app limit of ${appsLimit}. Please upgrade your plan.`, 403);
  }

  return true;
};

// Validation middleware
const validateCreateApp = [
  body('name').trim().notEmpty().withMessage('App name is required').isLength({ max: 50 }),
  body('description').optional().isLength({ max: 500 }),
  body('category').optional().isIn(['business', 'portfolio', 'blog', 'ecommerce', 'landing', 'other']),
  body('template').optional().isString(),
];

const validateUpdateApp = [
  body('name').optional().trim().notEmpty().isLength({ max: 50 }),
  body('description').optional().isLength({ max: 500 }),
  body('category').optional().isIn(['business', 'portfolio', 'blog', 'ecommerce', 'landing', 'other']),
  body('settings').optional().isObject(),
  body('theme').optional().isObject(),
];

// Routes

// GET /api/apps - Get user's apps
router.get('/', authenticateToken, catchAsync(async (req, res) => {
  const { page = 1, limit = 20, category, status, search } = req.query;

  const queries = [
    { field: 'userId', operator: '==', value: req.user.userId },
    { field: 'isDeleted', operator: '==', value: false },
  ];

  if (category && category !== 'all') {
    queries.push({ field: 'category', operator: '==', value: category });
  }

  if (status) {
    queries.push({ field: 'status', operator: '==', value: status });
  }

  const apps = await queryDocuments(
    COLLECTIONS.APPS,
    queries,
    { field: 'updatedAt', direction: 'desc' },
    parseInt(limit) * parseInt(page)
  );

  // Filter by search term if provided
  let filteredApps = apps;
  if (search) {
    const searchTerm = search.toLowerCase();
    filteredApps = apps.filter(app =>
      app.name.toLowerCase().includes(searchTerm) ||
      app.description?.toLowerCase().includes(searchTerm)
    );
  }

  // Simple pagination
  const startIndex = (page - 1) * limit;
  const paginatedApps = filteredApps.slice(startIndex, startIndex + parseInt(limit));

  res.json({
    status: 'success',
    data: {
      apps: paginatedApps,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredApps.length / limit),
        totalApps: filteredApps.length,
        hasNextPage: startIndex + parseInt(limit) < filteredApps.length,
        hasPrevPage: page > 1,
      },
    },
  });
}));

// POST /api/apps - Create new app
router.post('/', authenticateToken, validateCreateApp, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  // Check app limits
  await validateAppLimits(req.user.userId);

  const { name, description, category = 'other', template } = req.body;
  const subdomain = generateSubdomain(name);

  const appData = {
    userId: req.user.userId,
    name,
    description: description || '',
    category,
    subdomain,
    template: template || 'blank',
    status: 'draft',
    isDeleted: false,
    settings: {
      seo: {
        title: name,
        description: description || '',
        keywords: [],
      },
      analytics: {
        enabled: false,
        googleAnalyticsId: null,
      },
      domain: {
        custom: null,
        ssl: true,
      },
    },
    theme: {
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      fontFamily: 'Inter',
      darkMode: false,
    },
    metadata: {
      version: '1.0.0',
      size: 0,
      lastDeployment: null,
      deploymentUrl: null,
    },
    stats: {
      views: 0,
      lastViewed: null,
      totalPages: 0,
      totalComponents: 0,
    },
  };

  const appId = await createDocument(COLLECTIONS.APPS, appData);

  // Create default page
  const defaultPageData = {
    appId,
    userId: req.user.userId,
    name: 'Home',
    path: '/',
    isHome: true,
    isPublished: false,
    content: {
      components: [],
      layout: 'default',
      seo: {
        title: name,
        description: description || '',
      },
    },
    metadata: {
      version: '1.0.0',
      lastModified: new Date(),
    },
  };

  await createDocument(COLLECTIONS.PAGES, defaultPageData);

  // Update user stats
  const user = await getDocument(COLLECTIONS.USERS, req.user.userId);
  await updateDocument(COLLECTIONS.USERS, req.user.userId, {
    'stats.appsCreated': (user.stats?.appsCreated || 0) + 1,
  });

  const createdApp = await getDocument(COLLECTIONS.APPS, appId);

  logger.info(`New app created: ${name} by user ${req.user.userId}`);

  res.status(201).json({
    status: 'success',
    message: 'App created successfully',
    data: {
      app: createdApp,
    },
  });
}));

// GET /api/apps/:id - Get specific app
router.get('/:id', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  const app = req.app;

  // Get app pages
  const pages = await queryDocuments(COLLECTIONS.PAGES, [
    { field: 'appId', operator: '==', value: app.id },
    { field: 'isDeleted', operator: '==', value: false },
  ], { field: 'createdAt', direction: 'asc' });

  // Get app components
  const components = await queryDocuments(COLLECTIONS.COMPONENTS, [
    { field: 'appId', operator: '==', value: app.id },
    { field: 'isDeleted', operator: '==', value: false },
  ]);

  res.json({
    status: 'success',
    data: {
      app: {
        ...app,
        pages,
        components: components.length,
      },
    },
  });
}));

// PUT /api/apps/:id - Update app
router.put('/:id', authenticateToken, checkAppOwnership, validateUpdateApp, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { name, description, category, settings, theme } = req.body;
  const updateData = {};

  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;

  if (settings) {
    updateData.settings = { ...req.app.settings, ...settings };
  }

  if (theme) {
    updateData.theme = { ...req.app.theme, ...theme };
  }

  await updateDocument(COLLECTIONS.APPS, req.params.id, updateData);

  const updatedApp = await getDocument(COLLECTIONS.APPS, req.params.id);

  res.json({
    status: 'success',
    message: 'App updated successfully',
    data: {
      app: updatedApp,
    },
  });
}));

// DELETE /api/apps/:id - Delete app
router.delete('/:id', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  const appId = req.params.id;

  // Soft delete the app
  await updateDocument(COLLECTIONS.APPS, appId, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  // Soft delete all associated pages
  const pages = await queryDocuments(COLLECTIONS.PAGES, [
    { field: 'appId', operator: '==', value: appId },
  ]);

  const batchOperations = pages.map(page => ({
    type: 'update',
    collection: COLLECTIONS.PAGES,
    docId: page.id,
    data: { isDeleted: true, deletedAt: new Date() },
  }));

  if (batchOperations.length > 0) {
    await batchWrite(batchOperations);
  }

  logger.info(`App ${appId} deleted by user ${req.user.userId}`);

  res.json({
    status: 'success',
    message: 'App deleted successfully',
  });
}));

// POST /api/apps/:id/duplicate - Duplicate app
router.post('/:id/duplicate', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  // Check app limits
  await validateAppLimits(req.user.userId);

  const originalApp = req.app;
  const { name } = req.body;

  const duplicateName = name || `${originalApp.name} (Copy)`;
  const subdomain = generateSubdomain(duplicateName);

  // Create duplicate app
  const duplicateAppData = {
    ...originalApp,
    name: duplicateName,
    subdomain,
    status: 'draft',
    metadata: {
      ...originalApp.metadata,
      lastDeployment: null,
      deploymentUrl: null,
    },
    stats: {
      views: 0,
      lastViewed: null,
      totalPages: originalApp.stats?.totalPages || 0,
      totalComponents: originalApp.stats?.totalComponents || 0,
    },
  };

  delete duplicateAppData.id;
  delete duplicateAppData.createdAt;
  delete duplicateAppData.updatedAt;

  const duplicateAppId = await createDocument(COLLECTIONS.APPS, duplicateAppData);

  // Duplicate pages
  const originalPages = await queryDocuments(COLLECTIONS.PAGES, [
    { field: 'appId', operator: '==', value: originalApp.id },
    { field: 'isDeleted', operator: '==', value: false },
  ]);

  const pageOperations = originalPages.map(page => {
    const duplicatePageData = {
      ...page,
      appId: duplicateAppId,
      isPublished: false,
    };
    delete duplicatePageData.id;
    delete duplicatePageData.createdAt;
    delete duplicatePageData.updatedAt;

    return {
      type: 'create',
      collection: COLLECTIONS.PAGES,
      docId: uuidv4(),
      data: duplicatePageData,
    };
  });

  if (pageOperations.length > 0) {
    await batchWrite(pageOperations);
  }

  const duplicateApp = await getDocument(COLLECTIONS.APPS, duplicateAppId);

  res.status(201).json({
    status: 'success',
    message: 'App duplicated successfully',
    data: {
      app: duplicateApp,
    },
  });
}));

// PUT /api/apps/:id/publish - Publish app
router.put('/:id/publish', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  const appId = req.params.id;

  // Update app status
  await updateDocument(COLLECTIONS.APPS, appId, {
    status: 'published',
    'metadata.lastDeployment': new Date(),
    'metadata.deploymentUrl': `https://${req.app.subdomain}.xmbl.app`,
  });

  // Publish all pages
  const pages = await queryDocuments(COLLECTIONS.PAGES, [
    { field: 'appId', operator: '==', value: appId },
    { field: 'isDeleted', operator: '==', value: false },
  ]);

  const publishOperations = pages.map(page => ({
    type: 'update',
    collection: COLLECTIONS.PAGES,
    docId: page.id,
    data: { isPublished: true },
  }));

  if (publishOperations.length > 0) {
    await batchWrite(publishOperations);
  }

  const publishedApp = await getDocument(COLLECTIONS.APPS, appId);

  logger.info(`App ${appId} published by user ${req.user.userId}`);

  res.json({
    status: 'success',
    message: 'App published successfully',
    data: {
      app: publishedApp,
    },
  });
}));

// PUT /api/apps/:id/unpublish - Unpublish app
router.put('/:id/unpublish', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  const appId = req.params.id;

  await updateDocument(COLLECTIONS.APPS, appId, {
    status: 'draft',
  });

  const unpublishedApp = await getDocument(COLLECTIONS.APPS, appId);

  res.json({
    status: 'success',
    message: 'App unpublished successfully',
    data: {
      app: unpublishedApp,
    },
  });
}));

// GET /api/apps/:id/analytics - Get app analytics
router.get('/:id/analytics', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  const { period = '7d' } = req.query;
  const appId = req.params.id;

  // Mock analytics data - in a real implementation, you'd fetch from analytics service
  const analytics = {
    views: {
      total: req.app.stats?.views || 0,
      period: Math.floor(Math.random() * 100),
      change: Math.floor(Math.random() * 20) - 10, // -10 to +10
    },
    visitors: {
      unique: Math.floor(Math.random() * 50),
      returning: Math.floor(Math.random() * 20),
    },
    pages: {
      mostViewed: [
        { path: '/', views: Math.floor(Math.random() * 50) },
        { path: '/about', views: Math.floor(Math.random() * 30) },
        { path: '/contact', views: Math.floor(Math.random() * 20) },
      ],
    },
    traffic: {
      sources: [
        { source: 'Direct', percentage: 45 },
        { source: 'Social Media', percentage: 30 },
        { source: 'Search', percentage: 25 },
      ],
    },
    performance: {
      loadTime: Math.random() * 2 + 1, // 1-3 seconds
      bounceRate: Math.random() * 30 + 20, // 20-50%
    },
  };

  res.json({
    status: 'success',
    data: {
      analytics,
      period,
    },
  });
}));

// PUT /api/apps/:id/settings - Update app settings
router.put('/:id/settings', authenticateToken, checkAppOwnership, [
  body('seo.title').optional().isLength({ max: 60 }),
  body('seo.description').optional().isLength({ max: 160 }),
  body('analytics.googleAnalyticsId').optional().isString(),
  body('domain.custom').optional().isURL(),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { seo, analytics, domain } = req.body;
  const currentSettings = req.app.settings || {};

  const updatedSettings = {
    ...currentSettings,
    ...(seo && { seo: { ...currentSettings.seo, ...seo } }),
    ...(analytics && { analytics: { ...currentSettings.analytics, ...analytics } }),
    ...(domain && { domain: { ...currentSettings.domain, ...domain } }),
  };

  await updateDocument(COLLECTIONS.APPS, req.params.id, {
    settings: updatedSettings,
  });

  const updatedApp = await getDocument(COLLECTIONS.APPS, req.params.id);

  res.json({
    status: 'success',
    message: 'App settings updated successfully',
    data: {
      app: updatedApp,
    },
  });
}));

module.exports = router;
