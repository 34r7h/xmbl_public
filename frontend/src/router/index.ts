import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

// Route components
const Home = () => import('@/views/Home.vue')
const About = () => import('@/views/About.vue')
const Pricing = () => import('@/views/Pricing.vue')
const Contact = () => import('@/views/Contact.vue')

// Auth routes
const Login = () => import('@/views/auth/Login.vue')
const Register = () => import('@/views/auth/Register.vue')
const ForgotPassword = () => import('@/views/auth/ForgotPassword.vue')
const ResetPassword = () => import('@/views/auth/ResetPassword.vue')

// Dashboard routes
const Dashboard = () => import('@/views/dashboard/Dashboard.vue')
const Apps = () => import('@/views/dashboard/Apps.vue')
const AppDetail = () => import('@/views/dashboard/AppDetail.vue')
const Templates = () => import('@/views/dashboard/Templates.vue')
const Analytics = () => import('@/views/dashboard/Analytics.vue')
const Settings = () => import('@/views/dashboard/Settings.vue')
const Profile = () => import('@/views/dashboard/Profile.vue')

// Builder routes
const Builder = () => import('@/views/builder/Builder.vue')
const PageBuilder = () => import('@/views/builder/PageBuilder.vue')
const ComponentBuilder = () => import('@/views/builder/ComponentBuilder.vue')
const FunctionBuilder = () => import('@/views/builder/FunctionBuilder.vue')
const Preview = () => import('@/views/builder/Preview.vue')

// Admin routes
const AdminDashboard = () => import('@/views/admin/Dashboard.vue')
const AdminUsers = () => import('@/views/admin/Users.vue')
const AdminApps = () => import('@/views/admin/Apps.vue')
const AdminAnalytics = () => import('@/views/admin/Analytics.vue')
const AdminSettings = () => import('@/views/admin/Settings.vue')

// Error routes
const NotFound = () => import('@/views/errors/NotFound.vue')
const Unauthorized = () => import('@/views/errors/Unauthorized.vue')
const ServerError = () => import('@/views/errors/ServerError.vue')

