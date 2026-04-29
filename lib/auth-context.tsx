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

  // Initialize from localStorage - use cached data immediately
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('auth_user')

      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
    } catch (err) {
      console.error('Auth initialization error:', err)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    } finally {
      setLoading(false)
    }
  }, [])



  const login = async (username: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      // Input validation
      if (!username || !password) {
        throw new Error('Username and password are required')
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
    // Token is already verified when loading from localStorage
    // No need for additional verification on every load
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
