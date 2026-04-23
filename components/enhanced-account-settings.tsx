'use client'

import React, { useState, useCallback } from 'react'
import { useUnifiedSettings } from '@/lib/unified-settings-service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bell,
  Shield,
  Eye,
  CreditCard,
  Settings,
  Database,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface EnhancedAccountSettingsProps {
  onBack?: () => void
  userId?: string
}

const ICON_MAP: Record<string, any> = {
  Bell,
  Shield,
  Eye,
  CreditCard,
  Settings,
  Database,
}

export function EnhancedAccountSettings({ onBack, userId }: EnhancedAccountSettingsProps) {
  const { categories, getCategorySettings, updateSetting, resetToDefaults } = useUnifiedSettings()
  const [activeCategory, setActiveCategory] = useState('notifications')
  const [isResetting, setIsResetting] = useState(false)
  const { toast } = useToast()

  const categorySettings = getCategorySettings(activeCategory)
  const currentCategory = categories.find((c) => c.key === activeCategory)

  const handleSettingChange = useCallback(
    async (settingId: string, newValue: any) => {
      const success = await updateSetting(settingId, newValue)
      if (success) {
        toast({
          title: 'Setting Updated',
          description: 'Your preference has been saved',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update setting',
          variant: 'destructive',
        })
      }
    },
    [updateSetting, toast],
  )

  const handleResetCategory = useCallback(async () => {
    setIsResetting(true)
    const success = await resetToDefaults(activeCategory)
    setIsResetting(false)

    if (success) {
      toast({
        title: 'Reset Complete',
        description: `${currentCategory?.label} settings have been reset to defaults`,
      })
    }
  }, [activeCategory, resetToDefaults, currentCategory, toast])

  const renderSettingControl = (setting: any) => {
    const isLoading = setting.isLoading
    const hasError = setting.hasError

    switch (setting.type) {
      case 'toggle':
        return (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="font-medium">{setting.label}</Label>
              <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
            </div>
            <Switch
              checked={setting.value}
              onCheckedChange={(checked) => handleSettingChange(setting.id, checked)}
              disabled={isLoading}
            />
          </div>
        )

      case 'select':
        return (
          <div>
            <Label className="font-medium">{setting.label}</Label>
            <p className="text-xs text-muted-foreground mb-2">{setting.description}</p>
            <Select value={setting.value} onValueChange={(value) => handleSettingChange(setting.id, value)}>
              <SelectTrigger disabled={isLoading}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {setting.options?.map((opt: any) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'text':
      case 'email':
      case 'phone':
        return (
          <div>
            <Label className="font-medium">{setting.label}</Label>
            <p className="text-xs text-muted-foreground mb-2">{setting.description}</p>
            <Input
              type={setting.type === 'email' ? 'email' : setting.type === 'phone' ? 'tel' : 'text'}
              value={setting.value || ''}
              onChange={(e) => handleSettingChange(setting.id, e.target.value)}
              disabled={isLoading}
              placeholder={`Enter ${setting.label.toLowerCase()}`}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="pb-24 space-y-4 min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full hover:bg-gray-100 transition"
            title="Go back"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-[#0a4fa6]">Settings</h2>
          <p className="text-xs text-muted-foreground">{currentCategory?.description}</p>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="px-4 space-y-2">
        {categories.map((category) => {
          const Icon = ICON_MAP[category.icon]
          const isActive = activeCategory === category.key
          const catSettings = getCategorySettings(category.key)

          return (
            <button
              key={category.key}
              onClick={() => setActiveCategory(category.key)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all border-2 ${
                isActive
                  ? 'bg-[#0a4fa6]/10 border-[#0a4fa6]'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center transition ${
                  isActive ? `${category.bgColor}` : 'bg-gray-100'
                }`}
              >
                {Icon && <Icon className={`h-5 w-5 ${isActive ? category.color : 'text-gray-600'}`} />}
              </div>
              <div className="flex-1 text-left">
                <p className={`font-semibold ${isActive ? 'text-[#0a4fa6]' : 'text-foreground'}`}>
                  {category.label}
                </p>
                <p className="text-xs text-muted-foreground">{catSettings.length} options</p>
              </div>
              <ChevronRight className={`h-5 w-5 transition ${isActive ? 'text-[#0a4fa6]' : 'text-muted-foreground'}`} />
            </button>
          )
        })}
      </div>

      {/* Settings for Active Category */}
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{currentCategory?.label}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetCategory}
            disabled={isResetting}
            className="gap-2"
          >
            {isResetting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Reset
          </Button>
        </div>

        <div className="space-y-3">
          {categorySettings.length === 0 ? (
            <Card className="p-6 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No settings available in this category</p>
            </Card>
          ) : (
            categorySettings.map((setting) => (
              <Card
                key={setting.id}
                className={`p-4 transition border-2 ${
                  setting.hasError ? 'border-red-300 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="space-y-3">
                  {renderSettingControl(setting)}
                  {setting.isLoading && (
                    <div className="flex items-center gap-2 text-xs text-amber-600">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Updating...
                    </div>
                  )}
                  {setting.hasError && (
                    <div className="flex items-center gap-2 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      Failed to update. Please try again.
                    </div>
                  )}
                  {setting.lastUpdated && !setting.isLoading && !setting.hasError && (
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <Check className="h-3 w-3" />
                      Updated {setting.lastUpdated.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 pb-4">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-xs text-blue-800">
            Changes are saved automatically. All settings sync across your devices in real-time.
          </p>
        </Card>
      </div>
    </div>
  )
}
