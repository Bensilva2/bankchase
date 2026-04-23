'use client'

/**
 * Cross-Tab State Synchronization Service
 * Keeps banking data synchronized across multiple browser tabs
 * Ensures consistency for accounts, balances, transactions, and notifications
 */

export class CrossTabSync {
  private channels: Map<string, BroadcastChannel> = new Map()
  private listeners: Map<string, Set<Function>> = new Map()
  private syncQueue: any[] = []
  private isSyncing = false

  constructor() {
    this.initializeChannels()
  }

  /**
   * Initialize broadcast channels
   */
  private initializeChannels() {
    const channels = ['accounts', 'transactions', 'balances', 'notifications', 'settings', 'general']

    channels.forEach(channel => {
      try {
        const bc = new BroadcastChannel(`chase-${channel}`)

        bc.onmessage = (event) => {
          console.log(`[v0] Cross-tab message on ${channel}:`, event.data)
          this.handleMessage(channel, event.data)
        }

        this.channels.set(channel, bc)
      } catch (error) {
        console.warn(`[v0] BroadcastChannel for ${channel} not supported:`, error)
      }
    })
  }

  /**
   * Register a listener for cross-tab updates
   */
  on(channel: string, callback: Function): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set())
    }

    this.listeners.get(channel)!.add(callback)

    return () => {
      this.listeners.get(channel)?.delete(callback)
    }
  }

  /**
   * Broadcast a message to other tabs
   */
  async broadcast(channel: string, data: any) {
    const bc = this.channels.get(channel)
    if (!bc) {
      console.warn(`[v0] Broadcast channel not found: ${channel}`)
      return
    }

    try {
      const message = {
        type: 'sync',
        channel,
        data,
        timestamp: Date.now(),
        source: typeof window !== 'undefined' ? window.location.href : 'unknown',
      }

      console.log(`[v0] Broadcasting to ${channel}:`, message)
      bc.postMessage(message)
    } catch (error) {
      console.error(`[v0] Broadcast error on ${channel}:`, error)
    }
  }

  /**
   * Handle incoming cross-tab messages
   */
  private handleMessage(channel: string, message: any) {
    if (message.type !== 'sync') return

    console.log(`[v0] Processing sync message on ${channel}:`, message.data)

    // Notify all listeners for this channel
    const listeners = this.listeners.get(channel)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(message.data, message.timestamp)
        } catch (error) {
          console.error(`[v0] Listener error on ${channel}:`, error)
        }
      })
    }

    // Store in queue for processing
    this.syncQueue.push({ channel, ...message })
    this.processSyncQueue()
  }

  /**
   * Process sync queue with debouncing
   */
  private async processSyncQueue() {
    if (this.isSyncing || this.syncQueue.length === 0) return

    this.isSyncing = true

    const batch = [...this.syncQueue]
    this.syncQueue = []

    console.log(`[v0] Processing ${batch.length} sync messages`)

    for (const message of batch) {
      try {
        await this.handleSyncMessage(message)
      } catch (error) {
        console.error('[v0] Error handling sync message:', error)
      }
    }

    this.isSyncing = false

    // Process remaining queue if new messages arrived
    if (this.syncQueue.length > 0) {
      this.processSyncQueue()
    }
  }

  /**
   * Process individual sync message
   */
  private async handleSyncMessage(message: any) {
    const { channel, data } = message

    switch (channel) {
      case 'balances':
        // Trigger balance refresh in context
        console.log('[v0] Balance update from other tab:', data)
        break

      case 'transactions':
        // Add new transactions
        console.log('[v0] Transaction update from other tab:', data)
        break

      case 'accounts':
        // Update account list
        console.log('[v0] Account update from other tab:', data)
        break

      case 'settings':
        // Update settings
        console.log('[v0] Settings update from other tab:', data)
        break

      default:
        console.log('[v0] Generic sync update:', data)
    }
  }

  /**
   * Sync account balances across tabs
   */
  syncBalances(accountData: any) {
    this.broadcast('balances', {
      type: 'update',
      accounts: accountData,
      timestamp: Date.now(),
    })
  }

  /**
   * Sync new transaction across tabs
   */
  syncTransaction(transaction: any) {
    this.broadcast('transactions', {
      type: 'new',
      transaction,
      timestamp: Date.now(),
    })
  }

  /**
   * Sync account creation across tabs
   */
  syncAccountCreation(account: any) {
    this.broadcast('accounts', {
      type: 'created',
      account,
      timestamp: Date.now(),
    })
  }

  /**
   * Sync settings changes across tabs
   */
  syncSettings(settings: any) {
    this.broadcast('settings', {
      type: 'update',
      settings,
      timestamp: Date.now(),
    })
  }

  /**
   * Sync notification across tabs
   */
  syncNotification(notification: any) {
    this.broadcast('notifications', {
      type: 'new',
      notification,
      timestamp: Date.now(),
    })
  }

  /**
   * Close all channels (cleanup)
   */
  cleanup() {
    console.log('[v0] Cleaning up cross-tab sync channels')
    this.channels.forEach(channel => channel.close())
    this.channels.clear()
    this.listeners.clear()
    this.syncQueue = []
  }
}

// Export singleton
let instance: CrossTabSync | null = null

export function getCrossTabSync(): CrossTabSync {
  if (!instance && typeof window !== 'undefined') {
    instance = new CrossTabSync()
  }
  return instance || new CrossTabSync()
}

/**
 * Hook for using cross-tab sync in components
 */
export function useCrossTabSync() {
  const crossTab = getCrossTabSync()

  return {
    broadcast: crossTab.broadcast.bind(crossTab),
    on: crossTab.on.bind(crossTab),
    syncBalances: crossTab.syncBalances.bind(crossTab),
    syncTransaction: crossTab.syncTransaction.bind(crossTab),
    syncAccountCreation: crossTab.syncAccountCreation.bind(crossTab),
    syncSettings: crossTab.syncSettings.bind(crossTab),
    syncNotification: crossTab.syncNotification.bind(crossTab),
  }
}
