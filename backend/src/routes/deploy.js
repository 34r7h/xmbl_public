const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const {
  createDocument,
  updateDocument,
  getDocument,
  queryDocuments,
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
const generateDeploymentId = () => `deploy_${uuidv4()}`;

const validateAppForDeployment = async (appId) => {
  // Get app pages
  const pages = await queryDocuments(COLLECTIONS.PAGES, [
    { field: 'appId', operator: '==', value: appId },
    { field: 'isDeleted', operator: '==', value: false },
  ]);

  if (pages.length === 0) {
    throw new AppError('App must have at least one page to deploy', 400);
  }

  const homePage = pages.find(page => page.isHome);
  if (!homePage) {
    throw new AppError('App must have a home page to deploy', 400);
  }

  return { pages, homePage };
};

const generateVueApp = (app, pages, components, functions) => {
  // Generate Vue.js application structure
  const vueApp = {
    'package.json': {
      name: app.subdomain,
      version: '1.0.0',
      private: true,
      scripts: {
        serve: 'vue-cli-service serve',
        build: 'vue-cli-service build',
        lint: 'vue-cli-service lint'
      },
      dependencies: {
        'vue': '^3.2.13',
        'vue-router': '^4.0.3',
        '@vue/cli-service': '^5.0.0'
      }
    },
    'src/main.js': `import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

const routes = [
${pages.map(page => `  {
    path: '${page.path}',
    name: '${page.name.replace(/\s+/g, '')}',
    component: () => import('./views/${page.name.replace(/\s+/g, '')}.vue')
  }`).join(',\n')}
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

createApp(App).use(router).mount('#app')`,
    'src/App.vue': `<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
body {
  margin: 0;
  font-family: ${app.theme?.fontFamily || 'Inter'}, -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: ${app.theme?.backgroundColor || '#ffffff'};
  color: ${app.theme?.textColor || '#1a1a1a'};
}

* {
  box-sizing: border-box;
}
</style>`
  };

  // Generate Vue components for each page
  pages.forEach(page => {
    const componentName = page.name.replace(/\s+/g, '');
    vueApp[`src/views/${componentName}.vue`] = generateVuePageComponent(page, app);
  });

  // Generate custom components
  components.forEach(component => {
    vueApp[`src/components/${component.name}.vue`] = generateVueCustomComponent(component);
  });

  return vueApp;
};

const generateVuePageComponent = (page, app) => {
  const components = page.content?.components || [];

  return `<template>
  <div class="page-${page.name.toLowerCase().replace(/\s+/g, '-')}">
${generateVueTemplate(components)}
  </div>
</template>

<script>
export default {
  name: '${page.name.replace(/\s+/g, '')}',
  data() {
    return {
      // Page data
    }
  },
  methods: {
    // Page methods
  },
  mounted() {
    // Set page title
    document.title = '${page.content?.seo?.title || page.name} | ${app.name}';

    // Set meta description
    if ('${page.content?.seo?.description}') {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.content = '${page.content?.seo?.description}';
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = '${page.content?.seo?.description}';
        document.getElementsByTagName('head')[0].appendChild(meta);
      }
    }
  }
}
</script>

<style scoped>
${generateVueStyles(page.content?.styles)}
</style>`;
};

const generateVueTemplate = (components) => {
  if (!components || components.length === 0) {
    return '    <div class="empty-page">This page is empty</div>';
  }

  return components.map(component => {
    switch (component.type) {
      case 'heading':
        return `    <h${component.props?.level || 1} class="heading">${component.props?.text || ''}</h${component.props?.level || 1}>`;
      case 'text':
        return `    <p class="text">${component.props?.content || ''}</p>`;
      case 'button':
        return `    <button class="btn" @click="handleClick">${component.props?.text || 'Button'}</button>`;
      case 'image':
        return `    <img src="${component.props?.src || ''}" alt="${component.props?.alt || ''}" class="image" />`;
      case 'container':
        const children = component.children ? generateVueTemplate(component.children) : '';
        return `    <div class="container ${component.props?.className || ''}">
${children}
    </div>`;
      case 'hero':
        return `    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">${component.props?.title || ''}</h1>
        <p class="hero-subtitle">${component.props?.subtitle || ''}</p>
        ${component.props?.buttonText ? `<button class="hero-button">${component.props.buttonText}</button>` : ''}
      </div>
    </section>`;
      case 'card':
        return `    <div class="card">
      <h3 class="card-title">${component.props?.title || ''}</h3>
      <p class="card-description">${component.props?.description || ''}</p>
    </div>`;
      case 'grid':
        const gridChildren = component.children ? generateVueTemplate(component.children) : '';
        return `    <div class="grid" style="grid-template-columns: repeat(${component.props?.columns || 1}, 1fr); gap: ${component.props?.gap || '1rem'};">
${gridChildren}
    </div>`;
      default:
        return `    <div class="${component.type}"><!-- ${component.type} component --></div>`;
    }
  }).join('\n');
};

const generateVueStyles = (styles) => {
  if (!styles) return '';

  let css = '';
  Object.entries(styles).forEach(([key, value]) => {
    const kebabKey = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    css += `  ${kebabKey}: ${value};\n`;
  });
  return css;
};

const generateVueCustomComponent = (component) => {
  return `<template>
  <div class="custom-${component.name.toLowerCase()}">
    ${component.template || '<!-- Custom component template -->'}
  </div>
</template>

<script>
export default {
  name: '${component.name}',
  props: ${JSON.stringify(component.props || {}, null, 2)},
  data() {
    return {
      // Component data
    }
  }
}
</script>

<style scoped>
${generateVueStyles(component.styles)}
</style>`;
};

// Routes

// GET /api/deploy/:appId/deployments - Get deployment history
router.get('/:appId/deployments', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  const deployments = await queryDocuments(COLLECTIONS.DEPLOYMENTS, [
    { field: 'appId', operator: '==', value: req.params.appId },
  ], { field: 'createdAt', direction: 'desc' });

  res.json({
    status: 'success',
    data: {
      deployments,
    },
  });
}));

