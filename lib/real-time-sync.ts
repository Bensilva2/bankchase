// Real-time synchronization service for Chase Banking App
// Handles cross-component state updates and real-time data flow

type SyncEventType = 'update' | 'delete' | 'create' | 'sync'

interface SyncEvent {
  type: SyncEventType
  key: string
  data: any
  timestamp: number
  sourceTabId: string
}

export class RealTimeSync {
  private syncInterval: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private listeners: Map<string, Set<(data: any) => void>> = new Map()
  private eventListeners: Map<string, Set<(event: SyncEvent) => void>> = new Map()
  private tabId: string
  private lastSyncTimestamps: Map<string, number> = new Map()
  private isOnline: boolean = true
  private pendingUpdates: SyncEvent[] = []
  private broadcastChannel: BroadcastChannel | null = null

  constructor() {
    this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.initializeSync()
  }

  private initializeSync() {
    if (typeof window === "undefined") return

    // Use BroadcastChannel for efficient cross-tab communication
    try {
      this.broadcastChannel = new BroadcastChannel('chase_realtime_sync')
      this.broadcastChannel.onmessage = (event) => {
        this.handleBroadcastMessage(event.data)
      }
    } catch {
      // BroadcastChannel not supported, fall back to storage events
      console.log('[v0] BroadcastChannel not supported, using storage events')
    }

    // Sync localStorage data periodically for real-time updates
    this.syncInterval = setInterval(() => {
      this.syncWithLocalStorage()
    }, 500) // Reduced to 500ms for more responsive updates

    // Heartbeat to track online status and sync pending updates
    this.heartbeatInterval = setInterval(() => {
      this.processHeartbeat()
    }, 5000)

    // Listen for storage events from other tabs/windows
    window.addEventListener("storage", this.handleStorageChange.bind(this))

    // Track online/offline status
    window.addEventListener("online", () => {
      this.isOnline = true
      this.processPendingUpdates()
    })
    window.addEventListener("offline", () => {
      this.isOnline = false
    })

    // Update last active timestamp
    this.updateLastActive()
  }

  private handleBroadcastMessage(event: SyncEvent) {
    // Don't process events from this tab
    if (event.sourceTabId === this.tabId) return

    // Process the sync event
    const listeners = this.listeners.get(event.key)
    if (listeners) {
      listeners.forEach((callback) => callback(event.data))
    }

    // Also notify event listeners
    const eventListeners = this.eventListeners.get(event.key)
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(event))
    }
  }

  private syncWithLocalStorage() {
    // Trigger listeners for real-time updates
    this.listeners.forEach((callbacks, key) => {
      try {
        const data = localStorage.getItem(key)
        if (data) {
          const parsedData = JSON.parse(data)
          const lastTimestamp = this.lastSyncTimestamps.get(key) || 0
          const dataTimestamp = parsedData._timestamp || 0

          // Only trigger if data is newer
          if (dataTimestamp > lastTimestamp) {
            this.lastSyncTimestamps.set(key, dataTimestamp)
            callbacks.forEach((callback) => callback(parsedData))
          }
        }
      } catch (e) {
        // Silently handle parse errors
      }
    })
  }

  private handleStorageChange(event: StorageEvent) {
    if (!event.key) return

    const listeners = this.listeners.get(event.key)
    if (listeners && event.newValue) {
      try {
        const data = JSON.parse(event.newValue)
        listeners.forEach((callback) => callback(data))
      } catch {
        // Silently handle parse errors
      }
    }
  }

  private processHeartbeat() {
    this.updateLastActive()
    if (this.isOnline && this.pendingUpdates.length > 0) {
      this.processPendingUpdates()
    }
  }

  private processPendingUpdates() {
    while (this.pendingUpdates.length > 0) {
      const update = this.pendingUpdates.shift()
      if (update) {
        this.publishInternal(update.key, update.data, false)
      }
    }
  }

  private updateLastActive() {
    if (typeof window !== "undefined") {
      localStorage.setItem('chase_tab_active', JSON.stringify({
        tabId: this.tabId,
        timestamp: Date.now()
      }))
    }
  }

  subscribe(key: string, callback: (data: any) => void) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key)!.add(callback)

    // Immediately call with current data if available
    if (typeof window !== "undefined") {
      const data = localStorage.getItem(key)
      if (data) {
        try {
          const parsedData = JSON.parse(data)
          callback(parsedData)
        } catch {
          // Silently handle parse errors
        }
      }
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(key)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.listeners.delete(key)
        }
      }
    }
  }

  // Subscribe to sync events (with metadata)
  subscribeToEvents(key: string, callback: (event: SyncEvent) => void) {
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, new Set())
    }
    this.eventListeners.get(key)!.add(callback)

    return () => {
      const callbacks = this.eventListeners.get(key)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.eventListeners.delete(key)
        }
      }
    }
  }

  private publishInternal(key: string, data: any, addTimestamp: boolean = true) {
    const dataWithTimestamp = addTimestamp ? { ...data, _timestamp: Date.now() } : data
    
    localStorage.setItem(key, JSON.stringify(dataWithTimestamp))

    // Notify all listeners immediately
    const listeners = this.listeners.get(key)
    if (listeners) {
      listeners.forEach((callback) => callback(dataWithTimestamp))
    }

    // Broadcast to other tabs
    if (this.broadcastChannel) {
      const event: SyncEvent = {
        type: 'update',
        key,
        data: dataWithTimestamp,
        timestamp: Date.now(),
        sourceTabId: this.tabId
      }
      this.broadcastChannel.postMessage(event)
    }
  }

  publish(key: string, data: any) {
    if (!this.isOnline) {
      // Queue update for later if offline
      this.pendingUpdates.push({
        type: 'update',
        key,
        data,
        timestamp: Date.now(),
        sourceTabId: this.tabId
      })
      return
    }

    this.publishInternal(key, data)
  }

  // Publish with specific event type
  publishEvent(key: string, data: any, type: SyncEventType = 'update') {
    const event: SyncEvent = {
      type,
      key,
      data: { ...data, _timestamp: Date.now() },
      timestamp: Date.now(),
      sourceTabId: this.tabId
    }

    localStorage.setItem(key, JSON.stringify(event.data))

    // Notify listeners
    const listeners = this.listeners.get(key)
    if (listeners) {
      listeners.forEach((callback) => callback(event.data))
    }

    // Notify event listeners
    const eventListeners = this.eventListeners.get(key)
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(event))
    }

    // Broadcast to other tabs
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(event)
    }
  }

  // Get data directly from storage
  get(key: string): any {
    if (typeof window === "undefined") return null
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  // Remove data
  remove(key: string) {
    if (typeof window === "undefined") return
    
    localStorage.removeItem(key)
    
    // Notify listeners with null
    const listeners = this.listeners.get(key)
    if (listeners) {
      listeners.forEach((callback) => callback(null))
    }

    // Broadcast deletion
    if (this.broadcastChannel) {
      const event: SyncEvent = {
        type: 'delete',
        key,
        data: null,
        timestamp: Date.now(),
        sourceTabId: this.tabId
      }
      this.broadcastChannel.postMessage(event)
    }
  }

  // Check if online
  getOnlineStatus(): boolean {
    return this.isOnline
  }

  // Get current tab ID
  getTabId(): string {
    return this.tabId
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
    }
    this.listeners.clear()
    this.eventListeners.clear()
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", this.handleStorageChange)
    }
  }
}

// Singleton instance
let syncInstance: RealTimeSync | null = null

export function getRealTimeSync(): RealTimeSync {
  if (!syncInstance) {
    syncInstance = new RealTimeSync()
  }
  return syncInstance
}
