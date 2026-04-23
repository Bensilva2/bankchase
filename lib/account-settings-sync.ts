// Real-time Account Settings Synchronization Engine
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface AccountSetting {
  id: string
  category: 'notifications' | 'privacy' | 'security' | 'preferences' | 'billing' | 'data'
  key: string
  label: string
  description: string
  value: boolean | string | number
  type: 'toggle' | 'select' | 'input'
  options?: Array<{ value: string; label: string }>
  lastUpdated: Date
  syncStatus: 'synced' | 'syncing' | 'pending'
}

export interface AccountSettingsState {
  settings: AccountSetting[]
  preferences: {
    emailNotifications: boolean
    smsNotifications: boolean
    pushNotifications: boolean
    marketingEmails: boolean
    productUpdates: boolean
  }
  privacy: {
    showOnlineStatus: boolean
    allowSearchEngineIndexing: boolean
    shareActivityWithBank: boolean
    dataCollectionOptIn: boolean
  }
  security: {
    twoFactorEnabled: boolean
    loginAlerts: boolean
    deviceApproval: boolean
    sessionTimeout: number
    biometricEnabled: boolean
  }
  billing: {
    autoPayEnabled: boolean
    paymentMethod: string
    billingCycle: string
    paperless: boolean
    cardReplacement: boolean
  }
}

class AccountSettingsSyncEngine {
  private settings: Map<string, AccountSetting> = new Map()
  private syncQueue: AccountSetting[] = []
  private syncInProgress: boolean = false
  private lastSyncTime: Date | null = null
  private syncInterval: NodeJS.Timeout | null = null
  private listeners: Set<(settings: AccountSetting[]) => void> = new Set()

  constructor() {
    this.initializeDefaultSettings()
    this.startAutoSync()
  }

