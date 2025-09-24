/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Firebase Configuration
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string

  // API Configuration
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_TIMEOUT?: string

  // App Configuration
  readonly VITE_APP_NAME?: string
  readonly VITE_APP_VERSION?: string
  readonly VITE_APP_DESCRIPTION?: string
  readonly VITE_APP_URL?: string

  // Environment
  readonly VITE_NODE_ENV?: string
  readonly VITE_DEBUG?: string

  // Feature Flags
  readonly VITE_ENABLE_ANALYTICS?: string
  readonly VITE_ENABLE_ERROR_REPORTING?: string
  readonly VITE_ENABLE_BETA_FEATURES?: string
  readonly VITE_ENABLE_DEV_TOOLS?: string

  // External Services
  readonly VITE_VERCEL_URL?: string
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_POSTHOG_API_KEY?: string
  readonly VITE_INTERCOM_APP_ID?: string

  // Theme Configuration
  readonly VITE_DEFAULT_THEME?: string
  readonly VITE_BRAND_COLOR?: string
  readonly VITE_ACCENT_COLOR?: string

  // Upload Configuration
  readonly VITE_MAX_FILE_SIZE?: string
  readonly VITE_ALLOWED_FILE_TYPES?: string

  // Social Authentication
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_GITHUB_CLIENT_ID?: string
  readonly VITE_DISCORD_CLIENT_ID?: string

  // Development Only
  readonly VITE_MOCK_API?: string
  readonly VITE_SHOW_DEVTOOLS?: string
  readonly VITE_LOG_LEVEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '@floating-ui/dom' {
  export * from '@floating-ui/dom'
}

declare module 'vue-toastification' {
  import { PluginOptions, ToastContent, ToastOptions } from 'vue-toastification'

  export { PluginOptions, ToastContent, ToastOptions }

  export function useToast(): {
    success: (content: ToastContent, options?: ToastOptions) => void
    error: (content: ToastContent, options?: ToastOptions) => void
    warning: (content: ToastContent, options?: ToastOptions) => void
    info: (content: ToastContent, options?: ToastOptions) => void
    clear: () => void
    dismiss: (id: number | string) => void
    update: (id: number | string, options: ToastOptions) => void
  }

  const plugin: any
  export default plugin
}
