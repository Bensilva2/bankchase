'use client'

import { useState } from 'react'
import { Bell, Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface NotificationSetting {
  id: string
  label: string
  description: string
  enabled: boolean
}

const defaultSettings: NotificationSetting[] = [
  {
    id: 'transactions',
    label: 'Transaction Alerts',
    description: 'Get notified when you send or receive money',
    enabled: true,
  },
  {
    id: 'security',
    label: 'Security Alerts',
    description: 'Get notified of login attempts and security events',
    enabled: true,
  },
  {
    id: 'bill_pay',
    label: 'Bill Payment Reminders',
    description: 'Reminders for upcoming bill payments',
    enabled: true,
  },
  {
    id: 'offers',
    label: 'Offers & Promotions',
    description: 'Receive offers tailored to your account',
    enabled: false,
  },
  {
    id: 'balance',
    label: 'Low Balance Alerts',
    description: 'Alert when balance falls below $500',
    enabled: true,
  },
  {
    id: 'spending',
    label: 'Spending Insights',
    description: 'Weekly spending summary and insights',
    enabled: false,
  },
]

export function PushNotificationsSetup() {
  const [settings, setSettings] = useState<NotificationSetting[]>(defaultSettings)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleToggleSetting = (id: string) => {
    setSettings(settings.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ))
  }

  const handleEnablePushNotifications = async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.register('/sw.js')
        const permission = await Notification.requestPermission()
        
        if (permission === 'granted') {
          setPushEnabled(true)
          toast.success('Push notifications enabled')
        } else {
          toast.error('Permission denied for notifications')
        }
      } else {
        toast.error('Push notifications not supported in your browser')
      }
    } catch (error) {
      console.error('[v0] Push notification error:', error)
      toast.error('Failed to enable push notifications')
    }
  }

  const handleSavePreferences = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, pushEnabled }),
      })

      if (response.ok) {
        toast.success('Notification preferences saved')
      } else {
        toast.error('Failed to save preferences')
      }
    } catch (error) {
      console.error('[v0] Save preferences error:', error)
      toast.error('Error saving preferences')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Push Notifications Enable */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Push Notifications
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Receive real-time alerts on your device
            </p>
          </div>
          <button
            onClick={handleEnablePushNotifications}
            disabled={pushEnabled}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              pushEnabled
                ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
                : 'bg-primary hover:bg-primary/90 text-white'
            }`}
          >
            {pushEnabled ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Enabled
              </span>
            ) : (
              'Enable Push Notifications'
            )}
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Notification Preferences</h3>
        <div className="space-y-3">
          {settings.map(setting => (
            <div key={setting.id} className="flex items-start justify-between p-4 bg-background/50 rounded-lg hover:bg-background transition">
              <div className="flex-1">
                <p className="font-medium text-foreground">{setting.label}</p>
                <p className="text-sm text-muted-foreground mt-1">{setting.description}</p>
              </div>
              <button
                onClick={() => handleToggleSetting(setting.id)}
                disabled={!pushEnabled}
                className={`ml-4 relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  setting.enabled
                    ? 'bg-green-600 dark:bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                } ${!pushEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    setting.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <button
          onClick={handleSavePreferences}
          disabled={isSaving}
          className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white rounded-lg transition font-medium"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
        <button className="px-6 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition font-medium">
          Cancel
        </button>
      </div>
    </div>
  )
}
