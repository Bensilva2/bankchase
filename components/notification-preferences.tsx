'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useBanking } from '@/lib/banking-context'
import { useToast } from '@/hooks/use-toast'
import { Bell, DollarSign, AlertCircle, TrendingUp } from 'lucide-react'

export function NotificationPreferences() {
  const { appSettings, updateAppSettings } = useBanking()
  const { toast } = useToast()
  const [saved, setSaved] = useState(false)

  const settings = appSettings

  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    updateAppSettings({ [key]: value })
  }

  const handleThresholdChange = (key: string, value: number) => {
    updateAppSettings({ [key]: value })
  }

  const handleSave = () => {
    setSaved(true)
    toast({
      title: 'Preferences Saved',
      description: 'Your notification preferences have been updated.',
    })
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-8">
      {/* Transaction Alerts */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Transaction Alerts</h3>
            <p className="text-sm text-gray-600 mt-1">Get notified about large transactions</p>
          </div>
        </div>

        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="transactionAlerts"
              checked={settings.transactionAlerts}
              onCheckedChange={(c) => handleToggle('transactionAlerts', c as boolean)}
            />
            <Label htmlFor="transactionAlerts" className="cursor-pointer flex-1">
              Enable transaction alerts
            </Label>
          </div>

          {settings.transactionAlerts && (
            <div className="space-y-2 ml-6">
              <Label className="text-sm">Alert for transactions over:</Label>
              <div className="flex items-center gap-4">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  placeholder="500"
                  defaultValue={500}
                  onChange={(e) => handleThresholdChange('largeTransactionThreshold', Number(e.target.value))}
                  className="w-32"
                />
              </div>
              <p className="text-xs text-gray-500">You'll be notified for transactions exceeding this amount</p>
            </div>
          )}
        </div>
      </div>

      {/* Balance Alerts */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Balance Alerts</h3>
            <p className="text-sm text-gray-600 mt-1">Get notified when your balance is low</p>
          </div>
        </div>

        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="lowBalanceAlert"
              checked={settings.lowBalanceAlert}
              onCheckedChange={(c) => handleToggle('lowBalanceAlert', c as boolean)}
            />
            <Label htmlFor="lowBalanceAlert" className="cursor-pointer flex-1">
              Enable low balance alerts
            </Label>
          </div>

          {settings.lowBalanceAlert && (
            <div className="space-y-2 ml-6">
              <Label className="text-sm">Alert when balance drops below:</Label>
              <div className="flex items-center gap-4">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  placeholder="500"
                  defaultValue={500}
                  onChange={(e) => handleThresholdChange('balanceThreshold', Number(e.target.value))}
                  className="w-32"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bill Reminders */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Bill Reminders</h3>
            <p className="text-sm text-gray-600 mt-1">Get reminded before bills are due</p>
          </div>
        </div>

        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="billReminders"
              checked={settings.transactionAlerts}
              onCheckedChange={(c) => handleToggle('transactionAlerts', c as boolean)}
            />
            <Label htmlFor="billReminders" className="cursor-pointer flex-1">
              Enable bill reminders
            </Label>
          </div>

          {settings.transactionAlerts && (
            <div className="space-y-2 ml-6">
              <Label className="text-sm">Remind me this many days before due date:</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[3]}
                  onValueChange={(v) => handleThresholdChange('billReminderDays', v[0])}
                  min={1}
                  max={14}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-8 text-right">3 days</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Security Alerts */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Security Alerts</h3>
            <p className="text-sm text-gray-600 mt-1">Get notified about account security events</p>
          </div>
        </div>

        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="securityAlerts"
              checked={settings.loginAlerts}
              onCheckedChange={(c) => handleToggle('loginAlerts', c as boolean)}
            />
            <Label htmlFor="securityAlerts" className="cursor-pointer flex-1">
              New login alerts
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="2faAlerts"
              checked={settings.twoFactorAuth}
              onCheckedChange={(c) => handleToggle('twoFactorAuth', c as boolean)}
            />
            <Label htmlFor="2faAlerts" className="cursor-pointer flex-1">
              Two-factor authentication enabled
            </Label>
          </div>
        </div>
      </div>

      {/* Rewards Alerts */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Rewards Alerts</h3>
            <p className="text-sm text-gray-600 mt-1">Get notified about earning rewards and offers</p>
          </div>
        </div>

        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="rewardAlerts"
              checked={settings.transactionAlerts}
              onCheckedChange={(c) => handleToggle('transactionAlerts', c as boolean)}
            />
            <Label htmlFor="rewardAlerts" className="cursor-pointer flex-1">
              Enable rewards notifications
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="offerAlerts"
              checked={settings.marketingEmails}
              onCheckedChange={(c) => handleToggle('marketingEmails', c as boolean)}
            />
            <Label htmlFor="offerAlerts" className="cursor-pointer flex-1">
              Personalized offers and promotions
            </Label>
          </div>
        </div>
      </div>

      {/* Notification Delivery */}
      <div className="border rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Notification Delivery</h3>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox
              id="pushNotifications"
              checked={settings.pushNotifications}
              onCheckedChange={(c) => handleToggle('pushNotifications', c as boolean)}
            />
            <Label htmlFor="pushNotifications" className="cursor-pointer">
              Push notifications
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="emailNotifications"
              checked={settings.emailNotifications}
              onCheckedChange={(c) => handleToggle('emailNotifications', c as boolean)}
            />
            <Label htmlFor="emailNotifications" className="cursor-pointer">
              Email notifications
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="smsAlerts"
              checked={settings.smsAlerts}
              onCheckedChange={(c) => handleToggle('smsAlerts', c as boolean)}
            />
            <Label htmlFor="smsAlerts" className="cursor-pointer">
              SMS text alerts
            </Label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <Button onClick={handleSave} className="flex-1">
          {saved ? 'Preferences Saved' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  )
}
