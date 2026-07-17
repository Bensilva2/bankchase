'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import { ArrowLeft, Bell, Lock, Globe, Moon, Save, AlertCircle, Zap } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  marketingEmails: boolean
  paperStatements: boolean
  soundAlerts: boolean
  transactionAlerts: boolean
  largeTransactionThreshold: number
  lowBalanceAlert: boolean
  lowBalanceAmount: number
}

interface AppSettings {
  notifications: NotificationSettings
  display: {
    darkMode: boolean
    theme: string
    showBalance: boolean
  }
  security: {
    autoLogout: boolean
    autoLogoutMinutes: number
    biometricLogin: boolean
    twoFactorEnabled: boolean
  }
  preferences: {
    language: string
    currency: string
    timezone: string
  }
}

function SettingsContent() {
  const { userId, isLoaded } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<AppSettings>({
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      marketingEmails: false,
      paperStatements: false,
      soundAlerts: true,
      transactionAlerts: true,
      largeTransactionThreshold: 500,
      lowBalanceAlert: true,
      lowBalanceAmount: 100,
    },
    display: {
      darkMode: false,
      theme: 'auto',
      showBalance: true,
    },
    security: {
      autoLogout: true,
      autoLogoutMinutes: 15,
      biometricLogin: true,
      twoFactorEnabled: false,
    },
    preferences: {
      language: 'English',
      currency: 'USD',
      timezone: 'America/New_York',
    },
  })

  // Fetch user settings
  useEffect(() => {
    if (!userId || !isLoaded) return

    const fetchSettings = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/user/settings?userId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          setSettings(data.settings || settings)
        }
      } catch (err) {
        console.error('[v0] Failed to fetch settings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [userId, isLoaded])

  const handleNotificationToggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }))
  }

  const handleNumberChange = (key: keyof NotificationSettings, value: number) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }))
  }

  const handleSelectChange = (category: string, key: string, value: string | number) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof AppSettings],
        [key]: value,
      },
    }))
  }

  const handleDisplayToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      display: {
        ...prev.display,
        [key]: !prev.display[key as keyof typeof prev.display],
      },
    }))
  }

  const handleSecurityToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: !prev.security[key as keyof typeof prev.security],
      },
    }))
  }

  const handleSecuritySelect = (key: string, value: number) => {
    setSettings((prev) => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: value,
      },
    }))
  }

  const handleSave = async () => {
    if (!userId) return

    setSaving(true)
    try {
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, settings }),
      })

      if (!response.ok) throw new Error('Failed to save settings')

      toast.success('Settings saved successfully!')
      setError(null)
    } catch (err) {
      console.error('[v0] Failed to save settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to save settings')
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (!isLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <Navigation />
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your preferences and notification settings</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 dark:text-red-200 font-medium">Error</p>
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Notifications Section */}
            <div className="bg-card border border-border rounded-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Bell className="w-6 h-6 text-blue-600" />
                Notifications
              </h2>

              <div className="space-y-4">
                {/* Email Notifications */}
                <ToggleOption
                  title="Email Notifications"
                  description="Receive updates via email"
                  checked={settings.notifications.emailNotifications}
                  onChange={() => handleNotificationToggle('emailNotifications')}
                />

                {/* SMS Notifications */}
                <ToggleOption
                  title="SMS Notifications"
                  description="Receive text messages for important alerts"
                  checked={settings.notifications.smsNotifications}
                  onChange={() => handleNotificationToggle('smsNotifications')}
                />

                {/* Push Notifications */}
                <ToggleOption
                  title="Push Notifications"
                  description="Receive browser notifications"
                  checked={settings.notifications.pushNotifications}
                  onChange={() => handleNotificationToggle('pushNotifications')}
                />

                {/* Transaction Alerts */}
                <div className="border-t border-border pt-4 mt-4">
                  <ToggleOption
                    title="Transaction Alerts"
                    description="Get notified about large transactions"
                    checked={settings.notifications.transactionAlerts}
                    onChange={() => handleNotificationToggle('transactionAlerts')}
                  />
                  
                  {settings.notifications.transactionAlerts && (
                    <div className="mt-4 ml-6 p-3 bg-muted/30 rounded-lg">
                      <label className="text-sm font-medium text-foreground block mb-2">
                        Alert for transactions over:
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">$</span>
                        <input
                          type="number"
                          value={settings.notifications.largeTransactionThreshold}
                          onChange={(e) => handleNumberChange('largeTransactionThreshold', parseInt(e.target.value))}
                          className="w-32 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Low Balance Alert */}
                <div className="border-t border-border pt-4 mt-4">
                  <ToggleOption
                    title="Low Balance Alert"
                    description="Be notified when balance falls below threshold"
                    checked={settings.notifications.lowBalanceAlert}
                    onChange={() => handleNotificationToggle('lowBalanceAlert')}
                  />

                  {settings.notifications.lowBalanceAlert && (
                    <div className="mt-4 ml-6 p-3 bg-muted/30 rounded-lg">
                      <label className="text-sm font-medium text-foreground block mb-2">
                        Alert when balance drops below:
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">$</span>
                        <input
                          type="number"
                          value={settings.notifications.lowBalanceAmount}
                          onChange={(e) => handleNumberChange('lowBalanceAmount', parseInt(e.target.value))}
                          className="w-32 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Sound Alerts */}
                <div className="border-t border-border pt-4 mt-4">
                  <ToggleOption
                    title="Sound Alerts"
                    description="Play sounds for important notifications"
                    checked={settings.notifications.soundAlerts}
                    onChange={() => handleNotificationToggle('soundAlerts')}
                  />
                </div>

                {/* Marketing Emails */}
                <div className="border-t border-border pt-4 mt-4">
                  <ToggleOption
                    title="Marketing Emails"
                    description="Promotional offers and product updates"
                    checked={settings.notifications.marketingEmails}
                    onChange={() => handleNotificationToggle('marketingEmails')}
                  />
                </div>

                {/* Paper Statements */}
                <div className="border-t border-border pt-4 mt-4">
                  <ToggleOption
                    title="Paper Statements"
                    description="Receive statements by mail"
                    checked={settings.notifications.paperStatements}
                    onChange={() => handleNotificationToggle('paperStatements')}
                  />
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-card border border-border rounded-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Lock className="w-6 h-6 text-green-600" />
                Security
              </h2>

              <div className="space-y-4">
                {/* Auto Logout */}
                <ToggleOption
                  title="Auto-Logout"
                  description="Automatically log out after inactivity"
                  checked={settings.security.autoLogout}
                  onChange={() => handleSecurityToggle('autoLogout')}
                />

                {settings.security.autoLogout && (
                  <div className="ml-6 p-3 bg-muted/30 rounded-lg">
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Auto-logout after (minutes)
                    </label>
                    <select
                      value={settings.security.autoLogoutMinutes}
                      onChange={(e) => handleSecuritySelect('autoLogoutMinutes', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-green-600"
                    >
                      <option value={5}>5 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                    </select>
                  </div>
                )}

                {/* Two-Factor Authentication */}
                <div className="border-t border-border pt-4 mt-4">
                  <ToggleOption
                    title="Two-Factor Authentication"
                    description="Add an extra layer of security to your account"
                    checked={settings.security.twoFactorEnabled}
                    onChange={() => handleSecurityToggle('twoFactorEnabled')}
                  />
                </div>

                {/* Biometric Login */}
                <div className="border-t border-border pt-4 mt-4">
                  <ToggleOption
                    title="Biometric Login"
                    description="Use fingerprint or face recognition"
                    checked={settings.security.biometricLogin}
                    onChange={() => handleSecurityToggle('biometricLogin')}
                  />
                </div>

                {/* Hide Balance */}
                <div className="border-t border-border pt-4 mt-4">
                  <ToggleOption
                    title="Hide Balance"
                    description="Don't display balance on home screen"
                    checked={!settings.display.showBalance}
                    onChange={() => handleDisplayToggle('showBalance')}
                  />
                </div>
              </div>
            </div>

            {/* Display Section */}
            <div className="bg-card border border-border rounded-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Moon className="w-6 h-6 text-purple-600" />
                Display
              </h2>

              <div className="space-y-4">
                <ToggleOption
                  title="Dark Mode"
                  description="Use dark theme throughout the app"
                  checked={settings.display.darkMode}
                  onChange={() => handleDisplayToggle('darkMode')}
                />

                {/* Theme Selection */}
                <div className="border-t border-border pt-4 mt-4">
                  <label className="text-sm font-medium text-foreground block mb-2">Theme</label>
                  <select
                    value={settings.display.theme}
                    onChange={(e) => handleSelectChange('display', 'theme', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="auto">Auto (System)</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Preferences Section */}
            <div className="bg-card border border-border rounded-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Globe className="w-6 h-6 text-orange-600" />
                Preferences
              </h2>

              <div className="space-y-4">
                {/* Language */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Language</label>
                  <select
                    value={settings.preferences.language}
                    onChange={(e) => handleSelectChange('preferences', 'language', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-600"
                  >
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                    <option>Chinese</option>
                    <option>Japanese</option>
                  </select>
                </div>

                {/* Currency */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Currency</label>
                  <select
                    value={settings.preferences.currency}
                    onChange={(e) => handleSelectChange('preferences', 'currency', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-600"
                  >
                    <option>USD - US Dollar</option>
                    <option>EUR - Euro</option>
                    <option>GBP - British Pound</option>
                    <option>CAD - Canadian Dollar</option>
                    <option>AUD - Australian Dollar</option>
                    <option>JPY - Japanese Yen</option>
                  </select>
                </div>

                {/* Timezone */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Timezone</label>
                  <select
                    value={settings.preferences.timezone}
                    onChange={(e) => handleSelectChange('preferences', 'timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-600"
                  >
                    <option>America/New_York</option>
                    <option>America/Chicago</option>
                    <option>America/Denver</option>
                    <option>America/Los_Angeles</option>
                    <option>Europe/London</option>
                    <option>Europe/Paris</option>
                    <option>Europe/Berlin</option>
                    <option>Asia/Tokyo</option>
                    <option>Australia/Sydney</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 justify-end">
              <Link href="/accounts">
                <button className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition">
                  Cancel
                </button>
              </Link>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function ToggleOption({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition">
      <div className="flex-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}
