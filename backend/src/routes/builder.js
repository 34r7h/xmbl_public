const express = require('express');
const { v4: uuidv4 } = require('uuid');
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
  const { appId } = req.params;
  const app = await getDocument(COLLECTIONS.APPS, appId);

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
const generateComponentId = () => `comp_${uuidv4().replace(/-/g, '_')}`;

const validateComponent = (component) => {
  const requiredFields = ['type', 'props'];
  for (const field of requiredFields) {
    if (!component[field]) {
      throw new AppError(`Component missing required field: ${field}`, 400);
    }
  }

  const allowedTypes = [
    'text', 'heading', 'button', 'image', 'container', 'grid', 'form',
    'input', 'textarea', 'select', 'checkbox', 'radio', 'card', 'modal',
    'tabs', 'accordion', 'slider', 'gallery', 'video', 'map', 'chart',
    'list', 'table', 'navbar', 'footer', 'sidebar', 'hero', 'cta'
  ];

  if (!allowedTypes.includes(component.type)) {
    throw new AppError(`Invalid component type: ${component.type}`, 400);
  }
};

// Pages Management

// GET /api/builder/:appId/pages - Get all pages for an app
router.get('/:appId/pages', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  const pages = await queryDocuments(COLLECTIONS.PAGES, [
    { field: 'appId', operator: '==', value: req.params.appId },
    { field: 'isDeleted', operator: '==', value: false },
  ], { field: 'createdAt', direction: 'asc' });

  res.json({
    status: 'success',
    data: {
      pages,
    },
  });
}));

// POST /api/builder/:appId/pages - Create new page
router.post('/:appId/pages', authenticateToken, checkAppOwnership, [
  body('name').trim().notEmpty().withMessage('Page name is required').isLength({ max: 50 }),
  body('path').trim().notEmpty().withMessage('Page path is required'),
  body('layout').optional().isIn(['default', 'full', 'sidebar', 'centered']),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { name, path, layout = 'default', seo } = req.body;

  // Check if path already exists
  const existingPages = await queryDocuments(COLLECTIONS.PAGES, [
    { field: 'appId', operator: '==', value: req.params.appId },
    { field: 'path', operator: '==', value: path },
    { field: 'isDeleted', operator: '==', value: false },
  ]);

  if (existingPages.length > 0) {
    throw new AppError('A page with this path already exists', 409);
  }

  const pageData = {
    appId: req.params.appId,
    userId: req.user.userId,
    name,
    path: path.startsWith('/') ? path : `/${path}`,
    isHome: path === '/' || path === '',
    isPublished: false,
    isDeleted: false,
    content: {
      components: [],
      layout,
      styles: {
        backgroundColor: '#ffffff',
        padding: '20px',
        margin: '0',
      },
      seo: {
        title: seo?.title || name,
        description: seo?.description || '',
        keywords: seo?.keywords || [],
        ogImage: seo?.ogImage || null,
      },
    },
    metadata: {
      version: '1.0.0',
      lastModified: new Date(),
      modifiedBy: req.user.userId,
    },
    settings: {
      protected: false,
      redirects: [],
      cache: true,
    },
  };

  const pageId = await createDocument(COLLECTIONS.PAGES, pageData);

  // Update app stats
  await updateDocument(COLLECTIONS.APPS, req.params.appId, {
    'stats.totalPages': (req.app.stats?.totalPages || 0) + 1,
  });

  const createdPage = await getDocument(COLLECTIONS.PAGES, pageId);

  res.status(201).json({
    status: 'success',
    message: 'Page created successfully',
    data: {
      page: createdPage,
    },
  });
}));

// GET /api/builder/:appId/pages/:pageId - Get specific page
router.get('/:appId/pages/:pageId', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  const page = await getDocument(COLLECTIONS.PAGES, req.params.pageId);

  if (!page || page.appId !== req.params.appId) {
    throw new AppError('Page not found', 404);
  }

  res.json({
    status: 'success',
    data: {
      page,
    },
  });
}));

// PUT /api/builder/:appId/pages/:pageId - Update page
router.put('/:appId/pages/:pageId', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  const { name, path, content, settings } = req.body;
  const page = await getDocument(COLLECTIONS.PAGES, req.params.pageId);

  if (!page || page.appId !== req.params.appId) {
    throw new AppError('Page not found', 404);
  }

  const updateData = {
    'metadata.lastModified': new Date(),
    'metadata.modifiedBy': req.user.userId,
  };

  if (name) updateData.name = name;
  if (path) updateData.path = path.startsWith('/') ? path : `/${path}`;
  if (content) {
    // Validate components if present
    if (content.components) {
      content.components.forEach(validateComponent);
    }
    updateData.content = { ...page.content, ...content };
  }
  if (settings) updateData.settings = { ...page.settings, ...settings };

  await updateDocument(COLLECTIONS.PAGES, req.params.pageId, updateData);

  const updatedPage = await getDocument(COLLECTIONS.PAGES, req.params.pageId);

  res.json({
    status: 'success',
    message: 'Page updated successfully',
    data: {
      page: updatedPage,
    },
  });
}));

