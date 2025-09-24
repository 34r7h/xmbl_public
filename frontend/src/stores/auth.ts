import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  onAuthStateChanged,
  type User
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore'
import { auth, db, COLLECTIONS, getFirebaseErrorMessage } from '@/services/firebase'
import type { UserProfile, LoginCredentials, RegisterCredentials } from '@/types/auth'
import { useToast } from 'vue-toastification'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const userProfile = ref<UserProfile | null>(null)
  const isLoading = ref(false)
  const isInitializing = ref(true)
  const error = ref<string | null>(null)

  // Toast instance
  const toast = useToast()

  // Computed
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => userProfile.value?.role === 'admin')
  const displayName = computed(() => {
    if (userProfile.value) {
      return userProfile.value.displayName || `${userProfile.value.firstName} ${userProfile.value.lastName}`
    }
    return user.value?.displayName || user.value?.email || 'User'
  })

  const subscriptionPlan = computed(() => userProfile.value?.subscription?.plan || 'free')
  const appsLimit = computed(() => userProfile.value?.subscription?.appsLimit || 3)
  const storageLimit = computed(() => userProfile.value?.subscription?.storageLimit || 100)

  // Actions
  const initialize = async () => {
    return new Promise<void>((resolve) => {
      // Skip Firebase auth in development if not configured
      if (import.meta.env.DEV && !import.meta.env.VITE_FIREBASE_API_KEY) {
        console.warn('⚠️ Firebase not configured, skipping auth initialization')
        isInitializing.value = false
        resolve()
        return
      }

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            user.value = firebaseUser
            await fetchUserProfile()
          } else {
            user.value = null
            userProfile.value = null
          }
        } catch (err) {
          console.error('Error in auth state change:', err)
          error.value = 'Failed to initialize authentication'
        } finally {
          isInitializing.value = false
          resolve()
        }
      })

      // Store unsubscribe function for cleanup
      ;(initialize as any).unsubscribe = unsubscribe
    })
  }

  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      )

      user.value = firebaseUser
      await fetchUserProfile()

      // Update last login
      if (userProfile.value) {
        await updateUserProfile({
          'stats.lastLogin': new Date()
        })
      }

      toast.success('Welcome back!')
      return { success: true }
    } catch (err: any) {
      const errorMessage = getFirebaseErrorMessage(err.code)
      error.value = errorMessage
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (credentials: RegisterCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      )

      // Update Firebase Auth profile
      await updateProfile(firebaseUser, {
        displayName: `${credentials.firstName} ${credentials.lastName}`
      })

      user.value = firebaseUser

      // Create user profile in Firestore
      const userProfileData: Omit<UserProfile, 'id'> = {
        uid: firebaseUser.uid,
        email: credentials.email,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        displayName: `${credentials.firstName} ${credentials.lastName}`,
        role: 'user',
        isActive: true,
        profile: {
          avatar: null,
          bio: '',
          website: '',
          company: '',
          location: ''
        },
        preferences: {
          theme: 'light',
          notifications: {
            email: true,
            push: true
          }
        },
        subscription: {
          plan: 'free',
          status: 'active',
          appsLimit: 3,
          storageLimit: 100
        },
        stats: {
          appsCreated: 0,
          totalViews: 0,
          lastLogin: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), userProfileData)
      userProfile.value = { id: firebaseUser.uid, ...userProfileData }

      toast.success('Account created successfully!')
      return { success: true }
    } catch (err: any) {
      const errorMessage = getFirebaseErrorMessage(err.code)
      error.value = errorMessage
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    isLoading.value = true

    try {
      await signOut(auth)
      user.value = null
      userProfile.value = null
      error.value = null
      toast.success('Logged out successfully')
      return { success: true }
    } catch (err: any) {
      const errorMessage = getFirebaseErrorMessage(err.code)
      error.value = errorMessage
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      isLoading.value = false
    }
  }

  const sendResetEmail = async (email: string) => {
    isLoading.value = true
    error.value = null

    try {
      await sendPasswordResetEmail(auth, email)
      toast.success('Password reset email sent!')
      return { success: true }
    } catch (err: any) {
      const errorMessage = getFirebaseErrorMessage(err.code)
      error.value = errorMessage
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      isLoading.value = false
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user.value) {
      throw new Error('User not authenticated')
    }

    isLoading.value = true
    error.value = null

    try {
      // Re-authenticate user first
      await signInWithEmailAndPassword(auth, user.value.email!, currentPassword)

      // Update password
      await updatePassword(user.value, newPassword)

      toast.success('Password updated successfully!')
      return { success: true }
    } catch (err: any) {
      const errorMessage = getFirebaseErrorMessage(err.code)
      error.value = errorMessage
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      isLoading.value = false
    }
  }

  const fetchUserProfile = async () => {
    if (!user.value) return

    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.value.uid))

      if (userDoc.exists()) {
        userProfile.value = { id: userDoc.id, ...userDoc.data() } as UserProfile
      } else {
        // Create profile if it doesn't exist
        await createUserProfile()
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
      error.value = 'Failed to fetch user profile'
    }
  }

  const createUserProfile = async () => {
    if (!user.value) return

    const userProfileData: Omit<UserProfile, 'id'> = {
      uid: user.value.uid,
      email: user.value.email!,
      firstName: user.value.displayName?.split(' ')[0] || '',
      lastName: user.value.displayName?.split(' ').slice(1).join(' ') || '',
      displayName: user.value.displayName || user.value.email!,
      role: 'user',
      isActive: true,
      profile: {
        avatar: user.value.photoURL,
        bio: '',
        website: '',
        company: '',
        location: ''
      },
      preferences: {
        theme: 'light',
        notifications: {
          email: true,
          push: true
        }
      },
      subscription: {
        plan: 'free',
        status: 'active',
        appsLimit: 3,
        storageLimit: 100
      },
      stats: {
        appsCreated: 0,
        totalViews: 0,
        lastLogin: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await setDoc(doc(db, COLLECTIONS.USERS, user.value.uid), userProfileData)
    userProfile.value = { id: user.value.uid, ...userProfileData }
  }

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user.value || !userProfile.value) {
      throw new Error('User not authenticated')
    }

    try {
      const updateData = {
        ...updates,
        updatedAt: new Date()
      }

      await updateDoc(doc(db, COLLECTIONS.USERS, user.value.uid), updateData)

      // Update local state
      userProfile.value = { ...userProfile.value, ...updateData }

      return { success: true }
    } catch (err: any) {
      const errorMessage = getFirebaseErrorMessage(err.code)
      error.value = errorMessage
      throw new Error(errorMessage)
    }
  }

  const updateAvatar = async (avatarUrl: string) => {
    if (!user.value) {
      throw new Error('User not authenticated')
    }

    try {
      // Update Firebase Auth profile
      await updateProfile(user.value, { photoURL: avatarUrl })

      // Update Firestore profile
      await updateUserProfile({
        'profile.avatar': avatarUrl
      })

      toast.success('Avatar updated successfully!')
      return { success: true }
    } catch (err: any) {
      const errorMessage = 'Failed to update avatar'
      error.value = errorMessage
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const refreshUser = async () => {
    if (user.value) {
      await fetchUserProfile()
    }
  }

  const clearError = () => {
    error.value = null
  }

  // Cleanup function
  const cleanup = () => {
    if ((initialize as any).unsubscribe) {
      (initialize as any).unsubscribe()
    }
  }

  return {
    // State
    user,
    userProfile,
    isLoading,
    isInitializing,
    error,

    // Computed
    isAuthenticated,
    isAdmin,
    displayName,
    subscriptionPlan,
    appsLimit,
    storageLimit,

    // Actions
    initialize,
    login,
    register,
    logout,
    sendResetEmail,
    changePassword,
    fetchUserProfile,
    updateUserProfile,
    updateAvatar,
    refreshUser,
    clearError,
    cleanup
  }
})
