import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  persistent?: boolean
  actions?: Array<{
    label: string
    action: () => void
    style?: 'primary' | 'secondary' | 'danger'
  }>
}

export interface Modal {
  id: string
  component: string
  props?: Record<string, any>
  options?: {
    persistent?: boolean
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    position?: 'center' | 'top' | 'bottom'
  }
}

export interface Sidebar {
  id: string
  component: string
  props?: Record<string, any>
  options?: {
    position?: 'left' | 'right'
    overlay?: boolean
    persistent?: boolean
  }
}

export interface ConfirmDialog {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

export const useUIStore = defineStore('ui', () => {
  // State
  const isLoading = ref(false)
  const loadingMessage = ref('')
  const notifications = ref<Notification[]>([])
  const modals = ref<Modal[]>([])
  const sidebars = ref<Sidebar[]>([])
  const confirmDialog = ref<ConfirmDialog | null>(null)
  const searchQuery = ref('')
  const isSearchOpen = ref(false)
  const isCommandPaletteOpen = ref(false)
  const isSidebarCollapsed = ref(false)
  const currentTheme = ref<'light' | 'dark' | 'system'>('system')

  // Toast instance
  const toast = useToast()

  // Computed
  const hasModals = computed(() => modals.value.length > 0)
  const hasSidebars = computed(() => sidebars.value.length > 0)
  const hasNotifications = computed(() => notifications.value.length > 0)
  const topModal = computed(() => modals.value[modals.value.length - 1])
  const activeSidebar = computed(() => sidebars.value[sidebars.value.length - 1])

  // Loading Actions
  const setLoading = (loading: boolean, message = '') => {
    isLoading.value = loading
    loadingMessage.value = message
  }

  const showLoading = (message = 'Loading...') => {
    setLoading(true, message)
  }

  const hideLoading = () => {
    setLoading(false, '')
  }

  // Notification Actions
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      id,
      duration: 5000,
      ...notification
    }

    notifications.value.push(newNotification)

    // Auto remove notification after duration (unless persistent)
    if (!newNotification.persistent && newNotification.duration) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  const showSuccess = (title: string, message?: string, options?: Partial<Notification>) => {
    toast.success(message || title)
    return addNotification({ type: 'success', title, message, ...options })
  }

  const showError = (title: string, message?: string, options?: Partial<Notification>) => {
    toast.error(message || title)
    return addNotification({ type: 'error', title, message, ...options })
  }

  const showWarning = (title: string, message?: string, options?: Partial<Notification>) => {
    toast.warning(message || title)
    return addNotification({ type: 'warning', title, message, ...options })
  }

  const showInfo = (title: string, message?: string, options?: Partial<Notification>) => {
    toast.info(message || title)
    return addNotification({ type: 'info', title, message, ...options })
  }

  // Modal Actions
  const openModal = (component: string, props?: Record<string, any>, options?: Modal['options']) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const modal: Modal = {
      id,
      component,
      props,
      options
    }

    modals.value.push(modal)
    return id
  }

  const closeModal = (id?: string) => {
    if (id) {
      const index = modals.value.findIndex(m => m.id === id)
      if (index > -1) {
        modals.value.splice(index, 1)
      }
    } else {
      // Close top modal
      modals.value.pop()
    }
  }

  const closeAllModals = () => {
    modals.value = []
  }

  // Sidebar Actions
  const openSidebar = (component: string, props?: Record<string, any>, options?: Sidebar['options']) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const sidebar: Sidebar = {
      id,
      component,
      props,
      options
    }