// POST /api/deploy/:appId - Deploy app
router.post('/:appId', authenticateToken, checkAppOwnership, [
  body('environment').optional().isIn(['staging', 'production']),
  body('message').optional().isString(),
], catchAsync(async (req, res) => {
  const { environment = 'production', message } = req.body;
  const appId = req.params.appId;

  // Validate app for deployment
  const { pages } = await validateAppForDeployment(appId);

  // Get custom components and functions
  const components = await queryDocuments(COLLECTIONS.COMPONENTS, [
    { field: 'appId', operator: '==', value: appId },
    { field: 'isDeleted', operator: '==', value: false },
  ]);

  const functions = await queryDocuments(COLLECTIONS.FUNCTIONS, [
    { field: 'appId', operator: '==', value: appId },
    { field: 'isDeleted', operator: '==', value: false },
    { field: 'isActive', operator: '==', value: true },
  ]);

  // Generate deployment
  const deploymentId = generateDeploymentId();
  const deploymentUrl = `https://${req.app.subdomain}.xmbl.app`;

  // Generate Vue.js app
  const vueApp = generateVueApp(req.app, pages, components, functions);

  // Create deployment record
  const deploymentData = {
    id: deploymentId,
    appId,
    userId: req.user.userId,
    environment,
    status: 'building',
    message: message || `Deployment on ${new Date().toLocaleDateString()}`,
    url: deploymentUrl,
    buildConfig: {
      framework: 'vue',
      nodeVersion: '18.x',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
    },
    files: vueApp,
    metadata: {
      pagesCount: pages.length,
      componentsCount: components.length,
      functionsCount: functions.length,
      buildTime: null,
      size: null,
    },
  };

  const deploymentDocId = await createDocument(COLLECTIONS.DEPLOYMENTS, deploymentData);

  // Simulate deployment process
  setTimeout(async () => {
    try {
      // Update deployment status to success
      await updateDocument(COLLECTIONS.DEPLOYMENTS, deploymentDocId, {
        status: 'success',
        'metadata.buildTime': Math.floor(Math.random() * 120 + 30), // 30-150 seconds
        'metadata.size': Math.floor(Math.random() * 5 + 1), // 1-6 MB
        deployedAt: new Date(),
      });

      // Update app metadata
      await updateDocument(COLLECTIONS.APPS, appId, {
        status: 'published',
        'metadata.lastDeployment': new Date(),
        'metadata.deploymentUrl': deploymentUrl,
      });

      logger.info(`Deployment ${deploymentId} completed successfully`);
    } catch (error) {
      logger.error(`Deployment ${deploymentId} failed:`, error);

      await updateDocument(COLLECTIONS.DEPLOYMENTS, deploymentDocId, {
        status: 'failed',
        error: error.message,
      });
    }
  }, 5000); // Simulate 5 second build time

  res.status(202).json({
    status: 'success',
    message: 'Deployment started successfully',
    data: {
      deploymentId,
      status: 'building',
      url: deploymentUrl,
      estimatedBuildTime: '2-3 minutes',
    },
  });
}));

// GET /api/deploy/:appId/status/:deploymentId - Get deployment status
router.get('/:appId/status/:deploymentId', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  const { deploymentId } = req.params;

  const deployment = await getDocument(COLLECTIONS.DEPLOYMENTS, deploymentId);

  if (!deployment || deployment.appId !== req.params.appId) {
    throw new AppError('Deployment not found', 404);
  }

  res.json({
    status: 'success',
    data: {
      deployment: {
        id: deployment.id,
        status: deployment.status,
        url: deployment.url,
        message: deployment.message,
        environment: deployment.environment,
        createdAt: deployment.createdAt,
        deployedAt: deployment.deployedAt,
        metadata: deployment.metadata,
        error: deployment.error,
      },
    },
  });
}));

