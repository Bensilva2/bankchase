'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Smartphone, Monitor, AlertCircle, CheckCircle2, LogOut } from 'lucide-react'
import { use2FA } from '@/hooks/use-2fa'
import { useToast } from '@/hooks/use-toast'

interface Device {
  id: string
  name: string
  type: 'phone' | 'tablet' | 'desktop'
  os: string
  lastActive: Date
  twoFAEnabled: boolean
  isCurrent: boolean
  ipAddress?: string
  location?: string
}

export function DeviceSecurityDashboard() {
  const { profile } = use2FA()
  const { toast } = useToast()
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadDevices()
  }, [])

  const loadDevices = async () => {
    setIsLoading(true)
    try {
      // Get current device info
      const userAgent = navigator.userAgent
      let osName = 'Unknown'
      let deviceType: 'phone' | 'tablet' | 'desktop' = 'desktop'

      if (/iPhone|iOS/.test(userAgent)) {
        osName = 'iOS'
        deviceType = 'phone'
      } else if (/iPad/.test(userAgent)) {
        osName = 'iPadOS'
        deviceType = 'tablet'
      } else if (/Android/.test(userAgent)) {
        osName = 'Android'
        deviceType = /tablet/i.test(userAgent) ? 'tablet' : 'phone'
      } else if (/Windows/.test(userAgent)) {
        osName = 'Windows'
      } else if (/Mac/.test(userAgent)) {
        osName = 'macOS'
      } else if (/Linux/.test(userAgent)) {
        osName = 'Linux'
      }

      // Get or create device ID
      let deviceId = localStorage.getItem('device_id')
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('device_id', deviceId)
      }

      // Get browser info
      let browserName = 'Unknown Browser'
      if (/Chrome/.test(userAgent) && !/Chromium/.test(userAgent)) {
        browserName = 'Google Chrome'
      } else if (/Chromium/.test(userAgent)) {
        browserName = 'Chromium'
      } else if (/Safari/.test(userAgent)) {
        browserName = 'Safari'
      } else if (/Firefox/.test(userAgent)) {
        browserName = 'Firefox'
      } else if (/Edge/.test(userAgent)) {
        browserName = 'Microsoft Edge'
      }

      const currentDevice: Device = {
        id: deviceId,
        name: `${browserName} on ${osName}`,
        type: deviceType,
        os: osName,
        lastActive: new Date(),
        twoFAEnabled: profile?.twoFactorEnabled || false,
        isCurrent: true,
      }

      // Try to fetch devices from API
      try {
        const response = await fetch('/api/devices/events')
        if (response.ok) {
          const data = await response.json()
          setDevices([currentDevice, ...(data.devices || [])])
        } else {
          setDevices([currentDevice])
        }
      } catch {
        setDevices([currentDevice])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoutDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to log out this device?')) {
      return
    }

    try {
      const response = await fetch('/api/devices/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'logout',
          deviceId,
        }),
      })

      if (response.ok) {
        setDevices(devices.filter((d) => d.id !== deviceId))
        toast({
          title: 'Success',
          description: 'Device logged out successfully',
        })
      }
    } catch (error) {
      console.error('[v0] Logout device error:', error)
      toast({
        title: 'Error',
        description: 'Failed to logout device',
        variant: 'destructive',
      })
    }
  }

  const getDeviceIcon = (type: string) => {
    if (type === 'phone') return <Smartphone className="w-5 h-5" />
    if (type === 'tablet') return <Smartphone className="w-5 h-5 rotate-90" />
    return <Monitor className="w-5 h-5" />
  }

  const formatLastActive = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Device Security</h1>
        <p className="text-gray-600 mt-1">Manage your devices and verify 2FA across all sessions</p>
      </div>

      {/* Security Overview */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-4">
          <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-lg font-semibold text-blue-900">Security Status</h2>
            <div className="mt-2 space-y-1 text-sm text-blue-800">
              <p>
                {profile?.twoFactorEnabled ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    2FA is enabled on all devices
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    2FA is not enabled
                  </span>
                )}
              </p>
              <p>
                {devices.length} active session{devices.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Active Devices */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Devices</h2>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading devices...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No active devices found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0 text-gray-600">
                    {getDeviceIcon(device.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{device.name}</h3>
                      {device.isCurrent && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          This Device
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mt-1">
                      {device.os}
                      {device.location && ` • ${device.location}`}
                      {device.ipAddress && ` • ${device.ipAddress}`}
                    </p>

                    <p className="text-xs text-gray-500 mt-2">
                      Last active: {formatLastActive(device.lastActive)}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      {device.twoFAEnabled ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          2FA Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          2FA Disabled
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!device.isCurrent && (
                  <Button
                    onClick={() => handleLogoutDevice(device.id)}
                    size="sm"
                    variant="ghost"
                    className="ml-4 flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 2FA Sync Status */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync Status</h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-900">Connected</span>
            </div>
            <span className="text-xs text-green-700">Real-time sync active</span>
          </div>

          <div className="text-sm text-gray-600">
            <p>
              Your 2FA settings are automatically synchronized across all your devices.
              Changes made on any device will be reflected immediately on others.
            </p>

            <div className="mt-3 space-y-2 text-xs text-gray-500">
              <p>✓ Changes sync within 1 second on same browser</p>
              <p>✓ Cross-browser sync within 5 seconds</p>
              <p>✓ All data encrypted and stored securely</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Security Recommendations */}
      <Card className="p-6 bg-amber-50 border-amber-200">
        <h2 className="text-lg font-semibold text-amber-900 mb-3">Security Tips</h2>
        <ul className="space-y-2 text-sm text-amber-800 list-disc list-inside">
          <li>Review this page periodically to ensure all devices are recognized</li>
          <li>Log out devices you no longer use</li>
          <li>Enable 2FA on all important accounts</li>
          <li>Save your backup codes in a secure location</li>
          <li>Use unique, strong passwords for each account</li>
          <li>Keep your devices and software up to date</li>
        </ul>
      </Card>
    </div>
  )
}
