'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Lock, Shield, Bell, LogOut, Key, Smartphone } from 'lucide-react'

interface AuthSettings {
  email: string
  twoFactorEnabled: boolean
  loginAlerts: boolean
  sessionTimeout: number
  biometricEnabled: boolean
}

export function AuthenticationSettings() {
  const [settings, setSettings] = useState<AuthSettings>({
    email: 'demo@example.com',
    twoFactorEnabled: true,
    loginAlerts: true,
    sessionTimeout: 30,
    biometricEnabled: false,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const { toast } = useToast()

  const handleSettingChange = useCallback(
    async (key: keyof AuthSettings, value: any) => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/auth/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            setting: key,
            value,
            email: settings.email,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          toast({
            title: 'Error',
            description: data.error || 'Failed to update settings',
            variant: 'destructive',
          })
          return
        }

        setSettings((prev) => ({ ...prev, [key]: value }))
        toast({
          title: 'Success',
          description: 'Settings updated successfully',
        })
      } catch (error) {
        console.error('[v0] Settings update error:', error)
        toast({
          title: 'Error',
          description: 'Failed to update settings',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [settings.email, toast]
  )

  const handleChangePassword = useCallback(async () => {
    if (!currentPassword) {
      toast({
        title: 'Current Password Required',
        description: 'Please enter your current password',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-current',
          email: settings.email,
          password: currentPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: 'Verification Failed',
          description: 'Current password is incorrect',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Verified',
        description: 'Redirecting to password change...',
      })
      setShowPasswordForm(false)
    } catch (error) {
      console.error('[v0] Password verification error:', error)
      toast({
        title: 'Error',
        description: 'Verification failed',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentPassword, settings.email, toast])

  const handleLogoutAllDevices = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'logout-all',
          email: settings.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to logout from all devices',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'Logged out from all devices',
      })
    } catch (error) {
      console.error('[v0] Logout all error:', error)
      toast({
        title: 'Error',
        description: 'Failed to logout',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [settings.email, toast])

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Authentication Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account security and login preferences</p>
      </div>

      {/* Two-Factor Authentication */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-600 mt-1">
                Require a verification code in addition to your password when signing in
              </p>
            </div>
          </div>
          <Switch
            checked={settings.twoFactorEnabled}
            onCheckedChange={(checked) => handleSettingChange('twoFactorEnabled', checked)}
            disabled={isLoading}
          />
        </div>
      </Card>

      {/* Login Alerts */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Bell className="w-6 h-6 text-orange-600 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Login Alerts</h2>
              <p className="text-sm text-gray-600 mt-1">
                Get notified when your account is accessed from a new device
              </p>
            </div>
          </div>
          <Switch
            checked={settings.loginAlerts}
            onCheckedChange={(checked) => handleSettingChange('loginAlerts', checked)}
            disabled={isLoading}
          />
        </div>
      </Card>

      {/* Session Timeout */}
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <Lock className="w-6 h-6 text-red-600 mt-1" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Session Timeout</h2>
            <p className="text-sm text-gray-600 mt-1">
              Automatically log out after inactivity
            </p>
          </div>
        </div>
        <div className="ml-10">
          <div className="flex items-center gap-4">
            <select
              value={settings.sessionTimeout}
              onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
              disabled={isLoading}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={480}>8 hours</option>
            </select>
            <span className="text-sm text-gray-600">
              Current: {settings.sessionTimeout} minutes
            </span>
          </div>
        </div>
      </Card>

      {/* Biometric Authentication */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Smartphone className="w-6 h-6 text-green-600 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Biometric Login</h2>
              <p className="text-sm text-gray-600 mt-1">
                Use fingerprint or face recognition to sign in faster
              </p>
            </div>
          </div>
          <Switch
            checked={settings.biometricEnabled}
            onCheckedChange={(checked) => handleSettingChange('biometricEnabled', checked)}
            disabled={isLoading}
          />
        </div>
      </Card>

      {/* Change Password */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Key className="w-6 h-6 text-purple-600 mt-1" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
            <p className="text-sm text-gray-600 mt-1">
              Update your password regularly to keep your account secure
            </p>
            {!showPasswordForm ? (
              <Button
                onClick={() => setShowPasswordForm(true)}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
              >
                Change Password
              </Button>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="current-pwd" className="text-sm font-medium text-gray-700">
                    Current Password
                  </Label>
                  <Input
                    id="current-pwd"
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleChangePassword}
                    disabled={isLoading || !currentPassword}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Continue'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPasswordForm(false)
                      setCurrentPassword('')
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Logout All Devices */}
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-start gap-4">
          <LogOut className="w-6 h-6 text-red-600 mt-1" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Logout All Devices</h2>
            <p className="text-sm text-gray-600 mt-1">
              Sign out from all devices and locations. You'll need to log in again on each device.
            </p>
            <Button
              onClick={handleLogoutAllDevices}
              disabled={isLoading}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? 'Logging out...' : 'Logout All Devices'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Security Tips */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Security Tips</h3>
        <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
          <li>Use a strong, unique password with a mix of characters</li>
          <li>Enable two-factor authentication for additional protection</li>
          <li>Review login alerts and logout from unknown devices</li>
          <li>Change your password regularly (recommended: every 90 days)</li>
          <li>Never share your password or verification codes with anyone</li>
        </ul>
      </Card>
    </div>
  )
}
