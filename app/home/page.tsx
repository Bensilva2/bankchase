'use client'

import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Loading...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Chase Bank Voice Agent Platform
          </h1>
          <p className="text-xl text-muted-foreground">
            Banking redefined with advanced voice security
          </p>
        </div>

        {user ? (
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold text-foreground">
              Welcome back, {user.firstName || user.username}!
            </h2>
            <div className="space-x-4">
              <Link href="/dashboard">
                <Button size="lg" className="px-8">
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/accounts">
                <Button size="lg" variant="outline" className="px-8">
                  View Accounts
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">New User?</h2>
              <p className="text-muted-foreground mb-6">
                Create your account and access our banking platform with advanced security features.
              </p>
              <Link href="/login">
                <Button size="lg" className="w-full">
                  Sign Up
                </Button>
              </Link>
            </div>

            <div className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Existing Customer?</h2>
              <p className="text-muted-foreground mb-6">
                Sign in to your account to manage your finances securely.
              </p>
              <Link href="/">
                <Button size="lg" className="w-full">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-foreground text-center mb-8">Key Features</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="font-bold text-foreground mb-2">Voice Biometrics</h4>
              <p className="text-muted-foreground text-sm">
                Advanced voice recognition for secure authentication
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="font-bold text-foreground mb-2">Real-time Security</h4>
              <p className="text-muted-foreground text-sm">
                Behavioral analysis and drift detection for fraud prevention
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="font-bold text-foreground mb-2">Demo Money System</h4>
              <p className="text-muted-foreground text-sm">
                Test transfers with automatic refund capabilities
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
