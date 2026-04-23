"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useBanking, type LinkedDevice } from "@/lib/banking-context"
import { getRealTimeSync } from "@/lib/real-time-sync"
import { useToast } from "@/hooks/use-toast"

const DEVICES_SYNC_KEY = "chase_devices_sync"
const DEVICE_ACTIVITY_KEY = "chase_device_activity"

export type DeviceActivity = {
  id: string
  deviceId: string
  deviceName: string
  action: string
  timestamp: string
  location: string
  ip?: string
  success: boolean
}

export type DeviceStats = {
  totalDevices: number
  trustedDevices: number
  activeToday: number
  deviceTypes: {
    mobile: number
    tablet: number
    desktop: number
  }
  locations: string[]
}

export function useDeviceManagement() {
  const {
    linkedDevices,
    removeDevice,
    addDevice,
    updateDevice,
    addActivity,
    appSettings,
    updateAppSettings,
    addNotification,
  } = useBanking()

  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [deviceActivities, setDeviceActivities] = useState<DeviceActivity[]>([])
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [stats, setStats] = useState<DeviceStats | null>(null)
  const realTimeSync = useRef(getRealTimeSync())

  const safeLinkedDevices = linkedDevices || []
  const currentDeviceId = typeof window !== "undefined" ? localStorage.getItem("chase_device_id") : null

  // Load device activities from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedActivities = localStorage.getItem(DEVICE_ACTIVITY_KEY)
      if (savedActivities) {
        try {
          setDeviceActivities(JSON.parse(savedActivities))
        } catch {
          // Handle parse error silently
        }
      }
    }
  }, [])

  // Calculate stats
  useEffect(() => {
    const today = new Date()
    const devices = safeLinkedDevices

    const newStats: DeviceStats = {
      totalDevices: devices.length,
      trustedDevices: appSettings?.trustedDevices?.length || 0,
      activeToday: devices.filter((d) => {
        const lastActive = new Date(d.lastActive)
        return lastActive.toDateString() === today.toDateString()
      }).length,
      deviceTypes: {
        mobile: devices.filter((d) => d.type === "mobile").length,
        tablet: devices.filter((d) => d.type === "tablet").length,
        desktop: devices.filter((d) => d.type === "desktop").length,
      },
      locations: [...new Set(devices.map((d) => d.location))],
    }

    setStats(newStats)
  }, [safeLinkedDevices, appSettings?.trustedDevices])

  // Real-time sync subscription
  useEffect(() => {
    const unsubscribe = realTimeSync.current.subscribe(DEVICES_SYNC_KEY, (data) => {
      if (data && data.action) {
        switch (data.action) {
          case "device_removed":
            if (data.deviceId && data.deviceId !== currentDeviceId) {
              toast({
                title: "Device Signed Out",
                description: `${data.deviceName} was signed out from another device.`,
              })
            }
            setLastSyncTime(new Date())
            break
          case "device_updated":
            setLastSyncTime(new Date())
            break
          case "device_added":
            if (data.deviceId !== currentDeviceId) {
              toast({
                title: "New Device Detected",
                description: `${data.deviceName} was added to your account.`,
              })
              if (appSettings?.loginAlerts) {
                addNotification?.({
                  title: "New Device Login",
                  message: `A new device "${data.deviceName}" logged into your account from ${data.location || "Unknown Location"}.`,
                  type: "alert",
                  category: "Security",
                })
              }
            }
            setLastSyncTime(new Date())
            break
          case "bulk_signout":
            toast({
              title: "Devices Signed Out",
              description: `${data.count} device(s) were signed out from your account.`,
            })
            setLastSyncTime(new Date())
            break
        }
      }
    })

    return () => unsubscribe()
  }, [currentDeviceId, toast, appSettings?.loginAlerts, addNotification])

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Save device activity
  const saveDeviceActivity = useCallback((activity: Omit<DeviceActivity, "id">) => {
    const newActivity: DeviceActivity = {
      ...activity,
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    setDeviceActivities((prev) => {
      const updated = [newActivity, ...prev].slice(0, 100) // Keep last 100 activities
      if (typeof window !== "undefined") {
        localStorage.setItem(DEVICE_ACTIVITY_KEY, JSON.stringify(updated))
      }
      return updated
    })

    // Broadcast activity to other tabs
    realTimeSync.current.publish(DEVICE_ACTIVITY_KEY, newActivity)

    return newActivity
  }, [])

  // Sign out a specific device
  const signOutDevice = useCallback(
    async (device: LinkedDevice) => {
      setIsLoading(true)
      try {
        // Call API to terminate session
        const response = await fetch("/api/auth/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "terminate-session",
            sessionId: device.id,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to terminate session")
        }

        // Remove device from local state
        removeDevice(device.id)

        // Log activity
        saveDeviceActivity({
          deviceId: device.id,
          deviceName: device.name,
          action: "Device signed out",
          timestamp: new Date().toISOString(),
          location: device.location,
          ip: device.ip,
          success: true,
        })

        addActivity({
          action: `Signed out device: ${device.name}`,
          device: "Current Device",
          location: "Current Location",
        })

        // Broadcast to other tabs
        realTimeSync.current.publish(DEVICES_SYNC_KEY, {
          action: "device_removed",
          deviceId: device.id,
          deviceName: device.name,
        })

        toast({
          title: "Device Signed Out",
          description: `${device.name} has been signed out from your account.`,
        })

        return true
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to sign out device. Please try again.",
          variant: "destructive",
        })
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [removeDevice, saveDeviceActivity, addActivity, toast]
  )

  // Sign out all other devices
  const signOutAllOtherDevices = useCallback(async () => {
    setIsLoading(true)
    try {
      // Call API to logout all sessions
      const response = await fetch("/api/auth/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "logout-all",
          email: "demo@example.com",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to logout all devices")
      }

      // Remove all devices except current
      const otherDevices = safeLinkedDevices.filter((d) => d.id !== currentDeviceId && !d.current)
      otherDevices.forEach((device) => {
        removeDevice(device.id)
        saveDeviceActivity({
          deviceId: device.id,
          deviceName: device.name,
          action: "Device signed out (bulk action)",
          timestamp: new Date().toISOString(),
          location: device.location,
          ip: device.ip,
          success: true,
        })
      })

      addActivity({
        action: `Signed out ${otherDevices.length} device(s)`,
        device: "Current Device",
        location: "Current Location",
      })

      // Broadcast to other tabs
      realTimeSync.current.publish(DEVICES_SYNC_KEY, {
        action: "bulk_signout",
        count: otherDevices.length,
      })

      toast({
        title: "All Devices Signed Out",
        description: `${otherDevices.length} device(s) have been signed out.`,
      })

      return true
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out all devices. Please try again.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }, [safeLinkedDevices, currentDeviceId, removeDevice, saveDeviceActivity, addActivity, toast])

  // Rename a device
  const renameDevice = useCallback(
    (deviceId: string, newName: string) => {
      const device = safeLinkedDevices.find((d) => d.id === deviceId)
      if (!device) return false

      updateDevice?.(deviceId, { name: newName })

      saveDeviceActivity({
        deviceId,
        deviceName: device.name,
        action: `Device renamed to "${newName}"`,
        timestamp: new Date().toISOString(),
        location: device.location,
        success: true,
      })

      addActivity({
        action: `Renamed device: ${device.name} to ${newName}`,
        device: "Current Device",
        location: "Current Location",
      })

      realTimeSync.current.publish(DEVICES_SYNC_KEY, {
        action: "device_updated",
        deviceId,
      })

      toast({
        title: "Device Renamed",
        description: `Device has been renamed to "${newName}".`,
      })

      return true
    },
    [safeLinkedDevices, updateDevice, saveDeviceActivity, addActivity, toast]
  )

  // Toggle device trust status
  const toggleDeviceTrust = useCallback(
    (device: LinkedDevice) => {
      const isTrusted = appSettings?.trustedDevices?.some((d) => d.id === device.id) || false

      if (isTrusted) {
        // Remove from trusted devices
        const updatedTrusted = appSettings?.trustedDevices?.filter((d) => d.id !== device.id) || []
        updateAppSettings?.({ trustedDevices: updatedTrusted })

        toast({
          title: "Device Untrusted",
          description: `${device.name} has been removed from trusted devices.`,
        })
      } else {
        // Add to trusted devices
        const newTrusted = {
          id: device.id,
          name: device.name,
          type: device.type,
          lastUsed: new Date().toISOString(),
          location: device.location,
          trusted: true,
        }
        const updatedTrusted = [...(appSettings?.trustedDevices || []), newTrusted]
        updateAppSettings?.({ trustedDevices: updatedTrusted })

        toast({
          title: "Device Trusted",
          description: `${device.name} has been added to trusted devices.`,
        })
      }

      saveDeviceActivity({
        deviceId: device.id,
        deviceName: device.name,
        action: isTrusted ? "Device untrusted" : "Device marked as trusted",
        timestamp: new Date().toISOString(),
        location: device.location,
        success: true,
      })

      addActivity({
        action: isTrusted ? `Untrusted device: ${device.name}` : `Trusted device: ${device.name}`,
        device: "Current Device",
        location: "Current Location",
      })

      realTimeSync.current.publish(DEVICES_SYNC_KEY, {
        action: "device_updated",
        deviceId: device.id,
      })

      return !isTrusted
    },
    [appSettings?.trustedDevices, updateAppSettings, saveDeviceActivity, addActivity, toast]
  )

  // Check if a device is trusted
  const isDeviceTrusted = useCallback(
    (deviceId: string) => {
      return appSettings?.trustedDevices?.some((d) => d.id === deviceId) || false
    },
    [appSettings?.trustedDevices]
  )

  // Refresh devices list
  const refreshDevices = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-sessions" }),
      })

      if (response.ok) {
        setLastSyncTime(new Date())
        toast({
          title: "Refreshed",
          description: "Device list has been updated.",
        })
      }
    } catch {
      // Handle error silently
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  return {
    devices: safeLinkedDevices,
    currentDeviceId,
    deviceActivities,
    stats,
    isLoading,
    isOnline,
    lastSyncTime,
    signOutDevice,
    signOutAllOtherDevices,
    renameDevice,
    toggleDeviceTrust,
    isDeviceTrusted,
    refreshDevices,
    saveDeviceActivity,
  }
}
