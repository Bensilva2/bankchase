// Real-time synchronization service for Chase Banking App
// Handles cross-component state updates and real-time data flow

export class RealTimeSync {
  private syncInterval: NodeJS.Timeout | null = null
  private listeners: Map<string, Set<(data: any) => void>> = new Map()

  constructor() {
    this.initializeSync()
  }

  private initializeSync() {
    if (typeof window === "undefined") return

    // Sync localStorage data every second for real-time updates
    this.syncInterval = setInterval(() => {
      this.syncWithLocalStorage()
    }, 1000)

    // Listen for storage events from other tabs/windows
    window.addEventListener("storage", this.handleStorageChange.bind(this))
  }

  private syncWithLocalStorage() {
    // Trigger listeners for real-time updates
    this.listeners.forEach((callbacks, key) => {
      const data = localStorage.getItem(key)
      if (data) {
        const parsedData = JSON.parse(data)
        callbacks.forEach((callback) => callback(parsedData))
      }
    })
  }

  private handleStorageChange(event: StorageEvent) {
    if (!event.key) return

    const listeners = this.listeners.get(event.key)
    if (listeners && event.newValue) {
      const data = JSON.parse(event.newValue)
      listeners.forEach((callback) => callback(data))
    }
  }

  subscribe(key: string, callback: (data: any) => void) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    this.listeners.get(key)!.add(callback)

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

  publish(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data))

    // Notify all listeners immediately
    const listeners = this.listeners.get(key)
    if (listeners) {
      listeners.forEach((callback) => callback(data))
    }
  }

  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    this.listeners.clear()
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