  private initializeDefaultSettings() {
    const defaultSettings: AccountSetting[] = [
      // Notifications
      {
        id: 'notif-email',
        category: 'notifications',
        key: 'emailNotifications',
        label: 'Email Notifications',
        description: 'Receive account updates via email',
        value: true,
        type: 'toggle',
        lastUpdated: new Date(),
        syncStatus: 'synced',
      },
      {
        id: 'notif-sms',
        category: 'notifications',
        key: 'smsNotifications',
        label: 'SMS Notifications',
        description: 'Receive critical alerts via SMS',
        value: true,
        type: 'toggle',
        lastUpdated: new Date(),
        syncStatus: 'synced',
      },
      {
        id: 'notif-push',
        category: 'notifications',
        key: 'pushNotifications',
        label: 'Push Notifications',
        description: 'Receive app notifications',
        value: true,
        type: 'toggle',
        lastUpdated: new Date(),
        syncStatus: 'synced',
      },
      {
        id: 'notif-marketing',
        category: 'notifications',
        key: 'marketingEmails',
        label: 'Marketing Emails',
        description: 'Receive promotional offers and deals',
        value: false,
        type: 'toggle',
        lastUpdated: new Date(),
        syncStatus: 'synced',
      },
      {
        id: 'notif-updates',
        category: 'notifications',
        key: 'productUpdates',
        label: 'Product Updates',
        description: 'Learn about new features',
        value: true,
        type: 'toggle',
        lastUpdated: new Date(),
        syncStatus: 'synced',
      },

      // Privacy
      {
        id: 'priv-online',
        category: 'privacy',
        key: 'showOnlineStatus',
        label: 'Show Online Status',
        description: 'Let contacts see when you are active',
        value: true,
        type: 'toggle',
        lastUpdated: new Date(),
        syncStatus: 'synced',
      },
      {
        id: 'priv-search',
        category: 'privacy',
        key: 'allowSearchEngineIndexing',
        label: 'Search Engine Indexing',
        description: 'Allow your profile to appear in search results',
        value: false,
        type: 'toggle',
        lastUpdated: new Date(),
        syncStatus: 'synced',
      },
      {
        id: 'priv-activity',
        category: 'privacy',
        key: 'shareActivityWithBank',
        label: 'Share Activity Data',
        description: 'Help improve Chase services by sharing usage data',
        value: true,
        type: 'toggle',
        lastUpdated: new Date(),
        syncStatus: 'synced',
      },
      {
        id: 'priv-data',
        category: 'privacy',
        key: 'dataCollectionOptIn',
        label: 'Data Collection',
        description: 'Allow analytics and personalization',
        value: true,
        type: 'toggle',
        lastUpdated: new Date(),
        syncStatus: 'synced',
      },

      // Security
      {
        id: 'sec-2fa',
        category: 'security',
        key: 'twoFactorEnabled',
        label: 'Two-Factor Authentication',
        description: 'Require verification code when signing in',
        value: true,
        type: 'toggle',
        lastUpdated: new Date(),
        syncStatus: 'synced',
      },
      {
        id: 'sec-alerts',
        category: 'security',
        key: 'loginAlerts',
        label: 'Login Alerts',
        description: 'Get notified of new device logins',
        value: true,
        type: 'toggle',
        lastUpdated: new Date(),
        syncStatus: 'synced',
      },
      {
        id: 'sec-device',
        category: 'security',
        key: 'deviceApproval',
        label: 'Device Approval',
        description: 'Require approval for new device signups',
        value: true,
        type: 'toggle',
        lastUpdated: new Date(),
        syncStatus: 'synced',
      },
      {
        id: 'sec-timeout',
        category: 'security',
        key: 'sessionTimeout',
        label: 'Session Timeout',
        description: 'Auto-logout duration in minutes',
        value: 15,
        type: 'select',
        options: [
          { value: '5', label: '5 minutes' },
          { value: '15', label: '15 minutes' },
          { value: '30', label: '30 minutes' },
          { value: '60', label: '1 hour' },
        ],
        lastUpdated: new Date(),
        syncStatus: 'synced',
      },
      {
        id: 'sec-biometric',
        category: 'security',
        key: 'biometricEnabled',
        label: 'Biometric Login',
        description: 'Use fingerprint or face ID to sign in',
        value: true,
        type: 'toggle',
        lastUpdated: new Date(),
        syncStatus: 'synced',
      },

      // Billing
      {
        id: 'bill-autopay',
        category: 'billing',
        key: 'autoPayEnabled',
        label: 'Auto Pay',
        description: 'Automatically pay bills on due date',
        value: false,
        type: 'toggle',
        lastUpdated: new Date(),
        syncStatus: 'synced',
      },
      {
        id: 'bill-cycle',
        category: 'billing',
        key: 'billingCycle',
        label: 'Billing Cycle',
        description: 'Select billing frequency',
        value: 'monthly',
        type: 'select',
        options: [
          { value: 'weekly', label: 'Weekly' },
          { value: 'biweekly', label: 'Bi-weekly' },
          { value: 'monthly', label: 'Monthly' },
          { value: 'quarterly', label: 'Quarterly' },
        ],
        lastUpdated: new Date(),
        syncStatus: 'synced',
      },
      {
        id: 'bill-paperless',
        category: 'billing',
        key: 'paperless',
        label: 'Paperless Statements',
        description: 'Receive digital statements only',
        value: true,
        type: 'toggle',
        lastUpdated: new Date(),
        syncStatus: 'synced',
      },
      {
        id: 'bill-replacement',
        category: 'billing',
        key: 'cardReplacement',
        label: 'Card Replacement',
        description: 'Auto-replace expiring cards',
        value: true,
        type: 'toggle',
        lastUpdated: new Date(),
        syncStatus: 'synced',
      },

      // Data Management
      {
        id: 'data-export',
        category: 'data',
        key: 'exportData',
        label: 'Data Export',
        description: 'Download your account data',
        value: false,
        type: 'toggle',
        lastUpdated: new Date(),
        syncStatus: 'synced',
      },
      {
        id: 'data-retention',
        category: 'data',
        key: 'dataRetention',
        label: 'Data Retention Period',
        description: 'How long to keep transaction history',
        value: '7years',
        type: 'select',
        options: [
          { value: '1year', label: '1 Year' },
          { value: '3years', label: '3 Years' },
          { value: '7years', label: '7 Years' },
          { value: 'indefinite', label: 'Indefinite' },
        ],
        lastUpdated: new Date(),
        syncStatus: 'synced',
      },
    ]

    defaultSettings.forEach((setting) => {
      this.settings.set(setting.id, setting)
    })
  }

