// Real-Time Sync Coordinator - Keeps all options synchronized

interface SyncMessage {
  type: 'update' | 'refresh' | 'delete' | 'create'
  key: string
  data?: any
  timestamp: number
}

interface SyncSubscriber {
  id: string
  callback: (message: SyncMessage) => void
}

export class RealtimeSyncCoordinator {
  private static instance: RealtimeSyncCoordinator
  private subscribers = new Map<string, Set<SyncSubscriber>>()
  private lastSync = new Map<string, number>()
  private messageQueue: SyncMessage[] = []
  private isSyncing = false

  private constructor() {
    this.startSyncLoop()
  }

  static getInstance(): RealtimeSyncCoordinator {
    if (!RealtimeSyncCoordinator.instance) {
      RealtimeSyncCoordinator.instance = new RealtimeSyncCoordinator()
    }
    return RealtimeSyncCoordinator.instance
  }

  /**
   * Subscribe to sync updates for a specific key
   */
  subscribe(key: string, callback: (message: SyncMessage) => void): string {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set())
    }

    const id = `${key}-${Date.now()}-${Math.random()}`
    this.subscribers.get(key)!.add({ id, callback })

    return id
  }

  /**
   * Unsubscribe from sync updates
   */
  unsubscribe(key: string, subscriberId: string) {
    const subscribers = this.subscribers.get(key)
    if (subscribers) {
      subscribers.forEach((sub) => {
        if (sub.id === subscriberId) {
          subscribers.delete(sub)
        }
      })
    }
  }

  /**
   * Publish a sync message
   */
  async publish(message: SyncMessage) {
    this.messageQueue.push({
      ...message,
      timestamp: Date.now(),
    })

    // Process immediately if not already syncing
    if (!this.isSyncing) {
      await this.processSyncQueue()
    }
  }

  /**
   * Process sync queue
   */
  private async processSyncQueue() {
    this.isSyncing = true

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!

      // Update last sync time
      this.lastSync.set(message.key, message.timestamp)

      // Notify subscribers
      const subscribers = this.subscribers.get(message.key)
      if (subscribers) {
        for (const subscriber of subscribers) {
          try {
            subscriber.callback(message)
          } catch (error) {
            console.error('[RealtimeSyncCoordinator] Error in callback:', error)
          }
        }
      }

      // Add small delay to prevent overwhelming the UI
      await new Promise((resolve) => setTimeout(resolve, 16)) // ~60fps
    }

    this.isSyncing = false
  }

  /**
   * Start background sync loop (checks every 2 seconds)
   */
  private startSyncLoop() {
    setInterval(async () => {
      // Auto-publish refresh messages for monitored keys
      const keysToRefresh = Array.from(this.subscribers.keys())

      for (const key of keysToRefresh) {
        const lastSync = this.lastSync.get(key) || 0
        const timeSinceLastSync = Date.now() - lastSync

        // Refresh if more than 5 seconds has passed
        if (timeSinceLastSync > 5000) {
          await this.publish({
            type: 'refresh',
            key,
            timestamp: Date.now(),
          })
        }
      }
    }, 2000)
  }

  /**
   * Force sync for a specific key
   */
  async forceSync(key: string, data?: any) {
    await this.publish({
      type: 'update',
      key,
      data,
      timestamp: Date.now(),
    })
  }

  /**
   * Batch publish multiple messages
   */
  async publishBatch(messages: SyncMessage[]) {
    for (const message of messages) {
      this.messageQueue.push({
        ...message,
        timestamp: Date.now(),
      })
    }

    if (!this.isSyncing) {
      await this.processSyncQueue()
    }
  }

  /**
   * Get last sync time for a key
   */
  getLastSyncTime(key: string): number {
    return this.lastSync.get(key) || 0
  }

  /**
   * Check if sync is in progress
   */
  isSyncInProgress(): boolean {
    return this.isSyncing || this.messageQueue.length > 0
  }

  /**
   * Clear all subscriptions and queue
   */
  clear() {
    this.subscribers.clear()
    this.messageQueue = []
    this.lastSync.clear()
  }
}

export const realtimeSyncCoordinator = RealtimeSyncCoordinator.getInstance()
