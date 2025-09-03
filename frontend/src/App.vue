<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Loading overlay -->
    <div
      v-if="isLoading"
      class="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90"
    >
      <div class="text-center">
        <BaseSpinner size="large" />
        <p class="mt-4 text-gray-600">Loading XMBL...</p>
      </div>
    </div>

    <!-- Main application -->
    <div v-else>
      <!-- Navigation bar -->
      <Navbar v-if="showNavbar" />

      <!-- Main content -->
      <main :class="mainClasses">
        <router-view v-slot="{ Component, route }">
          <transition name="page" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </main>

      <!-- Footer -->
      <AppFooter v-if="showFooter" />
    </div>

    <!-- Global modals -->
    <Teleport to="body">
      <ConfirmModal />
      <ErrorModal />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useThemeStore } from '@/stores/theme'

// Components
import Navbar from '@/components/layout/Navbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import ConfirmModal from '@/components/modals/ConfirmModal.vue'
import ErrorModal from '@/components/modals/ErrorModal.vue'

// Stores
const authStore = useAuthStore()
const uiStore = useUIStore()
const themeStore = useThemeStore()
const route = useRoute()

// Computed properties
const isLoading = computed(() => uiStore.isLoading || authStore.isInitializing)

const showNavbar = computed(() => {
  const hideNavbarRoutes = ['login', 'register', 'forgot-password', 'reset-password']
  return !hideNavbarRoutes.includes(route.name as string)
})

const showFooter = computed(() => {
  const hideFooterRoutes = ['builder', 'preview']
  return !hideFooterRoutes.includes(route.name as string)
})

const mainClasses = computed(() => {
  const classes = ['flex-1']

  if (showNavbar.value) {
    classes.push('pt-16') // Account for fixed navbar height
  }

  if (route.name === 'builder') {
    classes.push('h-screen', 'overflow-hidden')
  }

  return classes.join(' ')
})

// Lifecycle hooks
onMounted(async () => {
  // Initialize authentication
  await authStore.initialize()

  // Apply saved theme
  themeStore.applyTheme()

  // Set up keyboard shortcuts
  setupKeyboardShortcuts()
})

// Watch for theme changes
watch(() => themeStore.currentTheme, (newTheme) => {
  document.documentElement.className = newTheme === 'dark' ? 'dark' : ''
})

// Watch for route changes
watch(route, (newRoute) => {
  // Update page title
  updatePageTitle(newRoute)

  // Clear any temporary UI state
  uiStore.clearNotifications()

  // Track page view (analytics)
  trackPageView(newRoute)
})

// Methods
const updatePageTitle = (route: any) => {
  const baseTitle = 'XMBL App Generator'
  let title = baseTitle

  if (route.meta?.title) {
    title = `${route.meta.title} | ${baseTitle}`
  } else if (route.name) {
    const routeName = String(route.name)
    const formattedName = routeName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
    title = `${formattedName} | ${baseTitle}`
  }

  document.title = title
}

const trackPageView = (route: any) => {
  // Analytics tracking would go here
  if (import.meta.env.PROD) {
    console.log('Track page view:', route.path)
  }
}

const setupKeyboardShortcuts = () => {
  document.addEventListener('keydown', (event) => {
    // Global keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case '/':
          // Open search
          event.preventDefault()
          uiStore.openSearch()
          break
        case 'k':
          // Open command palette
          event.preventDefault()
          uiStore.openCommandPalette()
          break
        case ',':
          // Open settings
          if (authStore.isAuthenticated) {
            event.preventDefault()
            // Navigate to settings
          }
          break
      }
    }

    // Escape key
    if (event.key === 'Escape') {
      uiStore.closeAllModals()
    }
  })
}

// Error handling
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  uiStore.showError('An unexpected error occurred. Please try again.')
})

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
  uiStore.showError('An unexpected error occurred. Please refresh the page.')
})
</script>

<style scoped>
/* Page transition animations */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* Loading overlay */
.loading-overlay {
  backdrop-filter: blur(2px);
}

/* Scrollbar styling */
:deep(.perfect-scrollbar) {
  position: relative;
}

:deep(.ps__rail-x),
:deep(.ps__rail-y) {
  opacity: 0.6;
}

:deep(.ps__thumb-x),
:deep(.ps__thumb-y) {
  background-color: theme('colors.gray.400');
  border-radius: 6px;
}

:deep(.ps__thumb-x:hover),
:deep(.ps__thumb-y:hover) {
  background-color: theme('colors.gray.500');
}

/* Dark mode adjustments */
.dark {
  :deep(.ps__thumb-x),
  :deep(.ps__thumb-y) {
    background-color: theme('colors.gray.600');
  }

  :deep(.ps__thumb-x:hover),
  :deep(.ps__thumb-y:hover) {
    background-color: theme('colors.gray.500');
  }
}
</style>
