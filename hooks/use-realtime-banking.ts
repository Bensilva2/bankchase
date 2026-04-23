'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface RealtimeAccount {
  id: string
  account_number: string
  balance: number
  available_balance: number
  account_type: 'checking' | 'savings' | 'money_market'
  status: 'active' | 'closed' | 'suspended'
  last_updated: string
}

export interface RealtimeTransaction {
  id: string
  amount: number
  type: string
  status: 'pending' | 'completed' | 'failed'
  description: string
  transaction_date: string
  recipient_name?: string
}

export interface RealtimeBill {
  id: string
  payee_name: string
  amount: number
  due_date: string
  status: 'pending' | 'scheduled' | 'paid' | 'failed'
  frequency: string
}

export interface RealtimeNotification {
  id: string
  type: 'transaction' | 'security' | 'bill' | 'promotion' | 'account'
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export function useRealTimeBanking(userId: string | null) {
  const [accounts, setAccounts] = useState<RealtimeAccount[]>([])
  const [transactions, setTransactions] = useState<RealtimeTransaction[]>([])
  const [bills, setBills] = useState<RealtimeBill[]>([])
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const supabase = createClient()

  // Subscribe to account changes
  const subscribeToAccounts = useCallback(() => {
    if (!userId) return

    console.log('[v0] Subscribing to real-time account updates for user:', userId)

    const accountsSubscription = supabase
      .channel(`accounts:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accounts',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[v0] Account update received:', payload)
          setAccounts((prev) => {
            const updated = [...prev]
            const index = updated.findIndex((a) => a.id === payload.new.id)
            if (index >= 0) {
              updated[index] = payload.new as RealtimeAccount
            } else if (payload.eventType === 'INSERT') {
              updated.push(payload.new as RealtimeAccount)
            }
            return updated
          })
        }
      )
      .subscribe()

    return () => {
      accountsSubscription.unsubscribe()
    }
  }, [userId, supabase])

  // Subscribe to transaction changes
  const subscribeToTransactions = useCallback(() => {
    if (!userId) return

    console.log('[v0] Subscribing to real-time transaction updates for user:', userId)

    const transactionsSubscription = supabase
      .channel(`transactions:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[v0] Transaction update received:', payload)
          setTransactions((prev) => {
            const updated = [...prev]
            const index = updated.findIndex((t) => t.id === payload.new.id)
            if (index >= 0) {
              updated[index] = payload.new as RealtimeTransaction
            } else if (payload.eventType === 'INSERT') {
              updated.unshift(payload.new as RealtimeTransaction)
            }
            return updated.slice(0, 50) // Keep last 50 transactions
          })
        }
      )
      .subscribe()

    return () => {
      transactionsSubscription.unsubscribe()
    }
  }, [userId, supabase])

  // Subscribe to bill changes
  const subscribeToBills = useCallback(() => {
    if (!userId) return

    console.log('[v0] Subscribing to real-time bill updates for user:', userId)

    const billsSubscription = supabase
      .channel(`bills:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bills',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[v0] Bill update received:', payload)
          setBills((prev) => {
            const updated = [...prev]
            const index = updated.findIndex((b) => b.id === payload.new.id)
            if (index >= 0) {
              updated[index] = payload.new as RealtimeBill
            } else if (payload.eventType === 'INSERT') {
              updated.push(payload.new as RealtimeBill)
            }
            return updated
          })
        }
      )
      .subscribe()

    return () => {
      billsSubscription.unsubscribe()
    }
  }, [userId, supabase])

  // Subscribe to notification changes
  const subscribeToNotifications = useCallback(() => {
    if (!userId) return

    console.log('[v0] Subscribing to real-time notification updates for user:', userId)

    const notificationsSubscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[v0] Notification received:', payload)
          setNotifications((prev) => {
            const updated = [...prev]
            const index = updated.findIndex((n) => n.id === payload.new.id)
            if (index >= 0) {
              updated[index] = payload.new as RealtimeNotification
            } else if (payload.eventType === 'INSERT') {
              updated.unshift(payload.new as RealtimeNotification)
            }
            return updated.slice(0, 100) // Keep last 100 notifications
          })
        }
      )
      .subscribe()

    return () => {
      notificationsSubscription.unsubscribe()
    }
  }, [userId, supabase])

  // Fetch initial data and setup subscriptions
  useEffect(() => {
    if (!userId) return

    const setupRealTime = async () => {
      try {
        // Fetch initial accounts
        const { data: accountsData } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', userId)

        if (accountsData) {
          setAccounts(accountsData as RealtimeAccount[])
        }

        // Fetch initial transactions
        const { data: transactionsData } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('transaction_date', { ascending: false })
          .limit(50)

        if (transactionsData) {
          setTransactions(transactionsData as RealtimeTransaction[])
        }

        // Fetch initial bills
        const { data: billsData } = await supabase
          .from('bills')
          .select('*')
          .eq('user_id', userId)

        if (billsData) {
          setBills(billsData as RealtimeBill[])
        }

        // Fetch initial notifications
        const { data: notificationsData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100)

        if (notificationsData) {
          setNotifications(notificationsData as RealtimeNotification[])
        }

        setIsConnected(true)
        setLastSync(new Date())
        console.log('[v0] Real-time banking initialized')

        // Subscribe to all updates
        const unsubscribeAccounts = subscribeToAccounts()
        const unsubscribeTransactions = subscribeToTransactions()
        const unsubscribeBills = subscribeToBills()
        const unsubscribeNotifications = subscribeToNotifications()

        return () => {
          unsubscribeAccounts?.()
          unsubscribeTransactions?.()
          unsubscribeBills?.()
          unsubscribeNotifications?.()
        }
      } catch (error) {
        console.error('[v0] Real-time setup error:', error)
        setIsConnected(false)
      }
    }

    const cleanup = setupRealTime()
    return () => {
      cleanup?.then((fn) => fn?.())
    }
  }, [userId, subscribeToAccounts, subscribeToTransactions, subscribeToBills, subscribeToNotifications])

  return {
    accounts,
    transactions,
    bills,
    notifications,
    isConnected,
    lastSync,
  }
}
