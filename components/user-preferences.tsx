'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bell, Lock, Eye, DollarSign, Globe, Moon, Sun } from 'lucide-react'

interface UserPreferences {
  notificationsEnabled: boolean
  emailAlerts: boolean
  twoFactorEnabled: boolean
  monthlyBudgetLimit: number
  displayCurrency: string
  language: string
  theme: 'light' | 'dark' | 'system'
  privacyLevel: 'public' | 'private' | 'friends'
}

interface UserPreferencesProps {
  onSave?: (preferences: UserPreferences) => void
}

export function UserPreferencesPanel({ onSave }: UserPreferencesProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    notificationsEnabled: true,
    emailAlerts: true,
    twoFactorEnabled: false,
    monthlyBudgetLimit: 5000,
    displayCurrency: 'USD',
    language: 'English',
    theme: 'dark',
    privacyLevel: 'private',
  })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleToggle = (key: keyof UserPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: typeof prev[key] === 'boolean' ? !prev[key] : prev[key]
    }))
  }

  const handleChange = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setSaved(false)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      onSave?.(preferences)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Preferences & Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {/* Notifications Section */}
      <Card className="p-6 bg-card">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <div className="font-medium text-foreground">Push Notifications</div>
              <div className="text-sm text-muted-foreground">Receive alerts on your device</div>
            </div>
            <button
              onClick={() => handleToggle('notificationsEnabled')}
              className={`w-12 h-6 rounded-full transition-colors ${preferences.notificationsEnabled ? 'bg-primary' : 'bg-muted'}`}
              aria-pressed={preferences.notificationsEnabled}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${preferences.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <div className="font-medium text-foreground">Email Alerts</div>
              <div className="text-sm text-muted-foreground">Get daily summaries and alerts</div>
            </div>
            <button
              onClick={() => handleToggle('emailAlerts')}
              className={`w-12 h-6 rounded-full transition-colors ${preferences.emailAlerts ? 'bg-primary' : 'bg-muted'}`}
              aria-pressed={preferences.emailAlerts}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${preferences.emailAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </Card>

      {/* Security Section */}
      <Card className="p-6 bg-card">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Security</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <div className="font-medium text-foreground">Two-Factor Authentication</div>
              <div className="text-sm text-muted-foreground">Add extra security to your account</div>
            </div>
            <button
              onClick={() => handleToggle('twoFactorEnabled')}
              className={`w-12 h-6 rounded-full transition-colors ${preferences.twoFactorEnabled ? 'bg-primary' : 'bg-muted'}`}
              aria-pressed={preferences.twoFactorEnabled}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${preferences.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <Button variant="outline" className="w-full">Change Password</Button>
        </div>
      </Card>

      {/* Financial Preferences */}
      <Card className="p-6 bg-card">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Financial Preferences</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Monthly Budget Limit</label>
            <Input
              type="number"
              value={preferences.monthlyBudgetLimit}
              onChange={(e) => handleChange('monthlyBudgetLimit', parseFloat(e.target.value))}
              placeholder="5000"
              className="text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Display Currency</label>
            <select
              value={preferences.displayCurrency}
              onChange={(e) => handleChange('displayCurrency', e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm"
            >
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>CAD</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Appearance Settings */}
      <Card className="p-6 bg-card">
        <div className="flex items-center gap-3 mb-4">
          <Eye className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Appearance</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Theme</label>
            <div className="grid grid-cols-3 gap-3">
              {(['light', 'dark', 'system'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => handleChange('theme', t)}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 justify-center ${
                    preferences.theme === t ? 'border-primary bg-primary/10' : 'border-input'
                  }`}
                >
                  {t === 'light' && <Sun className="w-4 h-4" />}
                  {t === 'dark' && <Moon className="w-4 h-4" />}
                  {t === 'system' && <Globe className="w-4 h-4" />}
                  <span className="capitalize text-sm font-medium">{t}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Language</label>
            <select
              value={preferences.language}
              onChange={(e) => handleChange('language', e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm"
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Privacy Settings */}
      <Card className="p-6 bg-card">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Privacy</h3>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">Profile Visibility</label>
          <div className="space-y-2">
            {(['public', 'private', 'friends'] as const).map(level => (
              <label key={level} className="flex items-center p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition">
                <input
                  type="radio"
                  name="privacy"
                  value={level}
                  checked={preferences.privacyLevel === level}
                  onChange={(e) => handleChange('privacyLevel', e.target.value)}
                  className="w-4 h-4 text-primary"
                />
                <span className="ml-3 text-sm font-medium text-foreground capitalize">{level}</span>
              </label>
            ))}
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="flex-1"
          size="lg"
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </Button>
        {saved && <div className="flex items-center text-green-600 text-sm font-medium">Saved!</div>}
      </div>
    </div>
  )
}
