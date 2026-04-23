'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2, XCircle } from 'lucide-react'
import type { Transaction } from '@/hooks/use-transaction-history'

interface RealTimeTransactionHistoryProps {
  transactions: Transaction[]
  isLoading: boolean
  error?: string | null
  onRefresh?: () => Promise<void>
}

const CATEGORY_ICONS: Record<string, string> = {
  'Food & Drink': '🍔',
  Shopping: '🛍️',
  Transportation: '🚗',
  Entertainment: '🎬',
  'Bills & Utilities': '💡',
  Income: '💰',
  Transfer: '↔️',
  'External Transfer': '🌐',
  'Bill Payment': '📝',
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Drink': 'bg-orange-100 text-orange-800',
  Shopping: 'bg-pink-100 text-pink-800',
  Transportation: 'bg-blue-100 text-blue-800',
  Entertainment: 'bg-purple-100 text-purple-800',
  'Bills & Utilities': 'bg-yellow-100 text-yellow-800',
  Income: 'bg-green-100 text-green-800',
  Transfer: 'bg-indigo-100 text-indigo-800',
  'External Transfer': 'bg-cyan-100 text-cyan-800',
  'Bill Payment': 'bg-red-100 text-red-800',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined })
}

export function RealTimeTransactionHistory({
  transactions,
  isLoading,
  error,
  onRefresh,
}: RealTimeTransactionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all')

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = filterType === 'all' || tx.type === filterType
      const matchesStatus = filterStatus === 'all' || tx.status === filterStatus

      return matchesSearch && matchesType && matchesStatus
    })
  }, [transactions, searchTerm, filterType, filterStatus])

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {}

    filteredTransactions.forEach((tx) => {
      const date = formatDate(tx.createdAt)
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(tx)
    })

    return Object.entries(groups).sort((a, b) => {
      if (a[0] === 'Today') return -1
      if (b[0] === 'Today') return 1
      if (a[0] === 'Yesterday') return -1
      if (b[0] === 'Yesterday') return 1
      return 0
    })
  }, [filteredTransactions])

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="gap-2 bg-transparent"
          >
            ⟳ Refresh
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <Input
            type="search"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />

          <div className="flex gap-2 flex-wrap">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="credit">Income</option>
              <option value="debit">Spending</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">Loading transactions...</p>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && filteredTransactions.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-500">No transactions found</p>
        </Card>
      )}

      {/* Transactions List */}
      {!isLoading &&
        groupedTransactions.map(([date, txns]) => (
          <div key={date} className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 px-2">{date}</h3>

            <div className="space-y-2">
              {txns.map((tx) => (
                <Card
                  key={tx.id}
                  className="p-4 hover:bg-gray-50 transition-colors border-l-4"
                  style={{
                    borderLeftColor: tx.type === 'credit' ? '#10b981' : '#ef4444',
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Icon and Description */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {tx.type === 'credit' ? (
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <ArrowDownLeft className="w-5 h-5 text-green-600" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <ArrowUpRight className="w-5 h-5 text-red-600" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{tx.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={`${CATEGORY_COLORS[tx.category] || 'bg-gray-100 text-gray-800'} text-xs`}
                          >
                            {CATEGORY_ICONS[tx.category] || '●'} {tx.category}
                          </Badge>

                          {tx.status === 'pending' && (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Pending
                            </Badge>
                          )}
                          {tx.status === 'failed' && (
                            <Badge variant="outline" className="bg-red-100 text-red-800 text-xs flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Failed
                            </Badge>
                          )}
                          {tx.status === 'completed' && (
                            <Badge variant="outline" className="bg-green-100 text-green-800 text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Completed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`text-lg font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}
                      >
                        {tx.type === 'credit' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Fee if applicable */}
                  {tx.fee && tx.fee > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Fee: {formatCurrency(tx.fee)}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}
