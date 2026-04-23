'use client'

import React from "react"

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface RealtimeData {
  accounts: Record<string, any>
  transactions: Record<string, any>
  balances: Record<string, number>
  transfers: Record<string, any>
}

interface RealtimeContextType {
  data: RealtimeData
  isConnected: boolean
  isLoading: boolean
  updateBalance: (accountId: string, amount: number) => Promise<void>
  updateTransaction: (transaction: any) => Promise<void>
  subscribeToUpdates: (userId: string) => void
  unsubscribeFromUpdates: () => void
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<RealtimeData>({
    accounts: {},
    transactions: {},
    balances: {},
    transfers: {},
  })
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map())
  const supabaseRef = useRef(createClient())

  const subscribeToUpdates = useCallback((userId: string) => {
    const supabase = supabaseRef.current
    if (!supabase) return

    setIsLoading(true)

    // Subscribe to accounts changes
    const accountsChannel = supabase
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
          setData((prev) => ({
            ...prev,
            accounts: {
              ...prev.accounts,
              [payload.new?.id || payload.old?.id]: payload.new || payload.old,
            },
          }))
        }
      )
      .subscribe()

    // Subscribe to transactions changes
    const transactionsChannel = supabase
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
          setData((prev) => ({
            ...prev,
            transactions: {
              ...prev.transactions,
              [payload.new?.id || payload.old?.id]: payload.new || payload.old,
            },
          }))
        }
      )
      .subscribe()

    // Subscribe to transfers changes
    const transfersChannel = supabase
      .channel(`transfers:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transfers',
          filter: `from_account_id=eq.${userId},to_account_id=eq.${userId}`,
        },
        (payload) => {
          setData((prev) => ({
            ...prev,
            transfers: {
              ...prev.transfers,
              [payload.new?.id || payload.old?.id]: payload.new || payload.old,
            },
          }))
        }
      )
      .subscribe()

    channelsRef.current.set('accounts', accountsChannel)
    channelsRef.current.set('transactions', transactionsChannel)
    channelsRef.current.set('transfers', transfersChannel)

    setIsConnected(true)
    setIsLoading(false)
  }, [])

  const unsubscribeFromUpdates = useCallback(() => {
    channelsRef.current.forEach((channel) => {
      if (channel) {
        supabaseRef.current?.removeChannel(channel)
      }
    })
    channelsRef.current.clear()
    setIsConnected(false)
  }, [])

  const updateBalance = useCallback(
    async (accountId: string, amount: number) => {
      const supabase = supabaseRef.current
      if (!supabase) return

      const { error } = await supabase
        .from('accounts')
        .update({ balance: amount })
        .eq('id', accountId)

      if (error) console.error('Error updating balance:', error)
    },
    []
  )

  const updateTransaction = useCallback(
    async (transaction: any) => {
      const supabase = supabaseRef.current
      if (!supabase) return

      const { error } = await supabase.from('transactions').insert([transaction])

      if (error) console.error('Error updating transaction:', error)
    },
    []
  )

  return (
    <RealtimeContext.Provider
      value={{
        data,
        isConnected,
        isLoading,
        updateBalance,
        updateTransaction,
        subscribeToUpdates,
        unsubscribeFromUpdates,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}
