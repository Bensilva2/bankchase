'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import { P2PPayment } from '@/components/p2p-payment'
import { BackButton } from '@/components/back-button'
import { Send } from 'lucide-react'
import posthog from 'posthog-js'

export default function SendMoneyPage() {
  const router = useRouter()
  const { userId, isLoaded } = useAuth()
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (isLoaded) {
      posthog.capture('send_money_viewed')
    }
  }, [isLoaded])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
          <div>
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-2">
              <Send className="w-10 h-10 text-primary" />
              Send Money
            </h1>
            <p className="text-muted-foreground mt-1">Transfer funds to friends and family instantly</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <P2PPayment
              senderName={user?.name || 'User'}
              senderEmail={user?.email || ''}
              onComplete={(transactionId) => {
                console.log('[v0] Payment completed:', transactionId)
                // Could add to recent transactions
              }}
            />
          </div>

          {/* Sidebar Info */}
          <div className="space-y-4">
            {/* Limits */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-bold mb-3">Transfer Limits</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Per Transfer:</span>
                  <span className="font-semibold">$10,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Limit:</span>
                  <span className="font-semibold">$50,000</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-900 mb-3">💡 Tips</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Double-check recipient email</li>
                <li>• Include a clear description</li>
                <li>• Transfers process instantly</li>
              </ul>
            </div>

            {/* Security */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-bold text-green-900 mb-3">🔒 Secure</h3>
              <p className="text-sm text-green-800">
                All transactions are encrypted and verified through Stripe's secure payment gateway.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
