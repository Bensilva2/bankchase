'use client'

import { createClient } from '@supabase/supabase-js'
import type { RealtimeChannel } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * Real-Time Orchestrator
 * Coordinates real-time updates across all banking operations
 * Ensures instant synchronization of balances, transactions, bills, and notifications
 */

export class RealtimeOrchestrator {
  private supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  private channels: Map<string, RealtimeChannel> = new Map()
  private listeners: Map<string, Function[]> = new Map()
  private userId: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  constructor() {
    this.setupChannels()
  }

  /**
   * Initialize real-time subscriptions for a user
   */
  async initialize(userId: string) {
    this.userId = userId
    console.log('[v0] RealtimeOrchestrator initialized for user:', userId)
    
    try {
      // Subscribe to account balance changes
      this.subscribeToAccountBalances()
      
      // Subscribe to transactions
      this.subscribeToTransactions()
      
      // Subscribe to bills
      this.subscribeToBills()
      
      // Subscribe to notifications
      this.subscribeToNotifications()
      
      // Setup connection monitoring
      this.setupConnectionMonitoring()
    } catch (error) {
      console.error('[v0] Failed to initialize real-time:', error)
      this.attemptReconnect()
    }
  }

  /**
   * Subscribe to account balance changes
   */
  private subscribeToAccountBalances() {
    if (!this.userId) return

    const channel = this.supabase
      .channel(`accounts:${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accounts',
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => {
          console.log('[v0] Account balance update:', payload)
          this.notifyListeners('balance', payload.new)
        }
      )
      .subscribe()

    this.channels.set(`accounts:${this.userId}`, channel)
  }

  /**
   * Subscribe to transaction changes
   */
  private subscribeToTransactions() {
    if (!this.userId) return

    const channel = this.supabase
      .channel(`transactions:${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => {
          console.log('[v0] New transaction:', payload)
          this.notifyListeners('transaction', payload.new)
        }
      )
      .subscribe()

    this.channels.set(`transactions:${this.userId}`, channel)
  }

  /**
   * Subscribe to bill changes
   */
  private subscribeToBills() {
    if (!this.userId) return

    const channel = this.supabase
      .channel(`bills:${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bills',
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => {
          console.log('[v0] Bill update:', payload)
          this.notifyListeners('bill', payload.new)
        }
      )
      .subscribe()

    this.channels.set(`bills:${this.userId}`, channel)
  }

  /**
   * Subscribe to notification changes
   */
  private subscribeToNotifications() {
    if (!this.userId) return

    const channel = this.supabase
      .channel(`notifications:${this.userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => {
          console.log('[v0] New notification:', payload)
          this.notifyListeners('notification', payload.new)
        }
      )
      .subscribe()

    this.channels.set(`notifications:${this.userId}`, channel)
  }

  /**
   * Setup connection monitoring
   */
  private setupConnectionMonitoring() {
    // Monitor connection status
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        this.cleanup()
      }
    })
  }

  /**
   * Register a listener for real-time events
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)?.push(callback)

    return () => {
      const callbacks = this.listeners.get(event)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  /**
   * Notify all listeners of an event
   */
  private notifyListeners(event: string, data: any) {
    const callbacks = this.listeners.get(event) || []
    callbacks.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`[v0] Error in ${event} listener:`, error)
      }
    })
  }

  /**
   * Attempt to reconnect on failure
   */
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.pow(2, this.reconnectAttempts) * 1000 // Exponential backoff
      console.log(`[v0] Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)
      
      setTimeout(() => {
        if (this.userId) {
          this.initialize(this.userId)
        }
      }, delay)
    }
  }

  /**
   * Cleanup all channels
   */
  cleanup() {
    console.log('[v0] Cleaning up real-time subscriptions')
    this.channels.forEach((channel) => {
      this.supabase.removeChannel(channel)
    })
    this.channels.clear()
    this.listeners.clear()
    this.reconnectAttempts = 0
  }

  /**
   * Manually trigger a data refresh
   */
  async refresh() {
    console.log('[v0] Triggering manual refresh')
    this.notifyListeners('refresh', { timestamp: new Date().toISOString() })
  }

  /**
   * Setup channels placeholder
   */
  private setupChannels() {
    // Channels are set up dynamically in initialize()
  }
}

// Export singleton instance
let instance: RealtimeOrchestrator | null = null

export function getRealtimeOrchestrator(): RealtimeOrchestrator {
  if (!instance) {
    instance = new RealtimeOrchestrator()
  }
  return instance
}
