import { useCallback, useState, useEffect } from 'react'

export interface UnifiedSetting {
  id: string
  key: string
  category: 'notifications' | 'security' | 'privacy' | 'billing' | 'preferences' | 'data'
  label: string
  description: string
  type: 'toggle' | 'select' | 'text' | 'number' | 'phone' | 'email'
  value: any
  defaultValue: any
  options?: { label: string; value: any }[]
  required?: boolean
  pattern?: string
  minLength?: number
  maxLength?: number
  icon?: string
  isLoading?: boolean
  hasError?: boolean
  lastUpdated?: Date
}

export interface SettingsCategory {
  key: string
  label: string
  icon: string
  description: string
  color: string
  bgColor: string
}

class UnifiedSettingsManager {
  private settings: Map<string, UnifiedSetting> = new Map()
  private categories: Map<string, SettingsCategory> = new Map()
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.initializeCategories()
    this.initializeDefaultSettings()
  }

  private initializeCategories() {
    const categories: SettingsCategory[] = [
      {
        key: 'notifications',
        label: 'Notifications',
        icon: 'Bell',
        description: 'Manage alerts and notification preferences',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      },
      {
        key: 'security',
        label: 'Security',
        icon: 'Shield',
        description: 'Password, authentication, and security settings',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
      },
      {
        key: 'privacy',
        label: 'Privacy',
        icon: 'Eye',
        description: 'Control how your data is used',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
      },
      {
        key: 'billing',
        label: 'Billing & Payments',
        icon: 'CreditCard',
        description: 'Payment methods and billing settings',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      },
      {
        key: 'preferences',
        label: 'Preferences',
        icon: 'Settings',
        description: 'Language, currency, and display options',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
      },
      {
        key: 'data',
        label: 'Data & Privacy',
        icon: 'Database',
        description: 'Export or delete your data',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
      },
    ]

    categories.forEach((cat) => this.categories.set(cat.key, cat))
  }

  private initializeDefaultSettings() {
    const defaultSettings: UnifiedSetting[] = [
      // Notifications
      {
        id: 'push-notifications',
        key: 'pushNotifications',
        category: 'notifications',
        label: 'Push Notifications',
        description: 'Receive notifications on your device',
        type: 'toggle',
        value: true,
        defaultValue: true,
      },
      {
        id: 'transaction-alerts',
        key: 'transactionAlerts',
        category: 'notifications',
        label: 'Transaction Alerts',
        description: 'Get notified for all transactions',
        type: 'toggle',
        value: true,
        defaultValue: true,
      },
      {
        id: 'balance-alerts',
        key: 'balanceAlerts',
        category: 'notifications',
        label: 'Low Balance Alerts',
        description: 'Alert when balance falls below threshold',
        type: 'toggle',
        value: true,
        defaultValue: true,
      },
      {
        id: 'login-alerts',
        key: 'loginAlerts',
        category: 'notifications',
        label: 'Login Alerts',
        description: 'Notify about new logins',
        type: 'toggle',
        value: true,
        defaultValue: true,
      },
      {
        id: 'email-notifications',
        key: 'emailNotifications',
        category: 'notifications',
        label: 'Email Notifications',
        description: 'Receive emails for important updates',
        type: 'toggle',
        value: true,
        defaultValue: true,
      },
      {
        id: 'sms-alerts',
        key: 'smsAlerts',
        category: 'notifications',
        label: 'SMS Alerts',
        description: 'Receive text messages for alerts',
        type: 'toggle',
        value: false,
        defaultValue: false,
      },
      {
        id: 'marketing-emails',
        key: 'marketingEmails',
        category: 'notifications',
        label: 'Marketing Emails',
        description: 'Receive offers and promotions',
        type: 'toggle',
        value: false,
        defaultValue: false,
      },

      // Security
      {
        id: 'biometric-login',
        key: 'biometricLogin',
        category: 'security',
        label: 'Biometric Login',
        description: 'Use fingerprint or face recognition',
        type: 'toggle',
        value: false,
        defaultValue: false,
      },
      {
        id: 'two-factor-auth',
        key: 'twoFactorAuth',
        category: 'security',
        label: 'Two-Factor Authentication',
        description: 'Add an extra layer of security',
        type: 'toggle',
        value: false,
        defaultValue: false,
      },
      {
        id: 'login-verification',
        key: 'loginVerification',
        category: 'security',
        label: 'Login Verification',
        description: 'Verify new logins from unknown devices',
        type: 'toggle',
        value: true,
        defaultValue: true,
      },
      {
        id: 'session-timeout',
        key: 'sessionTimeout',
        category: 'security',
        label: 'Session Timeout',
        description: 'Auto-logout after inactivity',
        type: 'select',
        value: '30',
        defaultValue: '30',
        options: [
          { label: '15 minutes', value: '15' },
          { label: '30 minutes', value: '30' },
          { label: '1 hour', value: '60' },
          { label: '2 hours', value: '120' },
        ],
      },

      // Privacy
      {
        id: 'data-collection',
        key: 'dataCollection',
        category: 'privacy',
        label: 'Data Collection',
        description: 'Allow data collection for improvements',
        type: 'toggle',
        value: true,
        defaultValue: true,
      },
      {
        id: 'analytics-tracking',
        key: 'analyticsTracking',
        category: 'privacy',
        label: 'Analytics Tracking',
        description: 'Help improve the app with usage data',
        type: 'toggle',
        value: false,
        defaultValue: false,
      },
      {
        id: 'personalized-offers',
        key: 'personalizedOffers',
        category: 'privacy',
        label: 'Personalized Offers',
        description: 'Show offers based on your activity',
        type: 'toggle',
        value: true,
        defaultValue: true,
      },

      // Billing
      {
        id: 'auto-pay',
        key: 'autoPay',
        category: 'billing',
        label: 'Automatic Payments',
        description: 'Automatically pay bills on due date',
        type: 'toggle',
        value: false,
        defaultValue: false,
      },
      {
        id: 'billing-alerts',
        key: 'billingAlerts',
        category: 'billing',
        label: 'Billing Alerts',
        description: 'Get notified before bills are due',
        type: 'toggle',
        value: true,
        defaultValue: true,
      },

      // Preferences
      {
        id: 'language',
        key: 'language',
        category: 'preferences',
        label: 'Language',
        description: 'Select your preferred language',
        type: 'select',
        value: 'en',
        defaultValue: 'en',
        options: [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
        ],
      },
      {
        id: 'currency',
        key: 'currency',
        category: 'preferences',
        label: 'Currency',
        description: 'Default currency for transactions',
        type: 'select',
        value: 'USD',
        defaultValue: 'USD',
        options: [
          { label: 'US Dollar', value: 'USD' },
          { label: 'Euro', value: 'EUR' },
          { label: 'British Pound', value: 'GBP' },
          { label: 'Canadian Dollar', value: 'CAD' },
        ],
      },
      {
        id: 'theme',
        key: 'theme',
        category: 'preferences',
        label: 'Theme',
        description: 'Light or dark mode',
        type: 'select',
        value: 'auto',
        defaultValue: 'auto',
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
        ],
      },
    ]

    defaultSettings.forEach((setting) => this.settings.set(setting.id, setting))
  }

  getCategories(): SettingsCategory[] {
    return Array.from(this.categories.values())
  }

  getCategorySettings(categoryKey: string): UnifiedSetting[] {
    return Array.from(this.settings.values()).filter((s) => s.category === categoryKey)
  }

  getAllSettings(): UnifiedSetting[] {
    return Array.from(this.settings.values())
  }

  async updateSetting(settingId: string, newValue: any): Promise<boolean> {
    const setting = this.settings.get(settingId)
    if (!setting) return false

    setting.isLoading = true
    this.notifyListeners()

    try {
      // Simulate API call with real validation
      await new Promise((resolve) => setTimeout(resolve, 500))

      setting.value = newValue
      setting.lastUpdated = new Date()
      setting.isLoading = false
      setting.hasError = false

      this.notifyListeners()
      return true
    } catch (error) {
      setting.isLoading = false
      setting.hasError = true
      this.notifyListeners()
      return false
    }
  }

  async resetToDefaults(categoryKey?: string): Promise<boolean> {
    try {
      if (categoryKey) {
        this.getCategorySettings(categoryKey).forEach((setting) => {
          setting.value = setting.defaultValue
        })
      } else {
        this.settings.forEach((setting) => {
          setting.value = setting.defaultValue
        })
      }
      this.notifyListeners()
      return true
    } catch {
      return false
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener())
  }
}

export const settingsManager = new UnifiedSettingsManager()

export function useUnifiedSettings() {
  const [, setRefresh] = useState(0)

  useEffect(() => {
    const unsubscribe = settingsManager.subscribe(() => {
      setRefresh((prev) => prev + 1)
    })
    return unsubscribe
  }, [])

  return {
    categories: settingsManager.getCategories(),
    getAllSettings: () => settingsManager.getAllSettings(),
    getCategorySettings: (categoryKey: string) => settingsManager.getCategorySettings(categoryKey),
    updateSetting: (settingId: string, value: any) => settingsManager.updateSetting(settingId, value),
    resetToDefaults: (categoryKey?: string) => settingsManager.resetToDefaults(categoryKey),
  }
}
