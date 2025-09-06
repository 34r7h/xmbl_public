import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import { getAnalytics, type Analytics } from 'firebase/analytics'

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Firebase app instance
let app: FirebaseApp
let auth: Auth
let db: Firestore
let storage: FirebaseStorage
let analytics: Analytics

// Initialize Firebase
export const initializeFirebase = () => {
  try {
    if (!app) {
      app = initializeApp(firebaseConfig)
      auth = getAuth(app)
      db = getFirestore(app)
      storage = getStorage(app)

      // Initialize analytics only in production
      if (import.meta.env.PROD && firebaseConfig.measurementId) {
        analytics = getAnalytics(app)
      }

      console.log('🔥 Firebase initialized successfully')
    }
    return app
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error)
    throw error
  }
}

// Export Firebase services
export { auth, db, storage, analytics }

// Firebase collections
export const COLLECTIONS = {
  USERS: 'users',
  APPS: 'apps',
  PAGES: 'pages',
  COMPONENTS: 'components',
  FUNCTIONS: 'functions',
  TEMPLATES: 'templates',
  DEPLOYMENTS: 'deployments',
  ANALYTICS: 'analytics'
} as const

// Firebase error codes mapping
export const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password.',
  'auth/invalid-email': 'Invalid email address.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/invalid-credential': 'Invalid credentials provided.',
  'auth/requires-recent-login': 'Please log in again to continue.',
  'permission-denied': 'You do not have permission to perform this action.',
  'not-found': 'The requested resource was not found.',
  'already-exists': 'The resource already exists.',
  'resource-exhausted': 'Quota exceeded. Please try again later.',
  'unauthenticated': 'You must be logged in to perform this action.',
  'unavailable': 'Service temporarily unavailable. Please try again.'
}

// Helper function to get user-friendly error message
export const getFirebaseErrorMessage = (errorCode: string): string => {
  return FIREBASE_ERROR_MESSAGES[errorCode] || 'An unexpected error occurred. Please try again.'
}

// Firebase timestamp helpers
export const timestamp = () => {
  return new Date()
}

export const serverTimestamp = () => {
  return new Date()
}

// Firestore converter helper for TypeScript
export const createConverter = <T>() => ({
  toFirestore: (data: T) => data,
  fromFirestore: (snapshot: any) => {
    const data = snapshot.data()
    return { id: snapshot.id, ...data } as T & { id: string }
  }
})

// Environment validation
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID'
]

const missingEnvVars = requiredEnvVars.filter(envVar => !import.meta.env[envVar])

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required Firebase environment variables:', missingEnvVars)
  throw new Error('Missing Firebase configuration. Please check your environment variables.')
}

export default {
  initializeFirebase,
  auth,
  db,
  storage,
  analytics,
  COLLECTIONS,
  getFirebaseErrorMessage,
  timestamp,
  serverTimestamp,
  createConverter
}