// DELETE /api/builder/:appId/pages/:pageId - Delete page
router.delete('/:appId/pages/:pageId', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  const page = await getDocument(COLLECTIONS.PAGES, req.params.pageId);

  if (!page || page.appId !== req.params.appId) {
    throw new AppError('Page not found', 404);
  }

  if (page.isHome) {
    throw new AppError('Cannot delete the home page', 400);
  }

  await updateDocument(COLLECTIONS.PAGES, req.params.pageId, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  // Update app stats
  await updateDocument(COLLECTIONS.APPS, req.params.appId, {
    'stats.totalPages': Math.max((req.app.stats?.totalPages || 1) - 1, 0),
  });

  res.json({
    status: 'success',
    message: 'Page deleted successfully',
  });
}));

// Components Management

// GET /api/builder/:appId/components - Get custom components for an app
router.get('/:appId/components', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  const components = await queryDocuments(COLLECTIONS.COMPONENTS, [
    { field: 'appId', operator: '==', value: req.params.appId },
    { field: 'isDeleted', operator: '==', value: false },
  ], { field: 'createdAt', direction: 'desc' });

  res.json({
    status: 'success',
    data: {
      components,
    },
  });
}));

// POST /api/builder/:appId/components - Create custom component
router.post('/:appId/components', authenticateToken, checkAppOwnership, [
  body('name').trim().notEmpty().withMessage('Component name is required'),
  body('template').notEmpty().withMessage('Component template is required'),
  body('props').optional().isObject(),
  body('styles').optional().isObject(),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { name, description, template, props, styles, category } = req.body;

  const componentData = {
    appId: req.params.appId,
    userId: req.user.userId,
    name,
    description: description || '',
    template,
    props: props || {},
    styles: styles || {},
    category: category || 'custom',
    isDeleted: false,
    metadata: {
      version: '1.0.0',
      usageCount: 0,
      lastModified: new Date(),
    },
  };

  const componentId = await createDocument(COLLECTIONS.COMPONENTS, componentData);
  const createdComponent = await getDocument(COLLECTIONS.COMPONENTS, componentId);

  res.status(201).json({
    status: 'success',
    message: 'Component created successfully',
    data: {
      component: createdComponent,
    },
  });
}));

// PUT /api/builder/:appId/components/:componentId - Update custom component
router.put('/:appId/components/:componentId', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  const component = await getDocument(COLLECTIONS.COMPONENTS, req.params.componentId);

  if (!component || component.appId !== req.params.appId) {
    throw new AppError('Component not found', 404);
  }

  const { name, description, template, props, styles } = req.body;
  const updateData = {
    'metadata.lastModified': new Date(),
  };

  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (template) updateData.template = template;
  if (props) updateData.props = { ...component.props, ...props };
  if (styles) updateData.styles = { ...component.styles, ...styles };

  await updateDocument(COLLECTIONS.COMPONENTS, req.params.componentId, updateData);

  const updatedComponent = await getDocument(COLLECTIONS.COMPONENTS, req.params.componentId);

  res.json({
    status: 'success',
    message: 'Component updated successfully',
    data: {
      component: updatedComponent,
    },
  });
}));

// DELETE /api/builder/:appId/components/:componentId - Delete custom component
router.delete('/:appId/components/:componentId', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  const component = await getDocument(COLLECTIONS.COMPONENTS, req.params.componentId);

  if (!component || component.appId !== req.params.appId) {
    throw new AppError('Component not found', 404);
  }

  await updateDocument(COLLECTIONS.COMPONENTS, req.params.componentId, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  res.json({
    status: 'success',
    message: 'Component deleted successfully',
  });
}));

// Functions Management

// GET /api/builder/:appId/functions - Get custom functions for an app
router.get('/:appId/functions', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  const functions = await queryDocuments(COLLECTIONS.FUNCTIONS, [
    { field: 'appId', operator: '==', value: req.params.appId },
    { field: 'isDeleted', operator: '==', value: false },
  ], { field: 'createdAt', direction: 'desc' });

  res.json({
    status: 'success',
    data: {
      functions,
    },
  });
}));

