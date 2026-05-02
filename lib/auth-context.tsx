import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import jwt from 'jsonwebtoken'

interface User {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function decodeToken(token: string): User | null {
  try {
    const decoded = jwt.decode(token) as any
    if (!decoded) return null

    return {
      id: decoded.userId,
      email: decoded.email,
      username: decoded.username,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      role: decoded.role || 'viewer',
    }
  } catch {
    return null
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = localStorage.getItem('access_token')

        if (!token) {
          setLoading(false)
          return
        }

        // Decode token and extract user info
        const decodedUser = decodeToken(token)
        if (decodedUser) {
          setUser(decodedUser)
        } else {
          localStorage.removeItem('access_token')
        }
      } catch (err) {
        console.error('Token verification failed:', err)
        localStorage.removeItem('access_token')
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [])

  const login = async (email: string, password: string) => {
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Login failed')
      }

      const data = await response.json()
      localStorage.setItem('access_token', data.token)

      // Decode token to get user info
      const decodedUser = decodeToken(data.token)
      if (decodedUser) {
        setUser(decodedUser)

        // Redirect based on role
        if (decodedUser.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/accounts')
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
    router.push('/login')
  }

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