  private startAutoSync() {
    this.syncInterval = setInterval(() => {
      this.syncSettings()
    }, 5000) // Sync every 5 seconds
  }

  public async updateSetting(
    settingId: string,
    newValue: boolean | string | number,
  ): Promise<AccountSetting | null> {
    const setting = this.settings.get(settingId)
    if (!setting) return null

    setting.value = newValue
    setting.syncStatus = 'pending'
    setting.lastUpdated = new Date()

    this.syncQueue.push(setting)
    this.notifyListeners()

    // Attempt to sync immediately
    await this.syncSettings()

    return setting
  }

  private async syncSettings() {
    if (this.syncInProgress || this.syncQueue.length === 0) return

    this.syncInProgress = true

    try {
      // Simulate cloud sync
      const settingsToSync = [...this.syncQueue]
      this.syncQueue = []

      // Update sync status
      settingsToSync.forEach((setting) => {
        setting.syncStatus = 'syncing'
      })
      this.notifyListeners()

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Mark as synced
      settingsToSync.forEach((setting) => {
        setting.syncStatus = 'synced'
      })

      this.lastSyncTime = new Date()
      this.notifyListeners()
    } catch (error) {
      console.error('Sync error:', error)
      // Keep settings in queue for retry
    } finally {
      this.syncInProgress = false
    }
  }

  public getSettings(category?: string): AccountSetting[] {
    if (!category) {
      return Array.from(this.settings.values())
    }
    return Array.from(this.settings.values()).filter((s) => s.category === category)
  }

  public getLastSyncTime(): Date | null {
    return this.lastSyncTime
  }

  public subscribe(listener: (settings: AccountSetting[]) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners() {
    const settings = Array.from(this.settings.values())
    this.listeners.forEach((listener) => listener(settings))
  }

  public destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    this.listeners.clear()
  }
}

// Singleton instance
let engineInstance: AccountSettingsSyncEngine | null = null

export function getAccountSettingsEngine(): AccountSettingsSyncEngine {
  if (!engineInstance) {
    engineInstance = new AccountSettingsSyncEngine()
  }
  return engineInstance
}

// React Hook for using account settings
export function useAccountSettings() {
  const [settings, setSettings] = useState<AccountSetting[]>([])
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle')
  const engineRef = useRef<AccountSettingsSyncEngine | null>(null)

  useEffect(() => {
    const engine = getAccountSettingsEngine()
    engineRef.current = engine

    // Load initial settings
    setSettings(engine.getSettings())

    // Subscribe to updates
    const unsubscribe = engine.subscribe((updatedSettings) => {
      setSettings(updatedSettings)
      const anyPending = updatedSettings.some((s) => s.syncStatus === 'pending')
      const anySyncing = updatedSettings.some((s) => s.syncStatus === 'syncing')
      setSyncStatus(anySyncing ? 'syncing' : anyPending ? 'idle' : 'synced')
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const updateSetting = useCallback(
    async (settingId: string, newValue: boolean | string | number) => {
      if (!engineRef.current) return
      await engineRef.current.updateSetting(settingId, newValue)
    },
    [],
  )

  const getSettingsByCategory = useCallback((category: string) => {
    return settings.filter((s) => s.category === (category as any))
  }, [settings])

  return {
    settings,
    updateSetting,
    getSettingsByCategory,
    syncStatus,
    lastSyncTime: engineRef.current?.getLastSyncTime() ?? null,
  }
}
