'use client'

import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Search, Filter, Calendar, Tag } from 'lucide-react'

interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  category: string
  type: 'debit' | 'credit'
}

interface TransactionSearchProps {
  transactions?: Transaction[]
  onFilterChange?: (filtered: Transaction[]) => void
}

export function TransactionSearch({ transactions = [], onFilterChange }: TransactionSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [amountRange, setAmountRange] = useState({ min: '', max: '' })
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Mock transactions if none provided
  const mockTransactions: Transaction[] = [
    { id: '1', description: 'Amazon Purchase', amount: 45.99, date: '2024-07-08', category: 'Shopping', type: 'debit' },
    { id: '2', description: 'Starbucks', amount: 6.50, date: '2024-07-08', category: 'Dining', type: 'debit' },
    { id: '3', description: 'Salary Deposit', amount: 4500, date: '2024-07-01', category: 'Income', type: 'credit' },
    { id: '4', description: 'Electric Bill', amount: 120.00, date: '2024-07-05', category: 'Utilities', type: 'debit' },
    { id: '5', description: 'Whole Foods', amount: 78.30, date: '2024-07-07', category: 'Groceries', type: 'debit' },
  ]

  const data = transactions.length > 0 ? transactions : mockTransactions
  const categories = useMemo(() => [...new Set(data.map(t => t.category))], [data])

  const filteredTransactions = useMemo(() => {
    return data.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           transaction.category.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = !selectedCategory || transaction.category === selectedCategory
      
      const transactionDate = new Date(transaction.date)
      const matchesDateStart = !dateRange.start || transactionDate >= new Date(dateRange.start)
      const matchesDateEnd = !dateRange.end || transactionDate <= new Date(dateRange.end)
      
      const matchesAmountMin = !amountRange.min || transaction.amount >= parseFloat(amountRange.min)
      const matchesAmountMax = !amountRange.max || transaction.amount <= parseFloat(amountRange.max)
      
      return matchesSearch && matchesCategory && matchesDateStart && matchesDateEnd && matchesAmountMin && matchesAmountMax
    })
  }, [data, searchQuery, selectedCategory, dateRange, amountRange])

  useEffect(() => {
    onFilterChange?.(filteredTransactions)
  }, [filteredTransactions, onFilterChange])

  const handleReset = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setDateRange({ start: '', end: '' })
    setAmountRange({ min: '', max: '' })
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search transactions by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Advanced Filters Toggle */}
      <Button
        variant="outline"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center gap-2"
      >
        <Filter className="w-4 h-4" />
        {showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
      </Button>

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card className="p-4 bg-muted space-y-4">
          {/* Category Filter */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> From
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> To
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm"
              />
            </div>
          </div>

          {/* Amount Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Min Amount
              </label>
              <Input
                type="number"
                placeholder="0"
                value={amountRange.min}
                onChange={(e) => setAmountRange({ ...amountRange, min: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Max Amount
              </label>
              <Input
                type="number"
                placeholder="0"
                value={amountRange.max}
                onChange={(e) => setAmountRange({ ...amountRange, max: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={handleReset}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Reset Filters
          </Button>
        </Card>
      )}

      {/* Results */}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Found {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
        </h3>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map(transaction => (
              <Card key={transaction.id} className="p-3 flex items-center justify-between bg-card hover:bg-muted transition-colors">
                <div>
                  <div className="font-medium text-foreground text-sm">{transaction.description}</div>
                  <div className="text-xs text-muted-foreground">{transaction.category} • {new Date(transaction.date).toLocaleDateString()}</div>
                </div>
                <div className={`font-medium text-sm ${transaction.type === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                  {transaction.type === 'debit' ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-4 bg-muted text-center text-muted-foreground">
              No transactions match your filters
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
