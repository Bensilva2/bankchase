'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Balance {
  accountId: string
  available: number
  pending: number
  reserved: number
  total: number
  currency: string
  lastUpdated: Date
}

interface Transaction {
  id: string
  accountId: string
  type: 'charge' | 'transfer' | 'payout' | 'refund' | 'adjustment'
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string
  relatedId: string
  status: 'completed' | 'pending' | 'failed'
  createdAt: Date
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function BalanceDashboard({ accountId }: { accountId: string }) {
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [transferAmount, setTransferAmount] = useState('')
  const [recipientId, setRecipientId] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: balance, mutate: refreshBalance } = useSWR<Balance>(
    `/api/balance/get?accountId=${accountId}`,
    fetcher,
    { refreshInterval: 5000 }
  )

  const { data: historyData } = useSWR<{
    transactions: Transaction[]
    count: number
  }>(`/api/balance/history?accountId=${accountId}&limit=10`, fetcher, {
    refreshInterval: 10000,
  })

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/balance/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccountId: accountId,
          toAccountId: recipientId,
          amount: parseFloat(transferAmount),
          description: `Transfer to ${recipientId}`,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        alert(`Error: ${result.error}`)
        return
      }

      alert(`Transfer successful! Transaction ID: ${result.transactionId}`)
      setTransferAmount('')
      setRecipientId('')
      setIsTransferOpen(false)
      refreshBalance()
    } catch (error) {
      console.error('[v0] Transfer error:', error)
      alert('Failed to process transfer')
    } finally {
      setLoading(false)
    }
  }

  if (!balance) {
    return <div className="text-center py-8">Loading balance...</div>
  }

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${balance.available.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready to transfer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${balance.pending.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Being processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reserved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${balance.reserved.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Held for transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${balance.total.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {balance.currency}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Section */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Transfer</CardTitle>
        </CardHeader>
        <CardContent>
          {isTransferOpen ? (
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Recipient Account ID
                </label>
                <input
                  type="text"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  placeholder="Enter recipient account ID"
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Processing...' : 'Transfer'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsTransferOpen(false)
                    setTransferAmount('')
                    setRecipientId('')
                  }}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button
              onClick={() => setIsTransferOpen(true)}
              className="w-full"
            >
              Start Transfer
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {historyData?.transactions && historyData.transactions.length > 0 ? (
            <div className="space-y-2">
              {historyData.transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{txn.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {txn.type.toUpperCase()} •{' '}
                      {new Date(txn.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-medium ${
                        txn.amount > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {txn.amount > 0 ? '+' : ''}{txn.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {txn.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No transactions yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
