'use client'

// Simple auth client
export const authClient = {
  signUp: {
    email: async (credentials: any) => {
      const response = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })
      return response.json()
    },
  },
  signIn: {
    email: async (credentials: any) => {
      const response = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })
      return response.json()
    },
  },
  signOut: async () => {
    await fetch('/api/auth/sign-out', { method: 'POST' })
  },
}
