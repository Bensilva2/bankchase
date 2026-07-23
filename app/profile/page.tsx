'use client'


import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import { Mail } from 'lucide-react'

function ProfileContent() {
  
  const { user, isLoaded: userLoaded } = useUser()
  const router = useRouter()

  if (!isLoaded || !userLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    )
  }

  if (!userId || !user) {
    return null
  }

  const memberSinceDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      })
    : 'Unknown'

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <Navigation />
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Profile</h1>
          <p className="text-muted-foreground">View your account information</p>
        </div>

        <div className="mt-8 bg-card border border-border rounded-xl p-6 md:p-8">
          <div className="space-y-6">
            <div className="border-b border-border pb-6">
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Full Name</p>
              <p className="text-lg font-semibold text-foreground mt-2">
                {user.firstName} {user.lastName}
              </p>
            </div>

            <div className="border-b border-border pb-6">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Email</p>
              </div>
              <p className="text-lg font-semibold text-foreground mt-2">
                {user.emailAddresses[0]?.emailAddress || 'Not set'}
              </p>
            </div>

            <div className="border-b border-border pb-6">
              <p className="text-sm text-muted-foreground uppercase tracking-wide">User ID</p>
              <p className="text-lg font-mono text-foreground mt-2">{userId}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Member Since</p>
              <p className="text-lg font-semibold text-foreground mt-2">{memberSinceDate}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  )
}