// POST /api/builder/:appId/functions - Create custom function
router.post('/:appId/functions', authenticateToken, checkAppOwnership, [
  body('name').trim().notEmpty().withMessage('Function name is required'),
  body('code').notEmpty().withMessage('Function code is required'),
  body('trigger').isIn(['click', 'load', 'submit', 'change', 'custom']),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      message: 'Validation failed',
      errors: errors.array(),
    });
  }

  const { name, description, code, trigger, parameters } = req.body;

  const functionData = {
    appId: req.params.appId,
    userId: req.user.userId,
    name,
    description: description || '',
    code,
    trigger,
    parameters: parameters || [],
    isActive: true,
    isDeleted: false,
    metadata: {
      version: '1.0.0',
      lastModified: new Date(),
      lastExecuted: null,
      executionCount: 0,
    },
  };

  const functionId = await createDocument(COLLECTIONS.FUNCTIONS, functionData);
  const createdFunction = await getDocument(COLLECTIONS.FUNCTIONS, functionId);

  res.status(201).json({
    status: 'success',
    message: 'Function created successfully',
    data: {
      function: createdFunction,
    },
  });
}));

// PUT /api/builder/:appId/functions/:functionId - Update custom function
router.put('/:appId/functions/:functionId', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  const func = await getDocument(COLLECTIONS.FUNCTIONS, req.params.functionId);

  if (!func || func.appId !== req.params.appId) {
    throw new AppError('Function not found', 404);
  }

  const { name, description, code, trigger, parameters, isActive } = req.body;
  const updateData = {
    'metadata.lastModified': new Date(),
  };

  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (code) updateData.code = code;
  if (trigger) updateData.trigger = trigger;
  if (parameters) updateData.parameters = parameters;
  if (isActive !== undefined) updateData.isActive = isActive;

  await updateDocument(COLLECTIONS.FUNCTIONS, req.params.functionId, updateData);

  const updatedFunction = await getDocument(COLLECTIONS.FUNCTIONS, req.params.functionId);

  res.json({
    status: 'success',
    message: 'Function updated successfully',
    data: {
      function: updatedFunction,
    },
  });
}));

// DELETE /api/builder/:appId/functions/:functionId - Delete custom function
router.delete('/:appId/functions/:functionId', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  const func = await getDocument(COLLECTIONS.FUNCTIONS, req.params.functionId);

  if (!func || func.appId !== req.params.appId) {
    throw new AppError('Function not found', 404);
  }

  await updateDocument(COLLECTIONS.FUNCTIONS, req.params.functionId, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  res.json({
    status: 'success',
    message: 'Function deleted successfully',
  });
}));

// Templates Management

// GET /api/builder/templates - Get available templates
router.get('/templates', authenticateToken, catchAsync(async (req, res) => {
  const { category, search } = req.query;

  // Mock template data - in a real implementation, this would come from database
  const templates = [
    {
      id: 'blank',
      name: 'Blank Template',
      description: 'Start from scratch with an empty canvas',
      category: 'basic',
      thumbnail: '/templates/blank.jpg',
      features: ['responsive', 'seo-ready'],
      components: [],
    },
    {
      id: 'business',
      name: 'Business Landing',
      description: 'Professional business landing page template',
      category: 'business',
      thumbnail: '/templates/business.jpg',
      features: ['hero-section', 'contact-form', 'testimonials'],
      components: [
        {
          type: 'hero',
          props: { title: 'Your Business Name', subtitle: 'Professional services you can trust' },
        },
        {
          type: 'container',
          props: { className: 'services' },
          children: [
            { type: 'heading', props: { level: 2, text: 'Our Services' } },
            { type: 'grid', props: { columns: 3 } },
          ],
        },
      ],
    },
    {
      id: 'portfolio',
      name: 'Portfolio Showcase',
      description: 'Creative portfolio template for designers and developers',
      category: 'portfolio',
      thumbnail: '/templates/portfolio.jpg',
      features: ['gallery', 'animations', 'dark-mode'],
      components: [
        {
          type: 'navbar',
          props: { brand: 'Your Name', links: ['Home', 'Portfolio', 'About', 'Contact'] },
        },
        {
          type: 'hero',
          props: { title: 'Creative Professional', subtitle: 'Bringing ideas to life' },
        },
      ],
    },
    {
      id: 'blog',
      name: 'Blog Template',
      description: 'Clean and minimal blog template',
      category: 'blog',
      thumbnail: '/templates/blog.jpg',
      features: ['article-layout', 'comments', 'sidebar'],
      components: [
        {
          type: 'navbar',
          props: { brand: 'My Blog' },
        },
        {
          type: 'container',
          props: { className: 'blog-layout' },
        },
      ],
    },
  ];

  let filteredTemplates = templates;

  if (category && category !== 'all') {
    filteredTemplates = templates.filter(template => template.category === category);
  }

  if (search) {
    const searchTerm = search.toLowerCase();
    filteredTemplates = filteredTemplates.filter(template =>
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm)
    );
  }

  res.json({
    status: 'success',
    data: {
      templates: filteredTemplates,
    },
  });
}));

