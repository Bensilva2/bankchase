'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

interface ConnectedAccount {
  id: string
  stripeAccountId: string
  businessName: string
  email: string
  accountStatus: string
  verificationStatus: string
  totalEarnings: number
  totalPayouts: number
  commissionRate: number
  createdAt: string
}

interface Balance {
  available: Array<{ amount: number; currency: string }>
  pending: Array<{ amount: number; currency: string }>
}

export default function StripConnectDashboard() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [balances, setBalances] = useState<Record<string, Balance>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // In a real app, fetch from your database
        const mockAccounts: ConnectedAccount[] = [
          {
            id: 'acct_1',
            stripeAccountId: 'acct_1234567890',
            businessName: 'Chase Payments',
            email: 'payments@chase.com',
            accountStatus: 'verified',
            verificationStatus: 'verified',
            totalEarnings: 15250.5,
            totalPayouts: 12000.0,
            commissionRate: 2.5,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'acct_2',
            stripeAccountId: 'acct_0987654321',
            businessName: 'Premium Banking',
            email: 'support@premiumbanking.com',
            accountStatus: 'pending',
            verificationStatus: 'pending',
            totalEarnings: 5000.0,
            totalPayouts: 4000.0,
            commissionRate: 2.5,
            createdAt: new Date().toISOString(),
          },
        ]

        setAccounts(mockAccounts)
        console.log('[v0] Loaded accounts:', mockAccounts.length)
      } catch (err) {
        setError('Failed to load accounts')
        console.error('[v0] Error loading accounts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stripe Connect Platform</h1>
          <p className="text-muted-foreground mt-2">Manage connected accounts and transactions</p>
        </div>
        <Link href="/dashboard/stripe-connect/onboard">
          <Button>Onboard New Account</Button>
        </Link>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground mt-2">Connected accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(accounts.reduce((sum, acc) => sum + acc.totalEarnings, 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Total earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(accounts.reduce((sum, acc) => sum + acc.totalPayouts, 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Distributed to sellers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Verified Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.filter((a) => a.verificationStatus === 'verified').length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Ready to receive payouts</p>
          </CardContent>
        </Card>
      </div>

      {/* Connected Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>All Stripe Connect accounts on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">Business</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Account Status</th>
                  <th className="text-left py-3 px-4 font-medium">Verification</th>
                  <th className="text-right py-3 px-4 font-medium">Total Earnings</th>
                  <th className="text-right py-3 px-4 font-medium">Total Payouts</th>
                  <th className="text-left py-3 px-4 font-medium">Commission</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-b hover:bg-muted/50">
                    <td className="py-4 px-4 font-medium">{account.businessName}</td>
                    <td className="py-4 px-4 text-muted-foreground">{account.email}</td>
                    <td className="py-4 px-4">
                      <Badge
                        variant={account.accountStatus === 'verified' ? 'default' : 'outline'}
                      >
                        {account.accountStatus}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        variant={account.verificationStatus === 'verified' ? 'default' : 'secondary'}
                      >
                        {account.verificationStatus}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-right font-medium">
                      ${(account.totalEarnings / 100).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right font-medium">
                      ${(account.totalPayouts / 100).toFixed(2)}
                    </td>
                    <td className="py-4 px-4">{account.commissionRate}%</td>
                    <td className="py-4 px-4">
                      <Link
                        href={`/dashboard/stripe-connect/accounts/${account.id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Account Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{account.businessName}</CardTitle>
                  <CardDescription>{account.email}</CardDescription>
                </div>
                <Badge variant={account.accountStatus === 'verified' ? 'default' : 'outline'}>
                  {account.accountStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">${(account.totalEarnings / 100).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Payouts</p>
                  <p className="text-2xl font-bold">${(account.totalPayouts / 100).toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Commission Rate</p>
                  <p className="font-medium">{account.commissionRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Verification</p>
                  <Badge variant={account.verificationStatus === 'verified' ? 'default' : 'secondary'}>
                    {account.verificationStatus}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Link href={`/dashboard/stripe-connect/accounts/${account.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
                <Button variant="ghost" className="flex-1">
                  Transactions
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