const routes: Array<RouteRecordRaw> = [
  // Public routes
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      title: 'Home',
      requiresAuth: false,
      layout: 'default'
    }
  },
  {
    path: '/about',
    name: 'about',
    component: About,
    meta: {
      title: 'About',
      requiresAuth: false,
      layout: 'default'
    }
  },
  {
    path: '/pricing',
    name: 'pricing',
    component: Pricing,
    meta: {
      title: 'Pricing',
      requiresAuth: false,
      layout: 'default'
    }
  },
  {
    path: '/contact',
    name: 'contact',
    component: Contact,
    meta: {
      title: 'Contact',
      requiresAuth: false,
      layout: 'default'
    }
  },

  // Auth routes
  {
    path: '/auth',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: {
      title: 'Sign In',
      requiresAuth: false,
      requiresGuest: true,
      layout: 'auth'
    }
  },
  {
    path: '/register',
    name: 'register',
    component: Register,
    meta: {
      title: 'Sign Up',
      requiresAuth: false,
      requiresGuest: true,
      layout: 'auth'
    }
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: ForgotPassword,
    meta: {
      title: 'Forgot Password',
      requiresAuth: false,
      requiresGuest: true,
      layout: 'auth'
    }
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: ResetPassword,
    meta: {
      title: 'Reset Password',
      requiresAuth: false,
      requiresGuest: true,
      layout: 'auth'
    }
  },

  // Dashboard routes
  {
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard,
    meta: {
      title: 'Dashboard',
      requiresAuth: true,
      layout: 'dashboard'
    }
  },
  {
    path: '/apps',
    name: 'apps',
    component: Apps,
    meta: {
      title: 'My Apps',
      requiresAuth: true,
      layout: 'dashboard'
    }
  },
  {
    path: '/apps/:id',
    name: 'app-detail',
    component: AppDetail,
    meta: {
      title: 'App Details',
      requiresAuth: true,
      layout: 'dashboard'
    },
    props: true
  },
  {
    path: '/templates',
    name: 'templates',
    component: Templates,
    meta: {
      title: 'Templates',
      requiresAuth: true,
      layout: 'dashboard'
    }
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: Analytics,
    meta: {
      title: 'Analytics',
      requiresAuth: true,
      layout: 'dashboard'
    }
  },
  {
    path: '/settings',
    name: 'settings',
    component: Settings,
    meta: {
      title: 'Settings',
      requiresAuth: true,
      layout: 'dashboard'
    }
  },
  {
    path: '/profile',
    name: 'profile',
    component: Profile,
    meta: {
      title: 'Profile',
      requiresAuth: true,
      layout: 'dashboard'
    }
  },

  // Builder routes
  {
    path: '/builder/:appId',
    name: 'builder',
    component: Builder,
    meta: {
      title: 'App Builder',
      requiresAuth: true,
      layout: 'builder'
    },
    props: true,
    children: [
      {
        path: '',
        redirect: { name: 'page-builder' }
      },
      {
        path: 'pages',
        name: 'page-builder',
        component: PageBuilder,
        meta: {
          title: 'Page Builder',
          requiresAuth: true
        }
      },
      {
        path: 'components',
        name: 'component-builder',
        component: ComponentBuilder,
        meta: {
          title: 'Component Builder',
          requiresAuth: true
        }
      },
      {
        path: 'functions',
        name: 'function-builder',
        component: FunctionBuilder,
        meta: {
          title: 'Function Builder',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/preview/:appId',
    name: 'preview',
    component: Preview,
    meta: {
      title: 'App Preview',
      requiresAuth: true,
      layout: 'preview'
    },
    props: true
  },

  // Admin routes
  {
    path: '/admin',
    name: 'admin',
    redirect: '/admin/dashboard',
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/admin/dashboard',
    name: 'admin-dashboard',
    component: AdminDashboard,
    meta: {
      title: 'Admin Dashboard',
      requiresAuth: true,
      requiresAdmin: true,
      layout: 'admin'
    }
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: AdminUsers,
    meta: {
      title: 'User Management',
      requiresAuth: true,
      requiresAdmin: true,
      layout: 'admin'
    }
  },
  {
    path: '/admin/apps',
    name: 'admin-apps',
    component: AdminApps,
    meta: {
      title: 'App Management',
      requiresAuth: true,
      requiresAdmin: true,
      layout: 'admin'
    }
  },
  {
    path: '/admin/analytics',
    name: 'admin-analytics',
    component: AdminAnalytics,
    meta: {
      title: 'Platform Analytics',
      requiresAuth: true,
      requiresAdmin: true,
      layout: 'admin'
    }
  },
  {
    path: '/admin/settings',
    name: 'admin-settings',
    component: AdminSettings,
    meta: {
      title: 'Platform Settings',
      requiresAuth: true,
      requiresAdmin: true,
      layout: 'admin'
    }
  },

  // Error routes
  {
    path: '/401',
    name: 'unauthorized',
    component: Unauthorized,
    meta: {
      title: 'Unauthorized',
      layout: 'error'
    }
  },
  {
    path: '/500',
    name: 'server-error',
    component: ServerError,
    meta: {
      title: 'Server Error',
      layout: 'error'
    }
  },

  // Catch all route - must be last
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
    meta: {
      title: 'Page Not Found',
      layout: 'error'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Global navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const uiStore = useUIStore()

  // Show loading indicator
  uiStore.showLoading('Loading...')

  // Wait for auth initialization
  if (authStore.isInitializing) {
    await authStore.initialize()
  }

  // Check authentication requirements
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      uiStore.hideLoading()
      return next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
    }
  }

  // Check guest requirements (redirect authenticated users away from auth pages)
  if (to.meta.requiresGuest) {
    if (authStore.isAuthenticated) {
      uiStore.hideLoading()
      return next({ name: 'dashboard' })
    }
  }

  // Check admin requirements
  if (to.meta.requiresAdmin) {
    if (!authStore.isAdmin) {
      uiStore.hideLoading()
      uiStore.showError('Access Denied', 'You do not have permission to access this page.')
      return next({ name: 'unauthorized' })
    }
  }

  // Validate route parameters
  if (to.name === 'app-detail' || to.name === 'builder' || to.name === 'preview') {
    const appId = to.params.id || to.params.appId
    if (!appId || typeof appId !== 'string') {
      uiStore.hideLoading()
      uiStore.showError('Invalid App ID', 'The app ID provided is not valid.')
      return next({ name: 'apps' })
    }
  }

  next()
})

router.afterEach((to, from) => {
  const uiStore = useUIStore()

  // Hide loading indicator
  uiStore.hideLoading()

  // Update page title
  if (to.meta.title) {
    document.title = `${to.meta.title} | XMBL App Generator`
  } else {
    document.title = 'XMBL App Generator'
  }

  // Track page view for analytics
  if (import.meta.env.PROD) {
    // Analytics tracking would go here
    console.log('Page view:', to.path)
  }
})

// Error handling
router.onError((error) => {
  const uiStore = useUIStore()
  uiStore.hideLoading()

  console.error('Router error:', error)
  uiStore.showError('Navigation Error', 'An error occurred while navigating. Please try again.')
})

export default router
