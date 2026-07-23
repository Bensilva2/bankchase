'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw } from 'lucide-react'

interface Transfer {
  id: string
  transfer_id: string
  to_account_number: string
  amount: number
  status: 'pending' | 'completed' | 'refunded'
  transfer_type: 'internal' | 'external'
  created_at: string
  expires_at?: string
  refunded_at?: string
  notes?: string
  from_account?: {
    account_number: string
    balance: number
  }
}

const statusColors = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  refunded: 'bg-background text-foreground',
}

const typeColors = {
  internal: 'bg-background',
  external: 'bg-purple-50',
}

export function DemoTransferHistory() {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'refunded'>('all')

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const url = new URL('/api/admin/demo-transfer/history', window.location.origin)
      if (filter !== 'all') {
        url.searchParams.append('status', filter)
      }

      const response = await fetch(url.toString())
      const result = await response.json()

      if (result.success) {
        setTransfers(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch transfer history:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [filter])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDaysUntilRefund = (expiresAt?: string) => {
    if (!expiresAt) return null
    const now = new Date()
    const expiry = new Date(expiresAt)
    const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Transfer History</CardTitle>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="p-2 hover:bg-background rounded-lg transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {(['all', 'pending', 'completed', 'refunded'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filter === f
                  ? 'bg-[#0a4fa6] text-background'
                  : 'bg-background text-foreground hover:bg-card'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No transfers found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Transfer ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">To Account</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Amount</th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">Type</th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Created</th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">Refund In</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer) => (
                  <tr
                    key={transfer.id}
                    className={`border-b border-border hover:bg-background transition ${typeColors[transfer.transfer_type]}`}
                  >
                    <td className="py-3 px-4">
                      <code className="text-xs bg-background px-2 py-1 rounded">
                        {transfer.transfer_id.substring(0, 8)}...
                      </code>
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">{transfer.to_account_number}</td>
                    <td className="py-3 px-4 text-right font-semibold text-foreground">
                      ${transfer.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant="outline"
                        className={transfer.transfer_type === 'internal' ? 'bg-background' : 'bg-purple-50'}
                      >
                        {transfer.transfer_type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge className={statusColors[transfer.status]}>
                        {transfer.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {formatDate(transfer.created_at)}
                    </td>
                    <td className="py-3 px-4 text-center text-xs">
                      {transfer.status === 'pending' && transfer.expires_at
                        ? `${getDaysUntilRefund(transfer.expires_at)} days`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
