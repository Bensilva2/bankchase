'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Bell, Mail, Phone, Smartphone, Save } from 'lucide-react'

interface NotificationPreferences {
  enableEmail: boolean
  enableSMS: boolean
  enablePush: boolean
  phoneNumber?: string
  emailAddress?: string
}

interface NotificationSettingsProps {
  userId: string
  email: string
}

export function NotificationSettings({ userId, email }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enableEmail: true,
    enableSMS: false,
    enablePush: true,
    emailAddress: email,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const { toast } = useToast()

  // Load preferences from database
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/notifications/preferences', {
          headers: { 'x-user-id': userId },
        })

        if (response.ok) {
          const data = await response.json()
          setPreferences({
            enableEmail: data.enable_email ?? true,
            enableSMS: data.enable_sms ?? false,
            enablePush: data.enable_push ?? true,
            phoneNumber: data.phone_number || '',
            emailAddress: data.email_address || email,
          })
        }
      } catch (error) {
        console.error('[v0] Failed to load preferences:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [userId, email])

  // Validate phone number
  const validatePhone = useCallback((phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (!phone.trim()) {
      setPhoneError(null)
      return true
    }
    if (cleanPhone.length < 10) {
      setPhoneError('Phone number must be at least 10 digits')
      return false
    }
    setPhoneError(null)
    return true
  }, [])

  // Save preferences
  const handleSavePreferences = useCallback(async () => {
    // Validate phone if SMS is enabled
    if (preferences.enableSMS && preferences.phoneNumber) {
      if (!validatePhone(preferences.phoneNumber)) {
        return
      }
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          enable_email: preferences.enableEmail,
          enable_sms: preferences.enableSMS,
          enable_push: preferences.enablePush,
          phone_number: preferences.phoneNumber || null,
          email_address: preferences.emailAddress,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }

      toast({
        title: 'Success',
        description: 'Notification preferences updated',
      })
    } catch (error) {
      console.error('[v0] Error saving preferences:', error)
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }, [preferences, userId, validatePhone, toast])

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-gray-500">Loading preferences...</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Transaction Alerts
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage how you receive notifications for your transactions
          </p>
        </div>

        {/* Email Notifications */}
        <div className="space-y-3 pb-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <Label className="text-base font-medium text-gray-900">Email Alerts</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Receive detailed transaction alerts via email
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.enableEmail}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, enableEmail: checked }))
              }
            />
          </div>

          {preferences.enableEmail && (
            <div className="ml-8 space-y-2">
              <Label htmlFor="email" className="text-sm text-gray-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={preferences.emailAddress || ''}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    emailAddress: e.target.value,
                  }))
                }
                placeholder="your@email.com"
              />
            </div>
          )}
        </div>

        {/* SMS Notifications */}
        <div className="space-y-3 pb-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-green-600 mt-1" />
              <div>
                <Label className="text-base font-medium text-gray-900">SMS Alerts</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Receive instant SMS alerts for every transaction
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.enableSMS}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, enableSMS: checked }))
              }
            />
          </div>

          {preferences.enableSMS && (
            <div className="ml-8 space-y-2">
              <Label htmlFor="phone" className="text-sm text-gray-700">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={preferences.phoneNumber || ''}
                onChange={(e) => {
                  setPreferences((prev) => ({
                    ...prev,
                    phoneNumber: e.target.value,
                  }))
                  if (e.target.value) {
                    validatePhone(e.target.value)
                  }
                }}
                placeholder="+1 (555) 000-0000"
              />
              {phoneError && <p className="text-sm text-red-600">{phoneError}</p>}
            </div>
          )}
        </div>

        {/* Push Notifications */}
        <div className="space-y-3 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-purple-600 mt-1" />
              <div>
                <Label className="text-base font-medium text-gray-900">Push Alerts</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Receive browser push notifications for transactions
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.enablePush}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, enablePush: checked }))
              }
            />
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSavePreferences}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>

        {/* Info Box */}
        <div className="border rounded-lg p-4">
          <p className="text-sm">
            We recommend enabling at least one alert method to stay informed about your transactions.
            All alerts are sent securely and immediately after a transaction is processed.
          </p>
        </div>
      </div>
    </Card>
  )
}
