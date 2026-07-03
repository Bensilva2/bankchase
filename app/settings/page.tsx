'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useBanking } from '@/lib/banking-context'
import { ArrowLeft, Bell, Lock, Eye, Globe, Moon, Volume2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { appSettings, updateAppSettings } = useBanking()
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    paperStatements: false,
    darkMode: false,
    autoLogout: true,
    autoLogoutMinutes: 15,
    language: 'English',
    currency: 'USD',
    timezone: 'America/New_York',
    biometricLogin: true,
    twoFactorEnabled: appSettings?.twoFactorEnabled || false,
    soundAlerts: true,
    showBalance: true,
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
    updateAppSettings?.({ ...settings, [key]: !settings[key as keyof typeof settings] })
  }

  const handleSelectChange = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
    updateAppSettings?.({ ...settings, [key]: value })
  }

  const handleNumberChange = (key: string, value: number) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
    updateAppSettings?.({ ...settings, [key]: value })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pb-8">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Customize your app preferences</p>
          </div>
        </div>

        {/* Notifications */}
        <Card className="p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            Notifications
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-gray-600 text-sm">Receive updates via email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={() => handleToggle('emailNotifications')}
              />
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition">
              <div>
                <p className="font-medium text-gray-900">SMS Notifications</p>
                <p className="text-gray-600 text-sm">Receive text messages</p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={() => handleToggle('smsNotifications')}
              />
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition">
              <div>
                <p className="font-medium text-gray-900">Push Notifications</p>
                <p className="text-gray-600 text-sm">Receive browser notifications</p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={() => handleToggle('pushNotifications')}
              />
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition">
              <div>
                <p className="font-medium text-gray-900">Marketing Emails</p>
                <p className="text-gray-600 text-sm">Promotional offers and updates</p>
              </div>
              <Switch
                checked={settings.marketingEmails}
                onCheckedChange={() => handleToggle('marketingEmails')}
              />
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition">
              <div>
                <p className="font-medium text-gray-900">Sound Alerts</p>
                <p className="text-gray-600 text-sm">Play sounds for important alerts</p>
              </div>
              <Switch
                checked={settings.soundAlerts}
                onCheckedChange={() => handleToggle('soundAlerts')}
              />
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card className="p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Lock className="w-6 h-6 text-blue-600" />
            Security
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition">
              <div>
                <p className="font-medium text-gray-900">Auto-logout</p>
                <p className="text-gray-600 text-sm">Automatically log out after inactivity</p>
              </div>
              <Switch
                checked={settings.autoLogout}
                onCheckedChange={() => handleToggle('autoLogout')}
              />
            </div>

            {settings.autoLogout && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-logout after (minutes)
                </label>
                <select
                  value={settings.autoLogoutMinutes}
                  onChange={(e) => handleNumberChange('autoLogoutMinutes', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
                >
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>
            )}

            <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition">
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-gray-600 text-sm">Add extra layer of security</p>
              </div>
              <Switch
                checked={settings.twoFactorEnabled}
                onCheckedChange={() => handleToggle('twoFactorEnabled')}
              />
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition">
              <div>
                <p className="font-medium text-gray-900">Biometric Login</p>
                <p className="text-gray-600 text-sm">Use fingerprint or face recognition</p>
              </div>
              <Switch
                checked={settings.biometricLogin}
                onCheckedChange={() => handleToggle('biometricLogin')}
              />
            </div>

            <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition">
              <div>
                <p className="font-medium text-gray-900">Hide Balance</p>
                <p className="text-gray-600 text-sm">Don&apos;t show balance on home screen</p>
              </div>
              <Switch
                checked={!settings.showBalance}
                onCheckedChange={() => handleToggle('showBalance')}
              />
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <Card className="p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600" />
            Preferences
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={settings.language}
                onChange={(e) => handleSelectChange('language', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
                <option>Chinese</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => handleSelectChange('currency', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                <option>USD - US Dollar</option>
                <option>EUR - Euro</option>
                <option>GBP - British Pound</option>
                <option>CAD - Canadian Dollar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => handleSelectChange('timezone', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                <option>America/New_York</option>
                <option>America/Chicago</option>
                <option>America/Denver</option>
                <option>America/Los_Angeles</option>
                <option>Europe/London</option>
                <option>Europe/Paris</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statement Delivery</label>
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={settings.paperStatements}
                  onChange={() => handleToggle('paperStatements')}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <label className="ml-3 cursor-pointer">
                  <p className="font-medium text-gray-900">Paper Statements</p>
                  <p className="text-gray-600 text-sm">Receive statements by mail</p>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Display */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Moon className="w-6 h-6 text-blue-600" />
            Display
          </h2>

          <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition">
            <div>
              <p className="font-medium text-gray-900">Dark Mode</p>
              <p className="text-gray-600 text-sm">Use dark theme for better visibility</p>
            </div>
            <Switch
              checked={settings.darkMode}
              onCheckedChange={() => handleToggle('darkMode')}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
