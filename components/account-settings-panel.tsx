'use client'

import React, { useState, useCallback } from 'react'
import { useAccountSettings } from '@/lib/account-settings-sync'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bell,
  Lock,
  Eye,
  CreditCard,
  Database,
  ChevronLeft,
  Check,
  Clock,
  AlertCircle,
} from 'lucide-react'

interface AccountSettingsPanelProps {
  onBack?: () => void
  userId?: string
}

const CATEGORY_CONFIG = {
  notifications: {
    icon: Bell,
    label: 'Notifications',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  security: {
    icon: Lock,
    label: 'Security',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  privacy: {
    icon: Eye,
    label: 'Privacy',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  billing: {
    icon: CreditCard,
    label: 'Billing',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  data: {
    icon: Database,
    label: 'Data Management',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
}

export function AccountSettingsPanel({ onBack, userId }: AccountSettingsPanelProps) {
  const { settings, updateSetting, syncStatus, lastSyncTime } = useAccountSettings()
  const [activeCategory, setActiveCategory] = useState<
    'notifications' | 'security' | 'privacy' | 'billing' | 'data'
  >('notifications')
  const [showSyncInfo, setShowSyncInfo] = useState(false)

  const categorySettings = settings.filter((s) => s.category === activeCategory)
  const categoryConfig = CATEGORY_CONFIG[activeCategory]
  const CategoryIcon = categoryConfig.icon

  const handleSettingChange = useCallback(
    (settingId: string, newValue: boolean | string | number) => {
      updateSetting(settingId, newValue)
    },
    [updateSetting],
  )

  const getSyncStatusInfo = () => {
    if (syncStatus === 'syncing') {
      return {
        label: 'Syncing...',
        icon: Clock,
        color: 'text-amber-600',
      }
    }
    if (syncStatus === 'synced') {
      return {
        label: 'All settings synced',
        icon: Check,
        color: 'text-green-600',
      }
    }
    return {
      label: 'Pending sync',
      icon: AlertCircle,
      color: 'text-blue-600',
    }
  }

  const syncInfo = getSyncStatusInfo()
  const SyncIcon = syncInfo.icon

  return (
    <div className="pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 px-4 pt-4">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <h2 className="text-2xl font-semibold">Account Settings</h2>
      </div>

      {/* Sync Status Bar */}
      {showSyncInfo && (
        <Card className="mx-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-2 text-sm">
            <SyncIcon className={`h-4 w-4 ${syncInfo.color}`} />
            <span className="text-gray-700">{syncInfo.label}</span>
            {lastSyncTime && (
              <span className="text-xs text-gray-500 ml-auto">
                Last sync: {lastSyncTime.toLocaleTimeString()}
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Category Navigation */}
      <div className="px-4 space-y-2">
        {(Object.entries(CATEGORY_CONFIG) as [
          keyof typeof CATEGORY_CONFIG,
          (typeof CATEGORY_CONFIG)[keyof typeof CATEGORY_CONFIG],
        ][]).map(([categoryKey, config]) => {
          const Icon = config.icon
          const isActive = activeCategory === categoryKey
          const categoryCount = settings.filter((s) => s.category === categoryKey).length

          return (
            <button
              key={categoryKey}
              onClick={() => setActiveCategory(categoryKey)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-[#0a4fa6] text-white shadow-md'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  isActive ? 'bg-white/20' : 'bg-gray-200/50'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : config.color}`} />
              </div>
              <div className="flex-1 text-left">
                <p className={`font-medium ${isActive ? 'text-white' : ''}`}>{config.label}</p>
                <p className={`text-xs ${isActive ? 'text-white/70' : 'text-gray-500'}`}>
                  {categoryCount} settings
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Settings List */}
      <div className="px-4">
        <Card className={`divide-y ${categoryConfig.bgColor}`}>
          {categorySettings.length > 0 ? (
            categorySettings.map((setting) => (
              <div
                key={setting.id}
                className="p-4 last:border-0 hover:bg-white/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="font-medium cursor-pointer text-gray-900">
                        {setting.label}
                      </Label>
                      {setting.syncStatus === 'syncing' && (
                        <Clock className="h-3 w-3 text-amber-600 animate-spin" />
                      )}
                      {setting.syncStatus === 'synced' && (
                        <Check className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                  </div>

                  {/* Setting Control */}
                  <div className="min-w-fit">
                    {setting.type === 'toggle' && (
                      <Switch
                        checked={Boolean(setting.value)}
                        onCheckedChange={(checked) =>
                          handleSettingChange(setting.id, checked)
                        }
                        className="data-[state=checked]:bg-[#0a4fa6]"
                      />
                    )}

                    {setting.type === 'select' && setting.options && (
                      <Select
                        value={String(setting.value)}
                        onValueChange={(value) => handleSettingChange(setting.id, value)}
                      >
                        <SelectTrigger className="w-40 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {setting.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {setting.type === 'input' && (
                      <input
                        type="text"
                        value={String(setting.value)}
                        onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                        className="px-3 py-1 border rounded-md text-sm w-40"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>No settings in this category</p>
            </div>
          )}
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="px-4 space-y-2">
        <Button
          onClick={() => setShowSyncInfo(!showSyncInfo)}
          variant="outline"
          className="w-full"
        >
          {showSyncInfo ? 'Hide' : 'Show'} Sync Status
        </Button>

        <Button
          className="w-full bg-[#0a4fa6] hover:bg-[#083d80]"
          onClick={() => {
            const categoryLabel = CATEGORY_CONFIG[activeCategory].label
            alert(`${categoryLabel} settings have been saved and will sync in real-time.`)
          }}
        >
          Save & Sync Settings
        </Button>
      </div>

      {/* Info Text */}
      <div className="px-4 text-xs text-gray-500 text-center pb-4">
        <p>
          {syncStatus === 'syncing'
            ? 'Your settings are being synchronized across all devices...'
            : 'Settings auto-sync every 5 seconds'}
        </p>
        {lastSyncTime && (
          <p className="mt-1">Last sync: {lastSyncTime.toLocaleTimeString()}</p>
        )}
      </div>
    </div>
  )
}
