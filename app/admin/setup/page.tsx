'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [domains, setDomains] = useState<string[]>([])
  const [error, setError] = useState('')

  const handleSetupPaymentMethods = async () => {
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/setup/payment-methods', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Payment method domains setup complete!')
        setDomains(data.domains)
      } else {
        setError(data.error || 'Setup failed')
      }
    } catch (err: any) {
      setError(err.message || 'Error during setup')
    } finally {
      setLoading(false)
    }
  }

  const handleGetDomains = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/setup/payment-methods')
      const data = await response.json()

      if (data.success) {
        setDomains(data.domains)
        setMessage('Registered domains loaded')
      } else {
        setError(data.error || 'Failed to fetch domains')
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching domains')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>BankChase Admin Setup</CardTitle>
            <CardDescription>
              Configure payment methods, domains, and system settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Methods Setup */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Payment Method Setup</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Register domains for Stripe payment methods (Link, Apple Pay, Google Pay)
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleSetupPaymentMethods}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Setting up...' : 'Setup Payment Methods'}
                </Button>

                <Button
                  onClick={handleGetDomains}
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? 'Loading...' : 'View Registered Domains'}
                </Button>
              </div>

              {message && (
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <p className="text-green-800 text-sm">{message}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {domains.length > 0 && (
                <div className="bg-muted p-4 rounded">
                  <h4 className="font-medium mb-2">Registered Domains:</h4>
                  <ul className="space-y-2">
                    {domains.map((domain) => (
                      <li key={domain} className="text-sm font-mono bg-background p-2 rounded">
                        {domain}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* System Status */}
            <div className="border-t pt-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">System Status</h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-muted">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">✓</p>
                      <p className="text-xs text-muted-foreground mt-2">Stripe Connected</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">✓</p>
                      <p className="text-xs text-muted-foreground mt-2">Database Ready</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">○</p>
                      <p className="text-xs text-muted-foreground mt-2">Webhooks</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Links */}
            <div className="border-t pt-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
              </div>

              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <a href="/payments">→ Payments</a>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <a href="/dashboard/stripe-connect">→ Stripe Connect Dashboard</a>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <a href="/dashboard/balance">→ Balance Dashboard</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
