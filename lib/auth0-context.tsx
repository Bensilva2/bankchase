'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface User {
  id: string
  auth0_id?: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  ssn?: string
  dateOfBirth?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  role?: 'admin' | 'editor' | 'viewer'
  emailVerified?: boolean
  picture?: string
  permissions?: Array<{
    role: string
    action: string
    resource: string
  }>
}

interface AuthContextType {
  user: User | null
  session: any | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (email: string, password: string, otpCode?: string) => Promise<void>
  loginWithAuth0: (returnTo?: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => Promise<void>
  verifyOTP: (email: string, otpCode: string) => Promise<void>
  requestOTP: (email: string) => Promise<void>
  refreshUser: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function Auth0Provider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          setSession(data.session)
        }
      } catch (err) {
        console.error('Failed to initialize session:', err)
      } finally {
        setLoading(false)
      }
    }

    initializeSession()
  }, [])

  const login = async (email: string, password: string, otpCode?: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          otpCode,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Login failed')
      }

      const data = await response.json()
      setUser(data.user)
      setSession(data.session)
      router.push('/dashboard')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const loginWithAuth0 = async (returnTo?: string) => {
    try {
      setLoading(true)
      setError(null)
      const redirect = returnTo || '/dashboard'
      window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(redirect)}`
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Auth0 login failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Registration failed')
      }

      const data = await response.json()
      setUser(data.user)
      setSession(data.session)
      router.push('/dashboard')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setSession(null)
      router.push('/login')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setLoading(false)
    }
  }

  const requestOTP = async (email: string) => {
    try {
      setError(null)

      const response = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to request OTP')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request OTP'
      setError(errorMessage)
      throw err
    }
  }

  const verifyOTP = async (email: string, otpCode: string) => {
    try {
      setError(null)

      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Invalid OTP')
      }

      const data = await response.json()
      setUser(data.user)
      setSession(data.session)
      router.push('/dashboard')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OTP verification failed'
      setError(errorMessage)
      throw err
    }
  }

  const refreshUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (err) {
      console.error('Failed to refresh user:', err)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        loginWithAuth0,
        register,
        logout,
        requestOTP,
        verifyOTP,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within Auth0Provider')
  }
  return context
}
