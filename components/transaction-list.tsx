'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBanking, Transaction } from '@/lib/banking-context'
import { ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react'

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'
type FilterType = 'all' | 'debit' | 'credit'

interface TransactionListProps {
  accountId?: string
  limit?: number
  showFilters?: boolean
}

export function TransactionList({ accountId, limit = 20, showFilters = true }: TransactionListProps) {
  const { transactions, getTransactionsByType, searchTransactions } = useBanking()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortOption>('date-desc')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(transactions.map((tx) => tx.category))
    return Array.from(cats).sort()
  }, [transactions])

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions

    // Filter by account if provided
    if (accountId) {
      filtered = filtered.filter((tx) => tx.accountId === accountId || tx.accountFrom === accountId || tx.accountTo === accountId)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = searchTransactions(searchQuery)
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((tx) => tx.type === filterType)
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((tx) => tx.category === selectedCategory)
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const aDate = new Date(a.date).getTime()
      const bDate = new Date(b.date).getTime()
      const aAmount = a.amount
      const bAmount = b.amount

      switch (sortBy) {
        case 'date-asc':
          return aDate - bDate
        case 'date-desc':
          return bDate - aDate
        case 'amount-asc':
          return aAmount - bAmount
        case 'amount-desc':
          return bAmount - aAmount
        default:
          return bDate - aDate
      }
    })

    return sorted.slice(0, limit)
  }, [transactions, accountId, searchQuery, filterType, selectedCategory, sortBy, limit, searchTransactions])

  const CategoryBadge = ({ category }: { category: string }) => {
    const colors: Record<string, string> = {
      'Income': 'bg-green-100 text-green-800',
      'Shopping': 'bg-blue-100 text-blue-800',
      'Food & Drink': 'bg-orange-100 text-orange-800',
      'Dining': 'bg-orange-100 text-orange-800',
      'Bills & Utilities': 'bg-red-100 text-red-800',
      'Entertainment': 'bg-purple-100 text-purple-800',
      'Transportation': 'bg-yellow-100 text-yellow-800',
      'Cash': 'bg-gray-100 text-gray-800',
      'Transfers': 'bg-indigo-100 text-indigo-800',
      'Interest': 'bg-emerald-100 text-emerald-800',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[category] || 'bg-gray-100 text-gray-800'}`}>
        {category}
      </span>
    )
  }

  const TransactionRow = ({ tx }: { tx: Transaction }) => {
    const isCredit = tx.type === 'credit'
    const icon = isCredit ? (
      <ArrowDownLeft className="w-4 h-4 text-green-600" />
    ) : (
      <ArrowUpRight className="w-4 h-4 text-red-600" />
    )

    return (
      <div className="flex items-center justify-between py-4 border-b hover:bg-gray-50 px-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">{icon}</div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">{tx.description}</p>
            <div className="flex items-center gap-2 mt-1">
              <CategoryBadge category={tx.category} />
              <span className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</span>
              {tx.reference && <span className="text-xs text-gray-400">• {tx.reference}</span>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-semibold ${isCredit ? 'text-green-600' : 'text-gray-900'}`}>
            {isCredit ? '+' : '-'}${tx.amount.toFixed(2)}
          </p>
          {tx.status && (
            <p className={`text-xs mt-1 ${tx.status === 'completed' ? 'text-green-600' : 'text-amber-600'}`}>
              {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="debit">Expenses</SelectItem>
                <SelectItem value="credit">Income</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="amount-desc">Highest Amount</SelectItem>
                <SelectItem value="amount-asc">Lowest Amount</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setFilterType('all')
                setSortBy('date-desc')
                setSelectedCategory('all')
              }}
              className="text-sm"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="bg-white rounded-lg border">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No transactions found</p>
            {searchQuery && <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filters</p>}
          </div>
        ) : (
          <div>
            {filteredTransactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
