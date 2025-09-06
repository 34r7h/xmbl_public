export interface User {
  id: string
  uid: string
  email: string
  displayName?: string
  photoURL?: string
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile {
  id: string
  uid: string
  email: string
  firstName: string
  lastName: string
  displayName: string
  role: 'user' | 'admin'
  isActive: boolean
  profile: {
    avatar: string | null
    bio: string
    website: string
    company: string
    location: string
  }
  preferences: {
    theme: 'light' | 'dark' | 'system'
    notifications: {
      email: boolean
      push: boolean
    }
  }
  subscription: {
    plan: 'free' | 'pro' | 'enterprise'
    status: 'active' | 'inactive' | 'canceled'
    appsLimit: number
    storageLimit: number
    expiresAt?: Date
  }
  stats: {
    appsCreated: number
    totalViews: number
    lastLogin: Date
  }
  createdAt: Date
  updatedAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterCredentials {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

export interface ResetPasswordCredentials {
  email: string
}

export interface ChangePasswordCredentials {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UpdateProfileData {
  firstName?: string
  lastName?: string
  displayName?: string
  profile?: {
    bio?: string
    website?: string
    company?: string
    location?: string
  }
  preferences?: {
    theme?: 'light' | 'dark' | 'system'
    notifications?: {
      email?: boolean
      push?: boolean
    }
  }
}

export interface AuthResponse {
  success: boolean
  error?: string
  user?: UserProfile
}

export interface AuthState {
  user: User | null
  userProfile: UserProfile | null
  isLoading: boolean
  isInitializing: boolean
  error: string | null
}

export interface FirebaseAuthError {
  code: string
  message: string
  customData?: any
}

export interface SessionData {
  user: UserProfile
  token: string
  expiresAt: Date
}

export interface PermissionLevel {
  read: boolean
  write: boolean
  delete: boolean
  admin: boolean
}

export interface UserPermissions {
  apps: PermissionLevel
  components: PermissionLevel
  templates: PermissionLevel
  analytics: PermissionLevel
  users: PermissionLevel
}

export interface AuthConfig {
  apiUrl: string
  tokenKey: string
  refreshTokenKey: string
  sessionTimeout: number
}
