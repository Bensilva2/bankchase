import { createClient } from "@/lib/supabase/client"

function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

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
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    const supabase = createClient()
    if (!supabase) {
      return false
    }

    const dataToSync = {
      ...data,
      savedAt: new Date().toISOString(),
    }

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Sync timeout")), 10000))

    const syncPromise = (async () => {
      // Use maybeSingle() instead of single() to avoid errors when no record exists
      const { data: existing, error: fetchError } = await supabase
        .from("banking_data")
        .select("id, updated_at")
        .eq("user_email", email)
        .maybeSingle()

      if (fetchError) {
        console.log("Error checking existing record:", fetchError)
        return false
      }

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("banking_data")
          .update({ data: dataToSync, updated_at: new Date().toISOString() })
          .eq("user_email", email)

        if (updateError) {
          console.log("Error updating record:", updateError)
          return false
        }
      } else {
        // Insert new record - wrap in try/catch to handle race condition
        const { error: insertError } = await supabase
          .from("banking_data")
          .insert({ user_email: email, data: dataToSync })

        // If insert fails with duplicate key (race condition), try update instead
        if (insertError) {
          if (insertError.code === "23505") {
            // Duplicate key error - try update instead
            const { error: updateError } = await supabase
              .from("banking_data")
              .update({ data: dataToSync, updated_at: new Date().toISOString() })
              .eq("user_email", email)

            if (updateError) {
              console.log("Error updating after duplicate:", updateError)
              return false
            }
          } else {
            console.log("Error inserting record:", insertError)
            return false
          }
        }
      }

      setLastSyncTime(new Date().toISOString())
      return true
    })()

    const result = (await Promise.race([syncPromise, timeoutPromise])) as boolean
    return result
  } catch (error) {
    console.log("Sync skipped (offline or network issue)")
    return false
  }
}

// Fetch data from Supabase (cloud)
export async function fetchFromCloud(email: string): Promise<any | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  try {
    const supabase = createClient()
    if (!supabase) {
      return null
    }

    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Fetch timeout")), 10000))

    const fetchPromise = (async () => {
      const { data, error } = await supabase
        .from("banking_data")
        .select("data, updated_at")
        .eq("user_email", email)
        .maybeSingle()

      if (error) {
        console.log("Error fetching from cloud:", error)
        return null
      }

      return data?.data || null
    })()

    const result = await Promise.race([fetchPromise, timeoutPromise])
    return result
  } catch (error) {
    console.log("Fetch skipped (offline or network issue)")
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
