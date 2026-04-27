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
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
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

  // Initialize from localStorage and verify token
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token')
        const storedUser = localStorage.getItem('auth_user')

        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))

          // Verify token is still valid (but don't fail if verification fails)
          try {
            await verifyTokenHelper(storedToken)
          } catch (verifyErr) {
            // Token verification failed, but we'll stay logged in with cached data
            console.warn('Token verification failed, using cached data:', verifyErr)
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        setUser(null)
        setToken(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
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

  const login = async (username: string, password: string) => {
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
        body: JSON.stringify({ username: username.trim(), password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Invalid username or password')
      }

      const data = await response.json()

      if (!data.token || !data.user) {
        throw new Error('Invalid authentication response from server')
      }

      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))

      setToken(data.token)
      setUser(data.user)
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

      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))

      setToken(data.token)
      setUser(data.user)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
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
