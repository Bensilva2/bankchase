'use client'

// Auth client for handling authentication requests
export const authClient = {
  signUp: {
    email: async (credentials: { email: string; password: string; name?: string }) => {
      try {
        const response = await fetch('/api/auth/sign-up', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        })

        const data = await response.json()

        if (!response.ok) {
          return { error: { message: data.error || 'Sign up failed' } }
        }

        return { data }
      } catch (error) {
        return { error: { message: 'Network error. Please try again.' } }
      }
    },
  },

  signIn: {
    email: async (credentials: { email: string; password: string }) => {
      try {
        const response = await fetch('/api/auth/sign-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
        })

        const data = await response.json()

        if (!response.ok) {
          return { error: { message: data.error || 'Sign in failed' } }
        }

        return { data }
      } catch (error) {
        return { error: { message: 'Network error. Please try again.' } }
      }
    },
  },

  signOut: async () => {
    try {
      await fetch('/api/auth/sign-out', { method: 'POST' })
    } catch (error) {
      console.error('[v0] Sign out error:', error)
    }
  },
}
