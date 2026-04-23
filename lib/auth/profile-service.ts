/**
 * User Profile Service with localStorage persistence
 * Syncs across devices and sessions in real-time
 */

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  profilePicture: string | null // Base64 encoded image
  twoFactorEnabled: boolean
  totpBackupCodes: string[]
  totpSecret: string | null
  createdAt: string
  updatedAt: string
  deviceId: string
  lastSyncedAt: string
}

export interface ProfileSettings {
  twoFactorEnabled: boolean
  loginAlerts: boolean
  biometricEnabled: boolean
  sessionTimeout: number
  profilePicture: string | null
  totpBackupCodesCount: number
  lastTwoFactorChange: string | null
}

const STORAGE_KEY = 'user_profile'
const SETTINGS_KEY = 'user_settings'
const PROFILE_PICTURE_KEY = 'user_profile_picture'
const DEVICE_ID_KEY = 'device_id'
const SYNC_TIMESTAMP_KEY = 'last_sync_timestamp'
const PROFILE_CHANGE_CALLBACKS: Set<(profile: UserProfile | null) => void> = new Set()

/**
 * Generate or get device ID for cross-device sync
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return ''

  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}

/**
 * Get current user profile from localStorage or database
 */
export function getUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null

  try {
    const profile = JSON.parse(stored)
    // Ensure device ID is set
    if (!profile.deviceId) {
      profile.deviceId = getDeviceId()
    }
    return profile
  } catch (error) {
    console.error('[v0] Failed to parse user profile:', error)
    return null
  }
}

/**
 * Update user profile in localStorage and sync to database
 */
export async function updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  if (typeof window === 'undefined') {
    throw new Error('Profile service requires browser environment')
  }

  const current = getUserProfile()
  if (!current) {
    throw new Error('No user profile found')
  }

  const updated: UserProfile = {
    ...current,
    ...profile,
    deviceId: getDeviceId(),
    updatedAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
  }

  // Save to localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  localStorage.setItem(SYNC_TIMESTAMP_KEY, updated.lastSyncedAt)

  // Notify all listeners of the change
  PROFILE_CHANGE_CALLBACKS.forEach(callback => {
    try {
      callback(updated)
    } catch (error) {
      console.error('[v0] Callback error:', error)
    }
  })

  // Emit storage event for cross-tab sync
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: JSON.stringify(updated),
      oldValue: JSON.stringify(current),
      storageArea: localStorage,
    })
  )

  // Sync to database asynchronously
  try {
    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })

    if (!response.ok) {
      console.error('[v0] Failed to sync profile to database')
    }
  } catch (error) {
    console.error('[v0] Profile sync error:', error)
  }

  return updated
}

/**
 * Get profile settings
 */
export function getProfileSettings(): ProfileSettings {
  if (typeof window === 'undefined') {
    return {
      twoFactorEnabled: false,
      loginAlerts: true,
      biometricEnabled: false,
      sessionTimeout: 30,
      profilePicture: null,
    }
  }

  const stored = localStorage.getItem(SETTINGS_KEY)
  if (stored) {
    return JSON.parse(stored)
  }

  const profile = getUserProfile()
  return {
    twoFactorEnabled: profile?.twoFactorEnabled || false,
    loginAlerts: true,
    biometricEnabled: false,
    sessionTimeout: 30,
    profilePicture: profile?.profilePicture || null,
  }
}

/**
 * Update profile settings
 */
export async function updateProfileSettings(
  settings: Partial<ProfileSettings>
): Promise<ProfileSettings> {
  if (typeof window === 'undefined') {
    throw new Error('Settings service requires browser environment')
  }

  const current = getProfileSettings()
  const updated: ProfileSettings = {
    ...current,
    ...settings,
  }

  // Save to localStorage
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))

  // Also update user profile with 2FA setting
  const profile = getUserProfile()
  if (profile && settings.twoFactorEnabled !== undefined) {
    await updateUserProfile({
      twoFactorEnabled: settings.twoFactorEnabled,
    })
  }

  // Emit storage event for cross-tab sync
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: SETTINGS_KEY,
      newValue: JSON.stringify(updated),
      oldValue: JSON.stringify(current),
      storageArea: localStorage,
    })
  )

  return updated
}

