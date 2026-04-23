/**
 * Real-time Financial Data Hub
 * Syncs accounts, transactions, and notifications in real-time
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Transaction {
  id: string
  accountId: string
  description: string
  amount: number
  type: 'credit' | 'debit'
  category: string
  status: 'completed' | 'pending' | 'failed'
  createdAt: string
}

export interface Account {
  id: string
  name: string
  type: string
  balance: number
  availableBalance: number
  accountNumber: string
  routingNumber: string
}

export interface FinancialUpdate {
  type: 'transaction' | 'balance' | 'notification'
  data: Transaction | Account | any
  timestamp: string
}

export class RealTimeFinancialHub {
  private supabase: any
  private userId: string
  private channel: RealtimeChannel | null = null
  private listeners: ((update: FinancialUpdate) => void)[] = []
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor(supabase: any, userId: string) {
    this.supabase = supabase
    this.userId = userId
  }

  /**
   * Start real-time sync
   */
  async start() {
    try {
      console.log('[v0] Starting real-time financial hub for user:', this.userId)

      // Subscribe to transactions
      this.channel = this.supabase
        .channel(`fintech:${this.userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${this.userId}`,
          },
          (payload: any) => {
            console.log('[v0] New transaction:', payload.new)
            this.notifyListeners({
              type: 'transaction',
              data: payload.new,
              timestamp: new Date().toISOString(),
            })
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'accounts',
            filter: `user_id=eq.${this.userId}`,
          },
          (payload: any) => {
            console.log('[v0] Account balance updated:', payload.new)
            this.notifyListeners({
              type: 'balance',
              data: payload.new,
              timestamp: new Date().toISOString(),
            })
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${this.userId}`,
          },
          (payload: any) => {
            console.log('[v0] New notification:', payload.new)
            this.notifyListeners({
              type: 'notification',
              data: payload.new,
              timestamp: new Date().toISOString(),
            })
          }
        )
        .subscribe((status: string) => {
          console.log('[v0] Channel status:', status)
          if (status === 'SUBSCRIBED') {
            this.reconnectAttempts = 0
            console.log('[v0] Real-time sync connected successfully')
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            this.handleReconnect()
          }
        })
    } catch (error) {
      console.error('[v0] Real-time hub error:', error)
      this.handleReconnect()
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      console.log(
        `[v0] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      )
      setTimeout(() => this.start(), delay)
    } else {
      console.error('[v0] Max reconnection attempts reached')
    }
  }

  /**
   * Subscribe to updates
   */
  subscribe(callback: (update: FinancialUpdate) => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback)
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(update: FinancialUpdate) {
    this.listeners.forEach((listener) => listener(update))
  }

  /**
   * Stop real-time sync
   */
  stop() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel)
      this.channel = null
      console.log('[v0] Real-time sync stopped')
    }
  }
}

/**
 * React hook for real-time financial data
 */
export function useRealTimeFinancial(supabase: any, userId: string) {
  const [updates, setUpdates] = useState<FinancialUpdate[]>([])
  const hubRef = useRef<RealTimeFinancialHub | null>(null)

  useEffect(() => {
    if (!userId || !supabase) return

    // Create and start hub
    hubRef.current = new RealTimeFinancialHub(supabase, userId)
    hubRef.current.start()

    // Subscribe to updates
    const unsubscribe = hubRef.current.subscribe((update) => {
      setUpdates((prev) => [update, ...prev].slice(0, 50)) // Keep last 50 updates
    })

    return () => {
      unsubscribe()
      hubRef.current?.stop()
    }
  }, [userId, supabase])

  return {
    updates,
    hub: hubRef.current,
  }
}
