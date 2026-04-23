/**
 * Real-time synchronization service for cross-device 2FA persistence
 * Syncs profile, 2FA settings, and backup codes across devices
 */

import { getDeviceId } from '@/lib/auth/profile-service'

interface SyncConfig {
  email: string
  syncInterval?: number // ms between syncs (default 30 seconds)
  retryCount?: number
  retryDelay?: number
}

export class RealtimeSyncService {
  private email: string
  private deviceId: string
  private syncInterval: number
  private retryCount: number
  private retryDelay: number
  private lastSyncTime: number = 0
  private syncTimer: NodeJS.Timeout | null = null
  private isSyncing: boolean = false
  private callbacks: Set<(data: any) => void> = new Set()

  constructor(config: SyncConfig) {
    this.email = config.email
    this.deviceId = getDeviceId()
    this.syncInterval = config.syncInterval || 30000 // 30 seconds default
    this.retryCount = config.retryCount || 3
    this.retryDelay = config.retryDelay || 1000
  }

  /**
   * Start automatic sync
   */
  public start(): void {
    if (typeof window === 'undefined') return

    console.log('[v0] Starting real-time sync service for:', this.email)

    // Initial sync
    this.performSync()

    // Set up interval sync
    this.syncTimer = setInterval(() => {
      this.performSync()
    }, this.syncInterval)

    // Listen for visibility changes to sync when tab becomes active
    window.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('[v0] Tab became visible, syncing...')
        this.performSync()
      }
    })

    // Listen for online/offline changes
    window.addEventListener('online', () => {
      console.log('[v0] Connection restored, syncing...')
      this.performSync()
    })
  }

  /**
   * Stop automatic sync
   */
  public stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
    console.log('[v0] Stopped real-time sync service')
  }

  /**
   * Perform sync with retry logic
   */
  private async performSync(retryAttempt: number = 0): Promise<void> {
    if (this.isSyncing) {
      console.log('[v0] Sync already in progress, skipping...')
      return
    }

    if (!navigator.onLine) {
      console.log('[v0] No internet connection, skipping sync')
      return
    }

    this.isSyncing = true

    try {
      const timestamp = this.lastSyncTime
      const response = await fetch(
        `/api/auth/2fa/sync?email=${encodeURIComponent(this.email)}&deviceId=${this.deviceId}&timestamp=${timestamp}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!response.ok) {
        throw new Error(`Sync failed with status ${response.status}`)
      }

      const data = await response.json()

      if (data.hasUpdates) {
        console.log('[v0] Sync found updates:', data.sync)
        this.lastSyncTime = Date.now()

        // Notify all listeners
        this.callbacks.forEach(callback => {
          try {
            callback(data.sync)
          } catch (error) {
            console.error('[v0] Callback error:', error)
          }
        })

        // Emit custom event for cross-tab communication
        window.dispatchEvent(
          new CustomEvent('2fa-sync', {
            detail: {
              deviceId: this.deviceId,
              sync: data.sync,
              timestamp: this.lastSyncTime,
            },
          })
        )
      }
    } catch (error) {
      console.error('[v0] Sync error:', error)

      // Retry with exponential backoff
      if (retryAttempt < this.retryCount) {
        const delayMs = this.retryDelay * Math.pow(2, retryAttempt)
        console.log(`[v0] Retrying sync in ${delayMs}ms (attempt ${retryAttempt + 1})`)
        setTimeout(() => this.performSync(retryAttempt + 1), delayMs)
      }
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Register callback for sync updates
   */
  public onSync(callback: (data: any) => void): () => void {
    this.callbacks.add(callback)

    return () => {
      this.callbacks.delete(callback)
    }
  }

  /**
   * Force immediate sync
   */
  public async forceSyncNow(): Promise<void> {
    console.log('[v0] Forcing immediate sync')
    await this.performSync()
  }

  /**
   * Get current sync status
   */
  public getStatus(): {
    isSyncing: boolean
    lastSyncTime: number
    email: string
    deviceId: string
  } {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      email: this.email,
      deviceId: this.deviceId,
    }
  }
}

// Singleton instance per email
const syncInstances = new Map<string, RealtimeSyncService>()

/**
 * Get or create sync service for email
 */
export function getSyncService(email: string, config?: Partial<SyncConfig>): RealtimeSyncService {
  if (!syncInstances.has(email)) {
    const service = new RealtimeSyncService({
      email,
      ...config,
    })
    syncInstances.set(email, service)
  }
  return syncInstances.get(email)!
}

/**
 * Listen for 2FA sync events across tabs
 */
export function on2FASync(callback: (event: CustomEvent) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleEvent = callback as EventListener
  window.addEventListener('2fa-sync', handleEvent)

  return () => {
    window.removeEventListener('2fa-sync', handleEvent)
  }
}