/**
 * Set profile picture (stores as base64)
 */
export async function setProfilePicture(file: File): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Profile service requires browser environment')
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      const base64 = e.target?.result as string

      // Save to localStorage
      localStorage.setItem(PROFILE_PICTURE_KEY, base64)

      // Update profile
      const profile = getUserProfile()
      if (profile) {
        const updated = await updateUserProfile({
          profilePicture: base64,
        })
        resolve(updated.profilePicture || '')
      } else {
        resolve(base64)
      }
    }

    reader.onerror = (error) => {
      reject(error)
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Get profile picture
 */
export function getProfilePicture(): string | null {
  if (typeof window === 'undefined') return null

  const picture = localStorage.getItem(PROFILE_PICTURE_KEY)
  if (picture) return picture

  const profile = getUserProfile()
  return profile?.profilePicture || null
}

/**
 * Clear all user data from localStorage
 */
export function clearUserData(): void {
  if (typeof window === 'undefined') return

  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(SETTINGS_KEY)
  localStorage.removeItem(PROFILE_PICTURE_KEY)
}

/**
 * Initialize user profile (called on login)
 */
export async function initializeProfile(email: string): Promise<UserProfile> {
  if (typeof window === 'undefined') {
    throw new Error('Profile service requires browser environment')
  }

  const deviceId = getDeviceId()

  // Try to fetch from database
  try {
    const response = await fetch(`/api/auth/profile?email=${encodeURIComponent(email)}`)

    if (response.ok) {
      const profile = await response.json()
      const enrichedProfile = {
        ...profile,
        deviceId,
        lastSyncedAt: new Date().toISOString(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(enrichedProfile))
      localStorage.setItem(SYNC_TIMESTAMP_KEY, enrichedProfile.lastSyncedAt)
      
      // Notify listeners
      PROFILE_CHANGE_CALLBACKS.forEach(callback => {
        try {
          callback(enrichedProfile)
        } catch (error) {
          console.error('[v0] Callback error:', error)
        }
      })
      
      return enrichedProfile
    }
  } catch (error) {
    console.error('[v0] Failed to fetch profile from database:', error)
  }

  // Create new profile
  const now = new Date().toISOString()
  const newProfile: UserProfile = {
    id: `user_${Date.now()}`,
    email,
    firstName: '',
    lastName: '',
    phone: '',
    profilePicture: null,
    twoFactorEnabled: false,
    totpBackupCodes: [],
    totpSecret: null,
    deviceId,
    createdAt: now,
    updatedAt: now,
    lastSyncedAt: now,
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile))
  localStorage.setItem(SYNC_TIMESTAMP_KEY, now)

  // Notify listeners
  PROFILE_CHANGE_CALLBACKS.forEach(callback => {
    try {
      callback(newProfile)
    } catch (error) {
      console.error('[v0] Callback error:', error)
    }
  })

  return newProfile
}

/**
 * Register a callback for profile changes
 */
export function onProfileChange(callback: (profile: UserProfile | null) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  // Add to callback set for direct updates
  PROFILE_CHANGE_CALLBACKS.add(callback)

  // Also listen for storage changes across tabs/windows
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const profile = JSON.parse(e.newValue)
        callback(profile)
      } catch (error) {
        console.error('[v0] Profile change parsing error:', error)
      }
    }
  }

  window.addEventListener('storage', handleStorageChange)

  // Return unsubscribe function
  return () => {
    window.removeEventListener('storage', handleStorageChange)
    PROFILE_CHANGE_CALLBACKS.delete(callback)
  }
}

/**
 * Listen for settings changes
 */
export function onSettingsChange(callback: (settings: ProfileSettings) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === SETTINGS_KEY && e.newValue) {
      try {
        const settings = JSON.parse(e.newValue)
        callback(settings)
      } catch (error) {
        console.error('[v0] Settings change parsing error:', error)
      }
    }
  }

  window.addEventListener('storage', handleStorageChange)

  return () => {
    window.removeEventListener('storage', handleStorageChange)
  }
}
