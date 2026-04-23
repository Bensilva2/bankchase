/**
 * Real-time Account Management Hook
 * Manages accounts with live balance updates and synchronization
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRealTimeFinancial, type Account } from '@/lib/real-time-financial-hub'

export interface AccountWithBalance extends Account {
  lastUpdated: string
  syncStatus: 'syncing' | 'synced' | 'error'
}

export function useAccountManagement(supabase: any, userId: string) {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { updates } = useRealTimeFinancial(supabase, userId)

  // Fetch accounts on mount
  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/accounts', {
        headers: {
          'x-user-id': userId,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch accounts')

      const data = await response.json()
      const accountsWithStatus = (data.accounts || []).map((account: Account) => ({
        ...account,
        lastUpdated: new Date().toISOString(),
        syncStatus: 'synced' as const,
      }))

      setAccounts(accountsWithStatus)
      setError(null)
    } catch (err) {
      console.error('[v0] Account fetch error:', err)
      setError('Failed to load accounts')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Listen for real-time balance updates
  useEffect(() => {
    updates.forEach((update) => {
      if (update.type === 'balance') {
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === update.data.id
              ? {
                  ...acc,
                  balance: update.data.balance,
                  availableBalance: update.data.available_balance,
                  lastUpdated: update.timestamp,
                  syncStatus: 'synced',
                }
              : acc
          )
        )
      }
    })
  }, [updates])

  // Initial fetch
  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const createAccount = useCallback(
    async (name: string, type: string, accountNumber: string, routingNumber: string) => {
      try {
        const response = await fetch('/api/accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({
            name,
            type,
            accountNumber,
            routingNumber,
          }),
        })

        if (!response.ok) throw new Error('Failed to create account')

        const data = await response.json()

        const newAccount: AccountWithBalance = {
          ...data.account,
          lastUpdated: new Date().toISOString(),
          syncStatus: 'synced',
        }

        setAccounts((prev) => [...prev, newAccount])
        return newAccount
      } catch (err) {
        console.error('[v0] Account creation error:', err)
        throw err
      }
    },
    [userId]
  )

  const updateAccount = useCallback(async (accountId: string, updates: Partial<Account>) => {
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error('Failed to update account')

      const data = await response.json()

      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId
            ? {
                ...acc,
                ...data.account,
                lastUpdated: new Date().toISOString(),
                syncStatus: 'synced',
              }
            : acc
        )
      )
    } catch (err) {
      console.error('[v0] Account update error:', err)
      throw err
    }
  }, [userId])

  const deleteAccount = useCallback(
    async (accountId: string) => {
      try {
        const response = await fetch(`/api/accounts/${accountId}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': userId,
          },
        })

        if (!response.ok) throw new Error('Failed to delete account')

        setAccounts((prev) => prev.filter((acc) => acc.id !== accountId))
      } catch (err) {
        console.error('[v0] Account deletion error:', err)
        throw err
      }
    },
    [userId]
  )

  const getTotalBalance = useCallback(() => {
    return accounts.reduce((sum, account) => sum + (account.balance || 0), 0)
  }, [accounts])

  return {
    accounts,
    isLoading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    getTotalBalance,
    refetch: fetchAccounts,
  }
}
