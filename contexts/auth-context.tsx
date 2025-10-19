"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { config } from '@/lib/config';
import { authAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { safeLocalStorage } from '@/lib/utils'
import { 
  auth, 
  signInWithGoogle, 
  signInWithGoogleRedirect,
  getGoogleRedirectResult,
  signOutUser
} from '@/lib/firebase';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role?: string;
  authProvider?: 'email' | 'google' | 'phone';
}

interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  authProvider?: 'email' | 'google';
}

interface AuthContextType {
  user: User | Admin | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, phone: string) => Promise<void>
  completePhoneRegistration: (data: { phone: string; email: string; name: string; password: string }) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: { name?: string; phone?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  // Optimized auth initialization
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (typeof window === 'undefined') {
          setIsLoading(false)
          return
        }

        // Check localStorage for existing session first (fastest)
        const token = safeLocalStorage.getItem('token')
        const userData = safeLocalStorage.getItem('user')
        
        if (token && userData) {
          try {
            const parsedUser = JSON.parse(userData)
            setUser(parsedUser)
            setIsInitialized(true);
            setIsLoading(false);
            
            // Validate token in background without blocking UI
            validateTokenInBackground(token, parsedUser);
            return;
          } catch (parseError) {
            console.error('Failed to parse user data:', parseError)
            safeLocalStorage.removeItem('user')
            safeLocalStorage.removeItem('token')
          }
        }

        // Check for Google redirect result (only if no local session)
        try {
          const redirectResult = await getGoogleRedirectResult();
          if (redirectResult?.user) {
            await handleGoogleUser(redirectResult.user);
            setIsInitialized(true);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.log('No redirect result or error:', error);
        }
        
        setIsInitialized(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Auth initialization failed:', error)
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // Handle Google user authentication
  const handleGoogleUser = async (firebaseUser: FirebaseUser) => {
    try {
      console.log('🔄 Processing Google user:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName
      });
      
      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || '',
        phone: firebaseUser.phoneNumber || '',
        authProvider: 'google'
      };
      
      console.log('📝 Created user data object:', userData);
      
      // Try to get or create user in backend
      try {
        console.log('🌐 Attempting backend integration...');
        const response = await fetch(`${config.apiUrl}/api/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            phone: firebaseUser.phoneNumber
          })
        });
        
        if (response.ok) {
          const backendUser = await response.json();
          console.log('✅ Backend user created/retrieved:', backendUser);
          
          // Only update state if user data is different
          if (!user || user.id !== backendUser.id) {
            setUser(backendUser);
            safeLocalStorage.setItem('user', JSON.stringify(backendUser));
            if (backendUser.token) {
              safeLocalStorage.setItem('token', backendUser.token);
            }
            console.log('✅ User state updated with backend data');
          } else {
            console.log('🔄 User state already up to date');
          }
        } else {
          console.log('⚠️ Backend integration failed, using Firebase user');
          // Fallback to Firebase user if backend fails
          if (!user || user.id !== userData.id) {
            setUser(userData);
            safeLocalStorage.setItem('user', JSON.stringify(userData));
            console.log('✅ User state updated with Firebase data');
          } else {
            console.log('🔄 User state already up to date');
          }
        }
      } catch (error) {
        console.log('⚠️ Backend integration not ready, using Firebase user');
        if (!user || user.id !== userData.id) {
          setUser(userData);
          safeLocalStorage.setItem('user', JSON.stringify(userData));
          console.log('✅ User state updated with Firebase data');
        } else {
          console.log('🔄 User state already up to date');
        }
      }
      
      console.log('✅ User state updated successfully');
    } catch (error) {
      console.error('❌ Failed to handle Google user:', error);
      throw error;
    }
  }

  // Validate token in background without blocking UI
  const validateTokenInBackground = async (token: string, currentUser: User | Admin) => {
    try {
      const response = await fetch(`${config.apiUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const freshUserData = await response.json()
        setUser(freshUserData)
        safeLocalStorage.setItem('user', JSON.stringify(freshUserData))
      } else if (response.status === 401) {
        // Clear auth data only on clear authentication failure
        safeLocalStorage.removeItem('token')
        safeLocalStorage.removeItem('user')
        setUser(null)
      }
    } catch (error) {
      console.error('Background token validation failed:', error)
      // Don't clear auth data on network errors
    }
  }

  // Listen to Firebase auth state changes - ONLY for Google users
  useEffect(() => {
    if (!isInitialized) return;
    
    // Only run Firebase listener if user is using Google auth or if no user exists yet
    if (user && user.authProvider !== 'google') {
      console.log('🔄 Skipping Firebase listener for email user');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('🔄 Firebase auth state changed:', firebaseUser ? 'User signed in' : 'User signed out');
      
      if (firebaseUser) {
        // User signed in with Google
        console.log('✅ Processing Firebase user:', firebaseUser.email);
        
        // Check if user already exists in state to prevent unnecessary updates
        if (user?.id === firebaseUser.uid) {
          console.log('🔄 User already exists in state, skipping update');
          setIsLoading(false);
          return;
        }
        
        await handleGoogleUser(firebaseUser);
        setIsLoading(false); // Set loading to false after user is processed
      } else {
        // User signed out from Firebase
        if (user?.authProvider === 'google') {
          console.log('🚪 Google user signed out, clearing state');
          // Only clear user if they were using Google auth
          safeLocalStorage.removeItem('user')
          safeLocalStorage.removeItem('token')
          setUser(null)
        }
        setIsLoading(false); // Set loading to false
      }
    })

    return () => unsubscribe();
  }, [user?.authProvider, isInitialized, user?.id])

  // Dispatch events when user state changes
  useEffect(() => {
    if (user) {
      window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: user }))
    } else {
      window.dispatchEvent(new CustomEvent('userLoggedOut'))
    }
  }, [user])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await authAPI.login({ email, password })
      
      // Store token and user data
      safeLocalStorage.setItem('token', response.token)
      safeLocalStorage.setItem('user', JSON.stringify({ ...response.user, authProvider: 'email' }))
      
      setUser({ ...response.user, authProvider: 'email' })
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string, phone: string) => {
    try {
      setIsLoading(true)
      const response = await authAPI.register({ name, email, password, phone })
      
      // Store token and user data
      safeLocalStorage.setItem('token', response.token)
      safeLocalStorage.setItem('user', JSON.stringify({ ...response.user, authProvider: 'email' }))
      
      setUser({ ...response.user, authProvider: 'email' })
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const completePhoneRegistration = async (data: { phone: string; email: string; name: string; password: string }) => {
    try {
      setIsLoading(true)
      const response = await authAPI.completeRegistration(data)
      
      // Store token and user data
      safeLocalStorage.setItem('token', response.token)
      safeLocalStorage.setItem('user', JSON.stringify({ ...response.user, authProvider: 'phone' }))
      
      setUser({ ...response.user, authProvider: 'phone' })
    } catch (error) {
      console.error('Phone registration failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true)
      console.log('🔄 Starting Google sign-in process...')
      
      // Call Firebase sign-in with popup
      const firebaseUser = await signInWithGoogle();
      
      if (firebaseUser) {
        console.log('✅ Firebase sign-in successful, processing user data...')
        // Process the user data immediately
        await handleGoogleUser(firebaseUser);
        console.log('✅ User data processed and state updated');
        setIsLoading(false); // Set loading to false after successful login
      } else {
        console.log('❌ No user returned from Firebase sign-in');
        setIsLoading(false);
        throw new Error('Google sign-in failed. No user data received.');
      }
    } catch (error) {
      console.error('❌ Google login failed:', error)
      setIsLoading(false) // Set loading to false on error
      throw error
    }
  }

  const logout = async () => {
    try {
      // If user was authenticated with Google, sign out from Firebase
      if (user?.authProvider === 'google') {
        await signOutUser();
      } else {
        // Call logout API to blacklist token
        if (user?.role === 'admin') {
          await authAPI.adminLogout()
        } else {
          await authAPI.logout()
        }
      }
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      // Clear local storage and state regardless of API call success
      safeLocalStorage.removeItem('token')
      safeLocalStorage.removeItem('user')
      setUser(null)
      router.push('/')
    }
  }

  const updateProfile = async (data: { name?: string; phone?: string }) => {
    try {
      setIsLoading(true)
      
      if (user?.authProvider === 'google') {
        // For Google users, update local state only
        const updatedUser = { ...user, ...data }
        setUser(updatedUser)
        safeLocalStorage.setItem('user', JSON.stringify(updatedUser))
      } else {
        // For email users, update backend
        const response = await authAPI.updateProfile(data)
        
        // Update local state with fresh data
        const updatedUser = { ...user, ...response.user }
        setUser(updatedUser)
        safeLocalStorage.setItem('user', JSON.stringify(updatedUser))
      }
    } catch (error) {
      console.error('Profile update failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isLoading,
    login,
    register,
    completePhoneRegistration,
    loginWithGoogle,
    logout,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook to protect routes
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/?auth=required')
    }
  }, [isAuthenticated, isLoading, router])

  return { isAuthenticated, isLoading }
}

// Hook to require admin access
export function useRequireAdmin() {
  const { isAdmin, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/?auth=denied')
    }
  }, [isAdmin, isLoading, router])

  return { isAdmin, isLoading }
}
