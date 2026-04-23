'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getUserProfile,
  updateUserProfile,
  getProfileSettings,
  updateProfileSettings,
  onProfileChange,
  initializeProfile,
  UserProfile,
  ProfileSettings,
} from '@/lib/auth/profile-service'
import { getSyncService, on2FASync } from '@/lib/auth/realtime-sync-service'
import { useToast } from '@/hooks/use-toast'

export interface Use2FAReturn {
  profile: UserProfile | null
  settings: ProfileSettings | null
  isLoading: boolean
  error: string | null
  enable2FA: () => Promise<void>
  disable2FA: () => Promise<void>
  toggle2FA: () => Promise<void>
  updateSetting: (key: keyof ProfileSettings, value: any) => Promise<void>
  refreshProfile: () => Promise<void>
  initialize: (email: string) => Promise<void>
}

export function use2FA(): Use2FAReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<ProfileSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const unsubscribeSyncRef = useRef<(() => void) | null>(null)
  const syncServiceRef = useRef<ReturnType<typeof getSyncService> | null>(null)
  const { toast } = useToast()

  // Initialize profile on mount and subscribe to real-time changes
  useEffect(() => {
    const initProfile = async () => {
      try {
        const stored = getUserProfile()
        if (stored) {
          setProfile(stored)
          setSettings(getProfileSettings())
          console.log('[v0] Profile initialized:', stored.email, 'with 2FA:', stored.twoFactorEnabled)

          // Start sync service for cross-device updates
          syncServiceRef.current = getSyncService(stored.email)
          syncServiceRef.current.start()

          // Listen for sync updates
          unsubscribeSyncRef.current = syncServiceRef.current.onSync((syncData) => {
            console.log('[v0] Received sync update:', syncData)
            // Update local state if needed
            const profile = getUserProfile()
            if (profile && syncData.twoFactorEnabled !== profile.twoFactorEnabled) {
              updateUserProfile({
                twoFactorEnabled: syncData.twoFactorEnabled,
              })
            }
          })
        }
      } catch (err) {
        console.error('[v0] Profile initialization error:', err)
      }
    }

    initProfile()

    // Subscribe to profile changes for real-time updates
    unsubscribeRef.current = onProfileChange((newProfile) => {
      if (newProfile) {
        setProfile(newProfile)
        setSettings(getProfileSettings())
        console.log('[v0] Profile changed in real-time:', newProfile.email, '2FA:', newProfile.twoFactorEnabled)
      }
    })

    // Listen for cross-tab 2FA sync events
    unsubscribeSyncRef.current = on2FASync((event: CustomEvent) => {
      console.log('[v0] Received 2FA sync event from another tab:', event.detail)
      const newProfile = getUserProfile()
      if (newProfile) {
        setProfile(newProfile)
        setSettings(getProfileSettings())
      }
    })

    return () => {
      unsubscribeRef.current?.()
      unsubscribeSyncRef.current?.()
      syncServiceRef.current?.stop()
    }
  }, [])

  const initialize = useCallback(
    async (email: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const profile = await initializeProfile(email)
        setProfile(profile)
        setSettings(getProfileSettings())
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize profile'
        setError(message)
        console.error('[v0] Profile init error:', err)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const enable2FA = useCallback(async () => {
    if (!profile) {
      setError('No user profile found')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          action: 'enable',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to enable 2FA')
      }

      // Update local state
      const updated = await updateUserProfile({
        twoFactorEnabled: true,
      })

      await updateProfileSettings({
        twoFactorEnabled: true,
      })

      setProfile(updated)
      toast({
        title: 'Success',
        description: '2FA has been enabled',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enable 2FA'
      setError(message)
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [profile, toast])

  const disable2FA = useCallback(async () => {
    if (!profile) {
      setError('No user profile found')
      return
    }

    if (
      !confirm(
        'Are you sure you want to disable 2FA? Your account will be less secure.'
      )
    ) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          action: 'disable',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to disable 2FA')
      }

      // Update local state
      const updated = await updateUserProfile({
        twoFactorEnabled: false,
      })

      await updateProfileSettings({
        twoFactorEnabled: false,
      })

      setProfile(updated)
      toast({
        title: 'Success',
        description: '2FA has been disabled',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disable 2FA'
      setError(message)
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [profile, toast])

  const toggle2FA = useCallback(async () => {
    if (!profile) {
      setError('No user profile found')
      return
    }

    if (profile.twoFactorEnabled) {
      await disable2FA()
    } else {
      await enable2FA()
    }
  }, [profile, enable2FA, disable2FA])

  const updateSetting = useCallback(
    async (key: keyof ProfileSettings, value: any) => {
      setIsLoading(true)
      setError(null)

      try {
        const updated = await updateProfileSettings({
          [key]: value,
        })

        setSettings(updated)

        // Show appropriate toast based on setting
        if (key === 'twoFactorEnabled') {
          toast({
            title: 'Success',
            description: value
              ? '2FA has been enabled'
              : '2FA has been disabled',
          })
        } else {
          toast({
            title: 'Success',
            description: 'Setting updated',
          })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update setting'
        setError(message)
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [toast]
  )

  const refreshProfile = useCallback(async () => {
    if (!profile) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/auth/profile?email=${encodeURIComponent(profile.email)}`
      )

      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setSettings(getProfileSettings())
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh profile'
      setError(message)
      console.error('[v0] Profile refresh error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [profile])

  return {
    profile,
    settings,
    isLoading,
    error,
    enable2FA,
    disable2FA,
    toggle2FA,
    updateSetting,
    refreshProfile,
    initialize,
  }
}
