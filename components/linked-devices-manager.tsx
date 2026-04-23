"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  MapPin,
  Clock,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Lock,
  Unlock,
  LogOut,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Wifi,
  WifiOff,
  Settings,
  MoreVertical,
  Copy,
  Check,
  Fingerprint,
  Key,
  History,
  Zap,
  Signal,
} from "lucide-react"
import { useBanking, type LinkedDevice } from "@/lib/banking-context"
import { useToast } from "@/hooks/use-toast"
import { getRealTimeSync } from "@/lib/real-time-sync"
import { formatDistanceToNow, format } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface LinkedDevicesManagerProps {
  onBack?: () => void
}

// Real-time sync keys
const DEVICES_SYNC_KEY = "chase_devices_sync"
const DEVICE_ACTIVITY_KEY = "chase_device_activity"

type DeviceActivity = {
  id: string
  deviceId: string
  deviceName: string
  action: string
  timestamp: string
  location: string
  ip?: string
  success: boolean
}

const detectDeviceInfo = () => {
  const ua = navigator.userAgent
  let deviceName = "Unknown Device"
  let deviceType = "desktop"
  let browser = "Unknown Browser"
  let os = "Unknown OS"

  // Detect OS
  if (ua.includes("Windows NT 10")) os = "Windows 10"
  else if (ua.includes("Windows NT 11") || (ua.includes("Windows NT 10") && ua.includes("Win64"))) os = "Windows 11"
  else if (ua.includes("Mac OS X")) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/)
    os = match ? `macOS ${match[1].replace("_", ".")}` : "macOS"
  } else if (ua.includes("iPhone OS")) {
    const match = ua.match(/iPhone OS (\d+_\d+)/)
    os = match ? `iOS ${match[1].replace("_", ".")}` : "iOS"
  } else if (ua.includes("iPad")) {
    const match = ua.match(/OS (\d+_\d+)/)
    os = match ? `iPadOS ${match[1].replace("_", ".")}` : "iPadOS"
  } else if (ua.includes("Android")) {
    const match = ua.match(/Android (\d+\.?\d*)/)
    os = match ? `Android ${match[1]}` : "Android"
  } else if (ua.includes("Linux")) os = "Linux"

  // Detect Browser
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome"
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari"
  else if (ua.includes("Firefox")) browser = "Firefox"
  else if (ua.includes("Edg")) browser = "Microsoft Edge"
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera"

  // Detect Device Type and Name
  if (ua.includes("iPhone")) {
    deviceType = "mobile"
    deviceName = "iPhone"
  } else if (ua.includes("iPad")) {
    deviceType = "tablet"
    deviceName = "iPad"
  } else if (ua.includes("Android")) {
    if (ua.includes("Mobile")) {
      deviceType = "mobile"
      deviceName = "Android Phone"
    } else {
      deviceType = "tablet"
      deviceName = "Android Tablet"
    }
  } else if (ua.includes("Macintosh")) {
    deviceType = "desktop"
    deviceName = "Mac"
  } else if (ua.includes("Windows")) {
    deviceType = "desktop"
    deviceName = "Windows PC"
  }

  if (deviceType === "desktop") {
    deviceName = `${deviceName} (${browser})`
  }

  return { deviceName, deviceType, browser, os }
}

