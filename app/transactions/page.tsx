'use client'

import { useState, useMemo } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { Search, Filter, Download, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'

interface FilterState {
  searchQuery: string
  transactionType: 'all' | 'credit' | 'debit'
  dateRange: 'all' | 'week' | 'month' | 'quarter' | 'year'
  minAmount: string
  maxAmount: string
  category: 'all' | string
}

function TransactionsContent() {
  const { transactions = [], isLoading } = useTransactions()
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    transactionType: 'all',
    dateRange: 'all',
    minAmount: '',
    maxAmount: '',
    category: 'all',
  })
  const [showFilters, setShowFilters] = useState(false)

  // Calculate date range
  const getDateRangeStart = () => {
    const now = new Date()
    switch (filters.dateRange) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      default:
        return new Date(0)
    }
  }

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return []

    const dateStart = getDateRangeStart()
    const minAmt = filters.minAmount ? parseFloat(filters.minAmount) : 0
    const maxAmt = filters.maxAmount ? parseFloat(filters.maxAmount) : Infinity

    return transactions.filter((tx) => {
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const matchesSearch =
          (tx.description && tx.description.toLowerCase().includes(query)) ||
          (tx.narration && tx.narration.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }

      // Transaction type
      if (filters.transactionType !== 'all') {
        const txType = tx.type === 'credit' ? 'credit' : 'debit'
        if (txType !== filters.transactionType) return false
      }

      // Date range
      const txDate = new Date(tx.date || tx.created_at)
      if (txDate < dateStart) return false

      // Amount range
      const amount = Math.abs(tx.amount)
      if (amount < minAmt || amount > maxAmt) return false

      return true
    })
  }, [transactions, filters])

  // Calculate statistics
  const stats = useMemo(() => {
    const credits = filteredTransactions.filter((tx) => tx.type === 'credit')
    const debits = filteredTransactions.filter((tx) => tx.type !== 'credit')

    return {
      totalIncome: credits.reduce((sum, tx) => sum + tx.amount, 0),
      totalExpenses: debits.reduce((sum, tx) => sum + tx.amount, 0),
      transactionCount: filteredTransactions.length,
    }
  }, [filteredTransactions])

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      transactionType: 'all',
      dateRange: 'all',
      minAmount: '',
      maxAmount: '',
      category: 'all',
    })
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Transactions</h1>
          <p className="text-muted-foreground">View and manage your transaction history</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Transactions</p>
            <p className="text-3xl font-bold text-foreground">{stats.transactionCount}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Income</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              +${stats.totalIncome.toFixed(2)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Expenses</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              -${stats.totalExpenses.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search transactions by description..."
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Filter Button and Active Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg hover:border-primary/50 transition text-foreground"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>

              {/* Active filter badges */}
              {filters.transactionType !== 'all' && (
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  {filters.transactionType === 'credit' ? 'Income' : 'Expenses'}
                </span>
              )}
              {filters.dateRange !== 'all' && (
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm capitalize">
                  Last {filters.dateRange}
                </span>
              )}
              {filters.minAmount || filters.maxAmount ? (
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  ${filters.minAmount || '0'} - ${filters.maxAmount || '∞'}
                </span>
              ) : null}

              {(filters.searchQuery ||
                filters.transactionType !== 'all' ||
                filters.dateRange !== 'all' ||
                filters.minAmount ||
                filters.maxAmount) && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-1 text-sm text-primary hover:text-primary/80 transition"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="pt-4 border-t border-border space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Transaction Type */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Transaction Type
                    </label>
                    <select
                      value={filters.transactionType}
                      onChange={(e) =>
                        handleFilterChange('transactionType', e.target.value as any)
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">All Types</option>
                      <option value="credit">Income</option>
                      <option value="debit">Expenses</option>
                    </select>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Date Range
                    </label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => handleFilterChange('dateRange', e.target.value as any)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">All Time</option>
                      <option value="week">Last Week</option>
                      <option value="month">Last Month</option>
                      <option value="quarter">Last 3 Months</option>
                      <option value="year">Last Year</option>
                    </select>
                  </div>

                  {/* Min Amount */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Min Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={filters.minAmount}
                        onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                        className="w-full pl-7 pr-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Max Amount */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Max Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={filters.maxAmount}
                        onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                        className="w-full pl-7 pr-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
              <p className="text-muted-foreground mt-4">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition group cursor-pointer"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`p-3 rounded-lg ${
                      tx.type === 'credit'
                        ? 'bg-green-100 dark:bg-green-950'
                        : 'bg-red-100 dark:bg-red-950'
                    }`}
                  >
                    {tx.type === 'credit' ? (
                      <ArrowDownLeft className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{tx.description}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(tx.date || tx.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`font-semibold text-lg ${
                      tx.type === 'credit'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                  </p>
                  {tx.narration && (
                    <p className="text-sm text-muted-foreground">{tx.narration}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <p className="text-muted-foreground mb-2">No transactions found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or search terms
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function TransactionsPage() {
  return (
    <ProtectedRoute>
      <Navigation />
      <TransactionsContent />
    </ProtectedRoute>
  )
}
