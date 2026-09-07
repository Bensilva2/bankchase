'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export interface User {
  id: string
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
  permissions?: Array<{
    role: string
    action: string
    resource: string
  }>
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  login: (username: string, password: string, token?: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  verifyToken: () => Promise<void>
}

interface RegisterData {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  ssn: string
  dateOfBirth: string
  address: string
  city: string
  state: string
  zipCode: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Restore the server-managed session on every full page load.
  useEffect(() => {
    let active = true

    const initAuth = async () => {
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' })
        if (!response.ok) throw new Error('Session check failed')
        const data = await response.json()
        if (!active) return

        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email ?? '',
            username: data.user.user_metadata?.username ?? data.user.email ?? '',
            firstName: data.user.user_metadata?.firstName ?? '',
            lastName: data.user.user_metadata?.lastName ?? '',
            role: data.user.app_metadata?.role ?? 'customer',
          })
          setToken(data.session?.access_token ?? null)
        } else {
          setUser(null)
          setToken(null)
        }
      } catch (err) {
        console.error('[v0] Auth initialization error:', err)
        if (active) {
          setUser(null)
          setToken(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void initAuth()
    return () => { active = false }
  }, [])

  const verifyTokenHelper = async (tokenToVerify: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Token verification failed')
      }

      const data = await response.json()
      setUser(data.user)
      setToken(tokenToVerify)
    } catch (err) {
      console.error('Token verification error:', err)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      setUser(null)
      setToken(null)
      throw err
    }
  }

  const login = async (username: string, password: string, token?: string) => {
    try {
      setLoading(true)
      setError(null)

      // Input validation
      if (!username || !password) {
        throw new Error('Username and password are required')
      }

      if (username.trim().length === 0 || password.trim().length === 0) {
        throw new Error('Username and password cannot be empty')
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, token: token?.trim() || undefined }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Invalid username or password')
      }

      const data = await response.json()

      if (!data.user) {
        throw new Error(data.message || 'Your account needs email confirmation before you can sign in.')
      }

      // Demo sessions are cookie-backed; Supabase sessions are cookie-backed too.
      // Keep React state aligned with the server response without duplicating auth in storage.
      setToken(data.token ?? null)
      setUser(data.user)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.'
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

      if (!data.user) {
        throw new Error('Invalid registration response from server')
      }

      // Email confirmation responses intentionally do not create an active session.
      setToken(data.token ?? null)
      setUser(data.token ? data.user : null)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    void fetch('/api/auth/logout', { method: 'POST' }).catch((err) => {
      console.error('[v0] Logout request failed:', err)
    })
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setUser(null)
    setToken(null)
    setError(null)
  }

  const verifyToken = async () => {
    if (!token) {
      throw new Error('No token available')
    }

    try {
      await verifyTokenHelper(token)
    } catch (err) {
      setUser(null)
      setToken(null)
      throw err
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        verifyToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