// POST /api/builder/:appId/apply-template - Apply template to app
router.post('/:appId/apply-template', authenticateToken, checkAppOwnership, [
  body('templateId').notEmpty().withMessage('Template ID is required'),
], catchAsync(async (req, res) => {
  const { templateId, overwrite = false } = req.body;

  // Get template data (mock implementation)
  const templates = {
    blank: { components: [] },
    business: {
      components: [
        {
          id: generateComponentId(),
          type: 'hero',
          props: {
            title: 'Your Business Name',
            subtitle: 'Professional services you can trust',
            buttonText: 'Get Started',
            backgroundImage: '/images/hero-bg.jpg',
          },
          styles: {
            padding: '80px 0',
            textAlign: 'center',
          },
        },
        {
          id: generateComponentId(),
          type: 'container',
          props: {
            className: 'services-section',
          },
          children: [
            {
              id: generateComponentId(),
              type: 'heading',
              props: {
                level: 2,
                text: 'Our Services',
              },
            },
            {
              id: generateComponentId(),
              type: 'grid',
              props: {
                columns: 3,
                gap: '2rem',
              },
              children: [
                {
                  id: generateComponentId(),
                  type: 'card',
                  props: {
                    title: 'Service 1',
                    description: 'Description of your first service',
                  },
                },
                {
                  id: generateComponentId(),
                  type: 'card',
                  props: {
                    title: 'Service 2',
                    description: 'Description of your second service',
                  },
                },
                {
                  id: generateComponentId(),
                  type: 'card',
                  props: {
                    title: 'Service 3',
                    description: 'Description of your third service',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  };

  const template = templates[templateId];
  if (!template) {
    throw new AppError('Template not found', 404);
  }

  // Get app's home page
  const pages = await queryDocuments(COLLECTIONS.PAGES, [
    { field: 'appId', operator: '==', value: req.params.appId },
    { field: 'isHome', operator: '==', value: true },
    { field: 'isDeleted', operator: '==', value: false },
  ]);

  if (pages.length === 0) {
    throw new AppError('Home page not found', 404);
  }

  const homePage = pages[0];

  // Apply template to home page
  const updatedContent = {
    ...homePage.content,
    components: overwrite ? template.components : [...homePage.content.components, ...template.components],
  };

  await updateDocument(COLLECTIONS.PAGES, homePage.id, {
    content: updatedContent,
    'metadata.lastModified': new Date(),
    'metadata.modifiedBy': req.user.userId,
  });

  const updatedPage = await getDocument(COLLECTIONS.PAGES, homePage.id);

  res.json({
    status: 'success',
    message: 'Template applied successfully',
    data: {
      page: updatedPage,
    },
  });
}));

// Code Generation

// GET /api/builder/:appId/export - Export app as code
router.get('/:appId/export', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  const { format = 'vue' } = req.query;

  // Get all pages
  const pages = await queryDocuments(COLLECTIONS.PAGES, [
    { field: 'appId', operator: '==', value: req.params.appId },
    { field: 'isDeleted', operator: '==', value: false },
  ]);

  // Get custom components
  const components = await queryDocuments(COLLECTIONS.COMPONENTS, [
    { field: 'appId', operator: '==', value: req.params.appId },
    { field: 'isDeleted', operator: '==', value: false },
  ]);

  // Get custom functions
  const functions = await queryDocuments(COLLECTIONS.FUNCTIONS, [
    { field: 'appId', operator: '==', value: req.params.appId },
    { field: 'isDeleted', operator: '==', value: false },
  ]);

  // Generate code based on format
  const exportData = {
    format,
    app: req.app,
    pages: pages.map(page => ({
      ...page,
      filename: `${page.path.replace('/', '') || 'home'}.vue`,
    })),
    components,
    functions,
    generatedAt: new Date(),
  };

  res.json({
    status: 'success',
    data: {
      export: exportData,
    },
  });
}));

module.exports = router;
