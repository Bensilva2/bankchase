import { createClient } from "@/lib/supabase/client"

const STORAGE_KEY = "chase_banking_data"
const SYNC_KEY = "chase_banking_last_sync"

export interface SyncStatus {
  lastSynced: string | null
  isOnline: boolean
  isSyncing: boolean
}

// Get data from localStorage
export function getLocalData(): any | null {
  if (typeof window === "undefined") return null
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch (error) {
    console.error("Failed to get local data:", error)
    return null
  }
}

// Save data to localStorage
export function saveLocalData(data: any): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...data,
        savedAt: new Date().toISOString(),
      }),
    )
  } catch (error) {
    console.error("Failed to save local data:", error)
  }
}

// Get last sync time
export function getLastSyncTime(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(SYNC_KEY)
}

// Set last sync time
export function setLastSyncTime(time: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(SYNC_KEY, time)
}

// Sync data to Supabase (cloud)
export async function syncToCloud(email: string, data: any): Promise<boolean> {
  try {
    // Skip if running on server side
    if (typeof window === "undefined") {
      return false
    }

    const supabase = createClient()

    // Check if record exists
    const { data: existing } = await supabase
      .from("banking_data")
      .select("id, updated_at")
      .eq("user_email", email)
      .single()

    const dataToSync = {
      ...data,
      savedAt: new Date().toISOString(),
    }

    if (existing) {
      // Update existing record
      const { error } = await supabase.from("banking_data").update({ data: dataToSync }).eq("user_email", email)

      if (error) throw error
    } else {
      // Insert new record
      const { error } = await supabase.from("banking_data").insert({ user_email: email, data: dataToSync })

      if (error) throw error
    }

    setLastSyncTime(new Date().toISOString())
    return true
  } catch (error: any) {
    // Silently ignore table not found errors - database may not be initialized yet
    if (error?.message?.includes("Could not find the table")) {
      return false
    }
    console.error("Failed to sync to cloud:", error)
    return false
  }
}

// Fetch data from Supabase (cloud)
export async function fetchFromCloud(email: string): Promise<any | null> {
  try {
    // Skip if running on server side
    if (typeof window === "undefined") {
      return null
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from("banking_data")
      .select("data, updated_at")
      .eq("user_email", email)
      .single()

    if (error) {
      // Silently return null if table doesn't exist
      if (error?.message?.includes("Could not find the table")) {
        return null
      }
      throw error
    }

    return data?.data || null
  } catch (error: any) {
    // Silently ignore table not found errors - database may not be initialized yet
    if (error?.message?.includes("Could not find the table")) {
      return null
    }
    console.error("Failed to fetch from cloud:", error)
    return null
  }
}

// Merge local and cloud data (cloud wins if newer, but preserves local changes)
export function mergeData(localData: any, cloudData: any): any {
  if (!localData && !cloudData) return null
  if (!localData) return cloudData
  if (!cloudData) return localData

  const localTime = new Date(localData.savedAt || 0).getTime()
  const cloudTime = new Date(cloudData.savedAt || 0).getTime()

  // Use newer data, but merge transactions and activities to not lose any
  if (cloudTime > localTime) {
    return {
      ...cloudData,
      // Merge transactions - combine and dedupe by ID
      transactions: mergeArrayById(localData.transactions || [], cloudData.transactions || []),
      // Merge recent activity
      recentActivity: mergeArrayById(localData.recentActivity || [], cloudData.recentActivity || []),
      // Merge notifications
      notifications: mergeArrayById(localData.notifications || [], cloudData.notifications || []),
      savedAt: cloudData.savedAt,
    }
  } else {
    return {
      ...localData,
      transactions: mergeArrayById(localData.transactions || [], cloudData.transactions || []),
      recentActivity: mergeArrayById(localData.recentActivity || [], cloudData.recentActivity || []),
      notifications: mergeArrayById(localData.notifications || [], cloudData.notifications || []),
      savedAt: localData.savedAt,
    }
  }
}

// Helper to merge arrays by ID
function mergeArrayById(arr1: any[], arr2: any[]): any[] {
  const map = new Map()

  // Add all items from arr2 first
  arr2.forEach((item) => {
    if (item.id) map.set(item.id, item)
  })

  // Add items from arr1, overwriting if they have same ID but newer date
  arr1.forEach((item) => {
    if (item.id) {
      const existing = map.get(item.id)
      if (!existing) {
        map.set(item.id, item)
      } else {
        // Keep the newer one
        const existingTime = new Date(existing.date || existing.createdAt || 0).getTime()
        const newTime = new Date(item.date || item.createdAt || 0).getTime()
        if (newTime > existingTime) {
          map.set(item.id, item)
        }
      }
    }
  })

  return Array.from(map.values())
}

// Full sync operation
export async function performSync(
  email: string,
  localData: any,
): Promise<{ success: boolean; mergedData: any | null }> {
  try {
    // First, save current local data to cloud
    await syncToCloud(email, localData)

    // Then fetch cloud data (might have updates from other devices)
    const cloudData = await fetchFromCloud(email)

    // Merge the data
    const mergedData = mergeData(localData, cloudData)

    // Save merged data to both local and cloud
    if (mergedData) {
      saveLocalData(mergedData)
      await syncToCloud(email, mergedData)
    }

    return { success: true, mergedData }
  } catch (error) {
    console.error("Sync failed:", error)
    return { success: false, mergedData: null }
  }
}

// Check localStorage quota
export function getStorageQuota(): { used: number; available: number; percentage: number } | null {
  if (typeof window === "undefined") return null

  try {
    if (!navigator.storage?.estimate) {
      return null
    }

    let used = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length
      }
    }

    // Approximate quota is typically 5-10MB for most browsers
    const quota = 5 * 1024 * 1024 // 5MB estimate
    const available = quota - used
    const percentage = (used / quota) * 100

    return { used, available, percentage }
  } catch (error) {
    console.error("Failed to calculate storage quota:", error)
    return null
  }
}

// Archive old transactions to reduce storage usage
export function archiveOldTransactions(data: any, daysToKeep: number = 90): any {
  if (!data || !data.transactions) return data

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
  const cutoffTime = cutoffDate.getTime()

  const recentTransactions = data.transactions.filter((tx: any) => {
    const txTime = new Date(tx.date).getTime()
    return txTime > cutoffTime
  })

  // Archive count for reference
  const archivedCount = data.transactions.length - recentTransactions.length

  return {
    ...data,
    transactions: recentTransactions,
    archivedAt: new Date().toISOString(),
    transactionsArchived: archivedCount,
  }
}

// Clear old notifications
export function cleanupOldNotifications(data: any, daysToKeep: number = 30): any {
  if (!data || !data.notifications) return data

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
  const cutoffTime = cutoffDate.getTime()

  const recentNotifications = data.notifications.filter((notif: any) => {
    const notifTime = new Date(notif.date).getTime()
    // Keep unread notifications regardless of age
    return notifTime > cutoffTime || !notif.read
  })

  return {
    ...data,
    notifications: recentNotifications,
  }
}

// Export data for backup
export function exportDataAsJSON(data: any): string {
  return JSON.stringify(
    {
      ...data,
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  )
}

// Import data from JSON backup
export function importDataFromJSON(jsonString: string): any {
  try {
    const data = JSON.parse(jsonString)
    return data
  } catch (error) {
    console.error("Failed to import data:", error)
    throw new Error("Invalid JSON format")
  }
}
