'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { use2FA } from '@/hooks/use-2fa'
import { RealtimeTOTPGenerator } from '@/components/realtime-totp-generator'
import { TwoFactorSetup } from '@/components/two-factor-setup'
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Shield,
  X,
  Plus,
} from 'lucide-react'

interface DeviceInfo {
  id: string
  name: string
  lastUsed: string
  isCurrentDevice: boolean
}

export function TOTPDashboard() {
  const { profile, settings, toggle2FA, isLoading } = use2FA()
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [showDevices, setShowDevices] = useState(false)
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [backupCodesVisible, setBackupCodesVisible] = useState(false)
  const [currentCode, setCurrentCode] = useState<string>('')
  const [copiedCodeAt, setCopiedCodeAt] = useState<number | null>(null)
  const { toast } = useToast()

  const is2FAEnabled = profile?.twoFactorEnabled || settings?.twoFactorEnabled

  // Load devices on mount
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const response = await fetch('/api/auth/devices')
        if (response.ok) {
          const data = await response.json()
          setDevices(data.devices || [])
        }
      } catch (error) {
        console.error('[v0] Failed to load devices:', error)
      }
    }

    if (is2FAEnabled) {
      loadDevices()
    }
  }, [is2FAEnabled])

  const handleToggle2FA = async () => {
    await toggle2FA()
    if (!is2FAEnabled) {
      setShowBackupCodes(false)
    }
  }

  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to remove this device?')) {
      return
    }

    try {
      const response = await fetch('/api/auth/devices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      })

      if (response.ok) {
        setDevices(devices.filter(d => d.id !== deviceId))
        toast({
          title: 'Success',
          description: 'Device removed',
        })
      }
    } catch (error) {
      console.error('[v0] Failed to remove device:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove device',
        variant: 'destructive',
      })
    }
  }

  const handleCopyBackupCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCodeAt(Date.now())
    toast({
      title: 'Copied',
      description: 'Backup code copied',
      duration: 1000,
    })
    setTimeout(() => setCopiedCodeAt(null), 1000)
  }

  const backupCodes = profile?.totpBackupCodes || []
  const backupCodesCount = settings?.totpBackupCodesCount || backupCodes.length

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Two-Factor Authentication</h1>
        <p className="text-gray-600 mt-1">
          Protect your account with TOTP-based authentication
        </p>
      </div>

      {/* Status Card */}
      <Card className={`p-6 ${is2FAEnabled ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${
              is2FAEnabled
                ? 'bg-green-100'
                : 'bg-yellow-100'
            }`}>
              {is2FAEnabled ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              )}
            </div>
            <div className="flex-1">
              <h2 className={`text-lg font-semibold ${
                is2FAEnabled
                  ? 'text-green-900'
                  : 'text-yellow-900'
              }`}>
                {is2FAEnabled ? '2FA Enabled' : '2FA Disabled'}
              </h2>
              <p className={`text-sm mt-1 ${
                is2FAEnabled
                  ? 'text-green-700'
                  : 'text-yellow-700'
              }`}>
                {is2FAEnabled
                  ? 'Your account is protected with time-based authentication'
                  : 'Enable 2FA to add an extra layer of security to your account'}
              </p>
            </div>
          </div>

          <Switch
            checked={is2FAEnabled}
            onCheckedChange={handleToggle2FA}
            disabled={isLoading}
          />
        </div>
      </Card>

      {/* Setup Section */}
      {!is2FAEnabled && !show2FASetup && (
        <Button
          onClick={() => setShow2FASetup(true)}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Setup Two-Factor Authentication
        </Button>
      )}

      {/* Setup Component */}
      {show2FASetup && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setShow2FASetup(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <p className="text-sm text-gray-600">Setup new authenticator</p>
          </div>
          <TwoFactorSetup
            email={profile?.email || ''}
            onComplete={() => {
              setShow2FASetup(false)
              setShowBackupCodes(true)
            }}
            onCancel={() => setShow2FASetup(false)}
          />
        </div>
      )}

      {/* Active 2FA Section */}
      {is2FAEnabled && profile?.totpSecret && (
        <div className="space-y-6">
          {/* Current Code Generator */}
          <RealtimeTOTPGenerator
            secret={profile.totpSecret}
            deviceName="Current Device"
            onCodeGenerated={setCurrentCode}
          />

          {/* Backup Codes Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Backup Codes</h3>
                  <p className="text-sm text-gray-600">
                    {backupCodesCount} code{backupCodesCount !== 1 ? 's' : ''} available
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBackupCodes(!showBackupCodes)}
                className="p-2 text-gray-500 hover:text-gray-700 transition"
              >
                {showBackupCodes ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {backupCodesCount > 0 ? (
              <>
                {showBackupCodes ? (
                  <div className="space-y-2">
                    {backupCodes.slice(0, 5).map((code, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                      >
                        <span className="font-mono text-sm text-gray-700">{code}</span>
                        <button
                          onClick={() => handleCopyBackupCode(code)}
                          className="p-1 text-gray-500 hover:text-blue-600 transition"
                        >
                          {copiedCodeAt ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ))}
                    {backupCodes.length > 5 && (
                      <p className="text-xs text-gray-500 p-2 text-center">
                        +{backupCodes.length - 5} more codes
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Click the eye icon to view your backup codes. Keep them safe!
                    </p>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  size="sm"
                >
                  Generate New Backup Codes
                </Button>
              </>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-semibold">
                  ⚠️ No backup codes remaining
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Generate new ones immediately to ensure account recovery
                </p>
                <Button
                  className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  Generate Backup Codes Now
                </Button>
              </div>
            )}
          </Card>

          {/* Trusted Devices */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Trusted Devices</h3>
                  <p className="text-sm text-gray-600">
                    {devices.length} device{devices.length !== 1 ? 's' : ''} registered
                  </p>
                </div>
              </div>
            </div>

            {devices.length > 0 ? (
              <div className="space-y-3">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{device.name}</p>
                      <p className="text-sm text-gray-600">
                        Last used: {new Date(device.lastUsed).toLocaleDateString()}
                      </p>
                    </div>
                    {!device.isCurrentDevice && (
                      <button
                        onClick={() => handleRemoveDevice(device.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <p className="text-sm text-blue-800">No devices registered yet</p>
              </div>
            )}
          </Card>

          {/* Security Info */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">Security Tips</h3>
            <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
              <li>Your authenticator code changes every 30 seconds</li>
              <li>Save your backup codes in a secure location</li>
              <li>Each backup code can only be used once</li>
              <li>Store the QR code or secret key safely</li>
              <li>Codes are time-based and work offline</li>
            </ul>
          </Card>
        </div>
      )}
    </div>
  )
}