export function LinkedDevicesManager({ onBack }: LinkedDevicesManagerProps) {
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
  const [activeTab, setActiveTab] = useState("devices")
  const [selectedDevice, setSelectedDevice] = useState<LinkedDevice | null>(null)
  const [showDeviceDetails, setShowDeviceDetails] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [showSignOutAllConfirm, setShowSignOutAllConfirm] = useState(false)
  const [newDeviceName, setNewDeviceName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [deviceActivities, setDeviceActivities] = useState<DeviceActivity[]>([])
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [copiedIp, setCopiedIp] = useState<string | null>(null)
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

  // Save device activities to localStorage
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
  }, [])

  // Real-time sync subscription
  useEffect(() => {
    const unsubscribeDevices = realTimeSync.current.subscribe(DEVICES_SYNC_KEY, (data) => {
      if (data && data.action) {
        switch (data.action) {
          case "device_removed":
            if (data.deviceId && data.deviceId !== currentDeviceId) {
              toast({
                title: "Device Signed Out",
                description: `${data.deviceName} was signed out from another device.`,
              })
            }
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
              if (appSettings?.loginAlerts && addNotification) {
                addNotification({
                  title: "New Device Login",
                  message: `A new device "${data.deviceName}" logged into your account from ${data.location || "Unknown Location"}.`,
                  type: "alert",
                  category: "Security",
                })
              }
            }
            break
        }
      }
    })

    const unsubscribeActivity = realTimeSync.current.subscribe(DEVICE_ACTIVITY_KEY, (data) => {
      if (data && data.id) {
        setDeviceActivities((prev) => {
          if (prev.find((a) => a.id === data.id)) return prev
          return [data, ...prev].slice(0, 100)
        })
      }
    })

    return () => {
      unsubscribeDevices()
      unsubscribeActivity()
    }
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

  // Update current device activity periodically
  useEffect(() => {
    const updateCurrentDevice = () => {
      if (currentDeviceId) {
        const currentDevice = safeLinkedDevices.find((d) => d.id === currentDeviceId)
        if (currentDevice) {
          updateDevice?.(currentDeviceId, {
            lastActive: new Date().toISOString(),
            current: true,
          })
        }
      }
    }

    // Update immediately
    updateCurrentDevice()

    // Update every minute
    const interval = setInterval(updateCurrentDevice, 60000)
    return () => clearInterval(interval)
  }, [currentDeviceId, safeLinkedDevices, updateDevice])

  const handleRemoveDevice = useCallback(async (device: LinkedDevice) => {
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
        device: detectDeviceInfo().deviceName,
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

      setShowRemoveConfirm(false)
      setSelectedDevice(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out device. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [removeDevice, saveDeviceActivity, addActivity, toast])

  const handleSignOutAll = useCallback(async () => {
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
      const otherDevices = safeLinkedDevices.filter((d) => d.id !== currentDeviceId)
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
        device: detectDeviceInfo().deviceName,
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

      setShowSignOutAllConfirm(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out all devices. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [safeLinkedDevices, currentDeviceId, removeDevice, saveDeviceActivity, addActivity, toast])

  const handleRenameDevice = useCallback(() => {
    if (!selectedDevice || !newDeviceName.trim()) return

    updateDevice?.(selectedDevice.id, { name: newDeviceName.trim() })

    saveDeviceActivity({
      deviceId: selectedDevice.id,
      deviceName: selectedDevice.name,
      action: `Device renamed to "${newDeviceName.trim()}"`,
      timestamp: new Date().toISOString(),
      location: selectedDevice.location,
      success: true,
    })

    addActivity({
      action: `Renamed device: ${selectedDevice.name} to ${newDeviceName.trim()}`,
      device: detectDeviceInfo().deviceName,
      location: "Current Location",
    })

    realTimeSync.current.publish(DEVICES_SYNC_KEY, {
      action: "device_updated",
      deviceId: selectedDevice.id,
    })

    toast({
      title: "Device Renamed",
      description: `Device has been renamed to "${newDeviceName.trim()}".`,
    })

    setShowRenameDialog(false)
    setNewDeviceName("")
    setSelectedDevice(null)
  }, [selectedDevice, newDeviceName, updateDevice, saveDeviceActivity, addActivity, toast])

  const handleToggleTrust = useCallback((device: LinkedDevice) => {
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
      device: detectDeviceInfo().deviceName,
      location: "Current Location",
    })

    realTimeSync.current.publish(DEVICES_SYNC_KEY, {
      action: "device_updated",
      deviceId: device.id,
    })
  }, [appSettings?.trustedDevices, updateAppSettings, saveDeviceActivity, addActivity, toast])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedIp(text)
    setTimeout(() => setCopiedIp(null), 2000)
  }, [])

  const getDeviceIcon = (type: string, isCurrent: boolean) => {
    const className = `h-6 w-6 ${isCurrent ? "text-green-600" : "text-muted-foreground"}`
    switch (type) {
      case "mobile":
        return <Smartphone className={className} />
      case "tablet":
        return <Tablet className={className} />
      default:
        return <Monitor className={className} />
    }
  }

  const isDeviceTrusted = (deviceId: string) => {
    return appSettings?.trustedDevices?.some((d) => d.id === deviceId) || false
  }

  const getActivityIcon = (action: string, success: boolean) => {
    if (!success) return <XCircle className="h-4 w-4 text-red-500" />
    if (action.includes("signed out") || action.includes("removed")) return <LogOut className="h-4 w-4 text-orange-500" />
    if (action.includes("trusted")) return <ShieldCheck className="h-4 w-4 text-green-500" />
    if (action.includes("untrusted")) return <ShieldAlert className="h-4 w-4 text-yellow-500" />
    if (action.includes("renamed")) return <Edit className="h-4 w-4 text-blue-500" />
    return <Activity className="h-4 w-4 text-muted-foreground" />
  }

  const renderDevicesList = () => (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Wifi className="h-5 w-5 text-green-600" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <WifiOff className="h-5 w-5 text-red-600" />
              </div>
            )}
            <div>
              <p className="font-medium">{isOnline ? "Connected" : "Offline"}</p>
              <p className="text-sm text-muted-foreground">
                {safeLinkedDevices.length} device{safeLinkedDevices.length !== 1 ? "s" : ""} linked
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastSyncTime && (
              <span className="text-xs text-muted-foreground">
                Synced {formatDistanceToNow(lastSyncTime, { addSuffix: true })}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setLastSyncTime(new Date())
                toast({
                  title: "Synced",
                  description: "Device list has been refreshed.",
                })
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Devices List */}
      <Card className="p-4 space-y-4">
        {safeLinkedDevices.length === 0 ? (
          <div className="text-center py-8">
            <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No devices linked to your account</p>
          </div>
        ) : (
          safeLinkedDevices.map((device) => {
            const isCurrent = device.id === currentDeviceId || device.current
            const isTrusted = isDeviceTrusted(device.id)

            return (
              <div
                key={device.id}
                className={`p-4 border rounded-lg transition-all ${
                  isCurrent ? "border-green-300 bg-green-50/50" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => {
                      setSelectedDevice(device)
                      setShowDeviceDetails(true)
                    }}
                  >
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        isCurrent ? "bg-green-100" : "bg-muted"
                      }`}
                    >
                      {getDeviceIcon(device.type, isCurrent)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{device.name}</p>
                        {isCurrent && (
                          <Badge className="bg-green-500 text-xs shrink-0">Current</Badge>
                        )}
                        {isTrusted && (
                          <Badge variant="outline" className="text-xs border-blue-300 text-blue-600 shrink-0">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Trusted
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {device.browser} on {device.os}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {device.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {isCurrent
                            ? "Active now"
                            : formatDistanceToNow(new Date(device.lastActive), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedDevice(device)
                          setShowDeviceDetails(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedDevice(device)
                          setNewDeviceName(device.name)
                          setShowRenameDialog(true)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleTrust(device)}>
                        {isTrusted ? (
                          <>
                            <ShieldAlert className="h-4 w-4 mr-2" />
                            Remove Trust
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Mark as Trusted
                          </>
                        )}
                      </DropdownMenuItem>
                      {!isCurrent && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => {
                              setSelectedDevice(device)
                              setShowRemoveConfirm(true)
                            }}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })
        )}
      </Card>

      {/* Sign Out All Button */}
      {safeLinkedDevices.filter((d) => d.id !== currentDeviceId && !d.current).length > 0 && (
        <Button
          variant="outline"
          className="w-full bg-transparent text-red-500 border-red-200 hover:bg-red-50"
          onClick={() => setShowSignOutAllConfirm(true)}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out All Other Devices
        </Button>
      )}

      {/* Security Tips */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Security Tips</p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                Review devices regularly and remove unknown ones
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                Only mark devices as trusted that you fully control
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                Enable login alerts for new device notifications
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderActivityLog = () => (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Recent Device Activity</h3>
          <Badge variant="outline">{deviceActivities.length} events</Badge>
        </div>

        {deviceActivities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {deviceActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {getActivityIcon(activity.action, activity.success)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.deviceName}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                      {activity.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {activity.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={activity.success ? "default" : "destructive"}
                    className="shrink-0 text-xs"
                  >
                    {activity.success ? "Success" : "Failed"}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-4">
      <Card className="p-4 space-y-4">
        <h3 className="font-medium">Device Security Settings</h3>

        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <Label className="font-medium">Login Alerts</Label>
            <p className="text-sm text-muted-foreground">
              Get notified when a new device logs into your account
            </p>
          </div>
          <Switch
            checked={appSettings?.loginAlerts || false}
            onCheckedChange={(checked) => updateAppSettings?.({ loginAlerts: checked })}
          />
        </div>

        <div className="flex items-center justify-between py-3 border-b">
          <div>
            <Label className="font-medium">Require 2FA for New Devices</Label>
            <p className="text-sm text-muted-foreground">
              Always require verification when logging in from a new device
            </p>
          </div>
          <Switch
            checked={appSettings?.twoFactorAuth || false}
            onCheckedChange={(checked) => updateAppSettings?.({ twoFactorAuth: checked })}
          />
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <Label className="font-medium">Auto Sign-Out Inactive Devices</Label>
            <p className="text-sm text-muted-foreground">
              Automatically sign out devices inactive for 30+ days
            </p>
          </div>
          <Switch
            checked={appSettings?.autoLockEnabled || false}
            onCheckedChange={(checked) => updateAppSettings?.({ autoLockEnabled: checked })}
          />
        </div>
      </Card>

      {/* Trusted Devices */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Trusted Devices</h3>
          <Badge variant="outline">
            {appSettings?.trustedDevices?.length || 0} trusted
          </Badge>
        </div>

        {!appSettings?.trustedDevices?.length ? (
          <div className="text-center py-6">
            <ShieldCheck className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No trusted devices</p>
            <p className="text-xs text-muted-foreground mt-1">
              Mark devices as trusted to skip 2FA verification
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {appSettings.trustedDevices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">{device.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Trusted since {format(new Date(device.lastUsed), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => {
                    const linkedDevice = safeLinkedDevices.find((d) => d.id === device.id)
                    if (linkedDevice) {
                      handleToggleTrust(linkedDevice)
                    } else {
                      // Remove from trusted list directly if device not in linked devices
                      const updated = appSettings.trustedDevices?.filter((d) => d.id !== device.id) || []
                      updateAppSettings?.({ trustedDevices: updated })
                      toast({
                        title: "Device Removed",
                        description: "Device has been removed from trusted list.",
                      })
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )

  return (
    <div className="pb-24 space-y-6 touch-pan-y overscroll-contain">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">Linked Devices</h2>
          <p className="text-sm text-muted-foreground">
            Manage devices connected to your account
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Badge variant="outline" className="border-green-300 text-green-600">
              <Signal className="h-3 w-3 mr-1" />
              Live
            </Badge>
          ) : (
            <Badge variant="outline" className="border-red-300 text-red-600">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Devices
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="mt-4">
          {renderDevicesList()}
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          {renderActivityLog()}
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          {renderSettings()}
        </TabsContent>
      </Tabs>

      {/* Device Details Dialog */}
      <Dialog open={showDeviceDetails} onOpenChange={setShowDeviceDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDevice && getDeviceIcon(selectedDevice.type, selectedDevice.current || selectedDevice.id === currentDeviceId)}
              {selectedDevice?.name}
            </DialogTitle>
            <DialogDescription>
              Device details and session information
            </DialogDescription>
          </DialogHeader>

          {selectedDevice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Browser</Label>
                  <p className="font-medium">{selectedDevice.browser}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Operating System</Label>
                  <p className="font-medium">{selectedDevice.os}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Location</Label>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedDevice.location}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Last Active</Label>
                  <p className="font-medium">
                    {selectedDevice.current || selectedDevice.id === currentDeviceId
                      ? "Now"
                      : formatDistanceToNow(new Date(selectedDevice.lastActive), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {selectedDevice.ip && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">IP Address</Label>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                      {selectedDevice.ip}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(selectedDevice.ip!)}
                    >
                      {copiedIp === selectedDevice.ip ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                {(selectedDevice.current || selectedDevice.id === currentDeviceId) && (
                  <Badge className="bg-green-500">Current Device</Badge>
                )}
                {isDeviceTrusted(selectedDevice.id) && (
                  <Badge variant="outline" className="border-blue-300 text-blue-600">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Trusted
                  </Badge>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (selectedDevice) {
                  setNewDeviceName(selectedDevice.name)
                  setShowDeviceDetails(false)
                  setShowRenameDialog(true)
                }
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Rename
            </Button>
            {selectedDevice && !(selectedDevice.current || selectedDevice.id === currentDeviceId) && (
              <Button
                variant="destructive"
                onClick={() => {
                  setShowDeviceDetails(false)
                  setShowRemoveConfirm(true)
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Device</DialogTitle>
            <DialogDescription>
              Give this device a custom name to easily identify it
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="device-name">Device Name</Label>
              <Input
                id="device-name"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="Enter device name"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameDevice} disabled={!newDeviceName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Device Confirmation */}
      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out Device?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign out "{selectedDevice?.name}" from your account. They will need to log in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedDevice && handleRemoveDevice(selectedDevice)}
              disabled={isLoading}
            >
              {isLoading ? "Signing out..." : "Sign Out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sign Out All Confirmation */}
      <AlertDialog open={showSignOutAllConfirm} onOpenChange={setShowSignOutAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out All Other Devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign out {safeLinkedDevices.filter((d) => d.id !== currentDeviceId && !d.current).length} device(s) from your account. Each device will need to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleSignOutAll}
              disabled={isLoading}
            >
              {isLoading ? "Signing out..." : "Sign Out All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
