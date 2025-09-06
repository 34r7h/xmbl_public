import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  success: string
  warning: string
  error: string
  info: string
}

export interface ThemeConfig {
  name: string
  colors: ThemeColors
  fontFamily: string
  fontSize: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
    '4xl': string
    '5xl': string
    '6xl': string
  }
  borderRadius: {
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
  }
  shadows: {
    sm: string
    md: string
    lg: string
    xl: string
  }
}

export const lightTheme: ThemeConfig = {
  name: 'light',
  colors: {
    primary: '#3b82f6',
    secondary: '#22c55e',
    accent: '#d946ef',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  },
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem'
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem'
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    '2xl': '4rem'
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  }
}

export const darkTheme: ThemeConfig = {
  name: 'dark',
  colors: {
    primary: '#60a5fa',
    secondary: '#34d399',
    accent: '#e879f9',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    border: '#334155',
    success: '#10b981',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa'
  },
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem'
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem'
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    '2xl': '4rem'
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)'
  }
}

export const useThemeStore = defineStore('theme', () => {
  // State
  const currentTheme = ref<'light' | 'dark' | 'system'>('system')
  const customThemes = ref<ThemeConfig[]>([])
  const activeTheme = ref<ThemeConfig>(lightTheme)

  // Computed
  const isDark = computed(() => {
    if (currentTheme.value === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return currentTheme.value === 'dark'
  })

  const themeColors = computed(() => activeTheme.value.colors)
  const themeFontFamily = computed(() => activeTheme.value.fontFamily)
  const themeFontSize = computed(() => activeTheme.value.fontSize)
  const themeBorderRadius = computed(() => activeTheme.value.borderRadius)
  const themeSpacing = computed(() => activeTheme.value.spacing)
  const themeShadows = computed(() => activeTheme.value.shadows)

  // Actions
  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    currentTheme.value = theme
    localStorage.setItem('xmbl-theme', theme)
    applyTheme()
  }

  const applyTheme = () => {
    const root = document.documentElement
    const theme = getActiveThemeConfig()

    // Apply theme class
    root.classList.remove('light', 'dark')
    if (isDark.value) {
      root.classList.add('dark')
      activeTheme.value = darkTheme
    } else {
      root.classList.add('light')
      activeTheme.value = lightTheme
    }

    // Apply CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })

    root.style.setProperty('--font-family', theme.fontFamily)

    Object.entries(theme.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value)
    })

    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--border-radius-${key}`, value)
    })

    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value)
    })

    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value)
    })
  }

  const getActiveThemeConfig = (): ThemeConfig => {
    if (currentTheme.value === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? darkTheme : lightTheme
    }
    return currentTheme.value === 'dark' ? darkTheme : lightTheme
  }

  const toggleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(currentTheme.value)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const initializeTheme = () => {
    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem('xmbl-theme') as 'light' | 'dark' | 'system' | null

    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      currentTheme.value = savedTheme
    } else {
      // Default to system theme
      currentTheme.value = 'system'
    }

    applyTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (currentTheme.value === 'system') {
        applyTheme()
      }
    })
  }

  const addCustomTheme = (theme: ThemeConfig) => {
    const existingIndex = customThemes.value.findIndex(t => t.name === theme.name)
    if (existingIndex > -1) {
      customThemes.value[existingIndex] = theme
    } else {
      customThemes.value.push(theme)
    }

    // Save to localStorage
    localStorage.setItem('xmbl-custom-themes', JSON.stringify(customThemes.value))
  }

  const removeCustomTheme = (themeName: string) => {
    const index = customThemes.value.findIndex(t => t.name === themeName)
    if (index > -1) {
      customThemes.value.splice(index, 1)
      localStorage.setItem('xmbl-custom-themes', JSON.stringify(customThemes.value))
    }
  }

  const applyCustomTheme = (themeName: string) => {
    const theme = customThemes.value.find(t => t.name === themeName)
    if (theme) {
      activeTheme.value = theme
      applyTheme()
    }
  }

  const loadCustomThemes = () => {
    const saved = localStorage.getItem('xmbl-custom-themes')
    if (saved) {
      try {
        customThemes.value = JSON.parse(saved)
      } catch (error) {
        console.error('Failed to load custom themes:', error)
        customThemes.value = []
      }
    }
  }

  const generateThemeFromColors = (
    name: string,
    primaryColor: string,
    secondaryColor?: string,
    accentColor?: string
  ): ThemeConfig => {
    const baseTheme = isDark.value ? darkTheme : lightTheme

    return {
      ...baseTheme,
      name,
      colors: {
        ...baseTheme.colors,
        primary: primaryColor,
        secondary: secondaryColor || baseTheme.colors.secondary,
        accent: accentColor || baseTheme.colors.accent
      }
    }
  }

  const exportTheme = (themeName?: string): string => {
    const theme = themeName
      ? customThemes.value.find(t => t.name === themeName) || activeTheme.value
      : activeTheme.value

    return JSON.stringify(theme, null, 2)
  }

  const importTheme = (themeJson: string): boolean => {
    try {
      const theme = JSON.parse(themeJson) as ThemeConfig

      // Validate theme structure
      if (!theme.name || !theme.colors || !theme.fontFamily) {
        throw new Error('Invalid theme structure')
      }

      addCustomTheme(theme)
      return true
    } catch (error) {
      console.error('Failed to import theme:', error)
      return false
    }
  }

  const resetToDefault = () => {
    setTheme('system')
    activeTheme.value = getActiveThemeConfig()
    applyTheme()
  }

  const getContrastColor = (backgroundColor: string): string => {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

    // Return black or white based on luminance
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  // Watch for theme changes to update meta theme-color
  watch(isDark, (newIsDark) => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', newIsDark ? darkTheme.colors.background : lightTheme.colors.background)
    }
  })

  return {
    // State
    currentTheme,
    customThemes,
    activeTheme,

    // Computed
    isDark,
    themeColors,
    themeFontFamily,
    themeFontSize,
    themeBorderRadius,
    themeSpacing,
    themeShadows,

    // Actions
    setTheme,
    applyTheme,
    getActiveThemeConfig,
    toggleTheme,
    initializeTheme,
    addCustomTheme,
    removeCustomTheme,
    applyCustomTheme,
    loadCustomThemes,
    generateThemeFromColors,
    exportTheme,
    importTheme,
    resetToDefault,
    getContrastColor
  }
})