// POST /api/deploy/:appId/rollback/:deploymentId - Rollback to previous deployment
router.post('/:appId/rollback/:deploymentId', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  const { deploymentId } = req.params;

  const deployment = await getDocument(COLLECTIONS.DEPLOYMENTS, deploymentId);

  if (!deployment || deployment.appId !== req.params.appId) {
    throw new AppError('Deployment not found', 404);
  }

  if (deployment.status !== 'success') {
    throw new AppError('Can only rollback to successful deployments', 400);
  }

  // Create rollback deployment
  const rollbackId = generateDeploymentId();
  const rollbackData = {
    id: rollbackId,
    appId: req.params.appId,
    userId: req.user.userId,
    environment: deployment.environment,
    status: 'success',
    message: `Rollback to deployment ${deploymentId}`,
    url: deployment.url,
    buildConfig: deployment.buildConfig,
    files: deployment.files,
    metadata: deployment.metadata,
    rollbackFrom: deploymentId,
    deployedAt: new Date(),
  };

  await createDocument(COLLECTIONS.DEPLOYMENTS, rollbackData);

  // Update app metadata
  await updateDocument(COLLECTIONS.APPS, req.params.appId, {
    'metadata.lastDeployment': new Date(),
  });

  res.json({
    status: 'success',
    message: 'Rollback completed successfully',
    data: {
      deploymentId: rollbackId,
      status: 'success',
      url: deployment.url,
    },
  });
}));

// DELETE /api/deploy/:appId/deployments/:deploymentId - Delete deployment
router.delete('/:appId/deployments/:deploymentId', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  const { deploymentId } = req.params;

  const deployment = await getDocument(COLLECTIONS.DEPLOYMENTS, deploymentId);

  if (!deployment || deployment.appId !== req.params.appId) {
    throw new AppError('Deployment not found', 404);
  }

  // Soft delete deployment
  await updateDocument(COLLECTIONS.DEPLOYMENTS, deploymentId, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  res.json({
    status: 'success',
    message: 'Deployment deleted successfully',
  });
}));

// GET /api/deploy/:appId/preview - Generate preview of app
router.get('/:appId/preview', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  // Validate app
  const { pages } = await validateAppForDeployment(req.params.appId);

  // Get components and functions
  const components = await queryDocuments(COLLECTIONS.COMPONENTS, [
    { field: 'appId', operator: '==', value: req.params.appId },
    { field: 'isDeleted', operator: '==', value: false },
  ]);

  const functions = await queryDocuments(COLLECTIONS.FUNCTIONS, [
    { field: 'appId', operator: '==', value: req.params.appId },
    { field: 'isDeleted', operator: '==', value: false },
  ]);

  // Generate preview data
  const preview = {
    app: req.app,
    pages: pages.map(page => ({
      name: page.name,
      path: page.path,
      isHome: page.isHome,
      componentCount: page.content?.components?.length || 0,
    })),
    components: components.map(comp => ({
      name: comp.name,
      type: comp.category,
    })),
    functions: functions.map(func => ({
      name: func.name,
      trigger: func.trigger,
    })),
    metadata: {
      totalPages: pages.length,
      totalComponents: components.length,
      totalFunctions: functions.length,
      estimatedSize: Math.ceil((pages.length * 50 + components.length * 25 + functions.length * 10) / 1024), // KB
    },
  };

  res.json({
    status: 'success',
    data: {
      preview,
    },
  });
}));

// GET /api/deploy/:appId/logs/:deploymentId - Get deployment logs
router.get('/:appId/logs/:deploymentId', authenticateToken, checkAppOwnership, catchAsync(async (req, res) => {
  const { deploymentId } = req.params;

  const deployment = await getDocument(COLLECTIONS.DEPLOYMENTS, deploymentId);

  if (!deployment || deployment.appId !== req.params.appId) {
    throw new AppError('Deployment not found', 404);
  }

  // Mock deployment logs
  const logs = [
    { timestamp: new Date(Date.now() - 120000), level: 'info', message: 'Starting deployment...' },
    { timestamp: new Date(Date.now() - 110000), level: 'info', message: 'Installing dependencies...' },
    { timestamp: new Date(Date.now() - 90000), level: 'info', message: 'Building application...' },
    { timestamp: new Date(Date.now() - 60000), level: 'info', message: 'Optimizing assets...' },
    { timestamp: new Date(Date.now() - 30000), level: 'info', message: 'Deploying to CDN...' },
    { timestamp: new Date(Date.now() - 5000), level: 'success', message: 'Deployment completed successfully!' },
  ];

  res.json({
    status: 'success',
    data: {
      logs,
      deploymentId,
    },
  });
}));

module.exports = router;