    sidebars.value.push(sidebar)
    return id
  }

  const closeSidebar = (id?: string) => {
    if (id) {
      const index = sidebars.value.findIndex(s => s.id === id)
      if (index > -1) {
        sidebars.value.splice(index, 1)
      }
    } else {
      // Close active sidebar
      sidebars.value.pop()
    }
  }

  const closeAllSidebars = () => {
    sidebars.value = []
  }

  const toggleSidebarCollapse = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
  }

  // Confirm Dialog Actions
  const showConfirm = (options: ConfirmDialog) => {
    confirmDialog.value = {
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      type: 'info',
      ...options
    }
  }

  const hideConfirm = () => {
    confirmDialog.value = null
  }

  const confirm = async () => {
    if (confirmDialog.value) {
      try {
        await confirmDialog.value.onConfirm()
      } catch (error) {
        console.error('Confirm action failed:', error)
        showError('Action failed', 'An error occurred while performing the action.')
      }
      hideConfirm()
    }
  }

  const cancel = () => {
    if (confirmDialog.value?.onCancel) {
      confirmDialog.value.onCancel()
    }
    hideConfirm()
  }

  // Search Actions
  const openSearch = () => {
    isSearchOpen.value = true
  }

  const closeSearch = () => {
    isSearchOpen.value = false
    searchQuery.value = ''
  }

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  // Command Palette Actions
  const openCommandPalette = () => {
    isCommandPaletteOpen.value = true
  }

  const closeCommandPalette = () => {
    isCommandPaletteOpen.value = false
  }

  // Theme Actions
  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    currentTheme.value = theme
    localStorage.setItem('theme', theme)

    // Apply theme to document
    applyTheme(theme)
  }

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      root.classList.toggle('dark', mediaQuery.matches)
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }
  }

  const toggleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(currentTheme.value)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  // Initialize theme from localStorage
  const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    if (savedTheme) {
      currentTheme.value = savedTheme
      applyTheme(savedTheme)
    }

    // Listen for system theme changes
    if (currentTheme.value === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', () => {
        if (currentTheme.value === 'system') {
          applyTheme('system')
        }
      })
    }
  }

  // Utility Actions
  const resetState = () => {
    isLoading.value = false
    loadingMessage.value = ''
    notifications.value = []
    modals.value = []
    sidebars.value = []
    confirmDialog.value = null
    searchQuery.value = ''
    isSearchOpen.value = false
    isCommandPaletteOpen.value = false
  }

  const handleError = (error: Error | string, context?: string) => {
    const errorMessage = error instanceof Error ? error.message : error
    const title = context ? `Error in ${context}` : 'An error occurred'

    console.error(title, error)
    showError(title, errorMessage)
  }

  // Keyboard shortcuts handler
  const handleKeyboard = (event: KeyboardEvent) => {
    const { ctrlKey, metaKey, key, altKey, shiftKey } = event
    const isModifierPressed = ctrlKey || metaKey

    // Global shortcuts
    if (isModifierPressed) {
      switch (key) {
        case '/':
          event.preventDefault()
          openSearch()
          break
        case 'k':
          event.preventDefault()
          openCommandPalette()
          break
        case '\\':
          event.preventDefault()
          toggleSidebarCollapse()
          break
      }
    }

    // Escape key actions
    if (key === 'Escape') {
      if (isSearchOpen.value) {
        closeSearch()
      } else if (isCommandPaletteOpen.value) {
        closeCommandPalette()
      } else if (hasModals.value) {
        closeModal()
      } else if (hasSidebars.value) {
        closeSidebar()
      } else if (confirmDialog.value) {
        cancel()
      }
    }
  }

  // Initialize keyboard shortcuts
  const initializeKeyboardShortcuts = () => {
    document.addEventListener('keydown', handleKeyboard)
  }

  // Cleanup
  const cleanup = () => {
    document.removeEventListener('keydown', handleKeyboard)
  }

  return {
    // State
    isLoading,
    loadingMessage,
    notifications,
    modals,
    sidebars,
    confirmDialog,
    searchQuery,
    isSearchOpen,
    isCommandPaletteOpen,
    isSidebarCollapsed,
    currentTheme,

    // Computed
    hasModals,
    hasSidebars,
    hasNotifications,
    topModal,
    activeSidebar,

    // Actions
    setLoading,
    showLoading,
    hideLoading,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    openModal,
    closeModal,
    closeAllModals,
    openSidebar,
    closeSidebar,
    closeAllSidebars,
    toggleSidebarCollapse,
    showConfirm,
    hideConfirm,
    confirm,
    cancel,
    openSearch,
    closeSearch,
    setSearchQuery,
    openCommandPalette,
    closeCommandPalette,
    setTheme,
    applyTheme,
    toggleTheme,
    initializeTheme,
    resetState,
    handleError,
    initializeKeyboardShortcuts,
    cleanup
  }
})
