/**
 * Real-time Transaction History Hook
 * Manages transaction data with live updates from Supabase
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRealTimeFinancial } from '@/lib/real-time-financial-hub'

export interface Transaction {
  id: string
  accountId: string
  description: string
  amount: number
  type: 'credit' | 'debit'
  category: string
  status: 'completed' | 'pending' | 'failed'
  createdAt: string
  reference?: string
  fee?: number
  recipientName?: string
}

export function useTransactionHistory(supabase: any, userId: string, accountId?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { updates } = useRealTimeFinancial(supabase, userId)

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true)
      const url = new URL('/api/transactions', window.location.origin)
      if (accountId) {
        url.searchParams.append('accountId', accountId)
      }

      const response = await fetch(url, {
        headers: {
          'x-user-id': userId,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch transactions')

      const data = await response.json()
      setTransactions(data.transactions || [])
      setError(null)
    } catch (err) {
      console.error('[v0] Transaction fetch error:', err)
      setError('Failed to load transactions')
    } finally {
      setIsLoading(false)
    }
  }, [userId, accountId])

  // Listen for new transactions
  useEffect(() => {
    updates.forEach((update) => {
      if (update.type === 'transaction') {
        // Add new transaction to the beginning
        setTransactions((prev) => [update.data, ...prev])
      }
    })
  }, [updates])

  // Initial fetch
  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Filter and sort transactions
  const getFilteredTransactions = useCallback(
    (filter: {
      category?: string
      type?: 'credit' | 'debit'
      status?: 'completed' | 'pending' | 'failed'
      startDate?: Date
      endDate?: Date
    }) => {
      return transactions.filter((tx) => {
        if (filter.category && tx.category !== filter.category) return false
        if (filter.type && tx.type !== filter.type) return false
        if (filter.status && tx.status !== filter.status) return false

        const txDate = new Date(tx.createdAt)
        if (filter.startDate && txDate < filter.startDate) return false
        if (filter.endDate && txDate > filter.endDate) return false

        return true
      })
    },
    [transactions]
  )

  // Calculate spending by category
  const getSpendingByCategory = useCallback(() => {
    const spending: Record<string, number> = {}

    transactions.forEach((tx) => {
      if (tx.type === 'debit') {
        spending[tx.category] = (spending[tx.category] || 0) + tx.amount
      }
    })

    return Object.entries(spending)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [transactions])

  // Calculate monthly totals
  const getMonthlySummary = useCallback(() => {
    const months: Record<string, { credit: number; debit: number }> = {}

    transactions.forEach((tx) => {
      const date = new Date(tx.createdAt)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!months[month]) {
        months[month] = { credit: 0, debit: 0 }
      }

      if (tx.type === 'credit') {
        months[month].credit += tx.amount
      } else {
        months[month].debit += tx.amount
      }
    })

    return months
  }, [transactions])

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
    getFilteredTransactions,
    getSpendingByCategory,
    getMonthlySummary,
  }
}
