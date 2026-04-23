"use client"

import { useState } from "react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Bell, Shield, Globe, ChevronRight, ChevronLeft, Download, Trash2 } from "lucide-react"
import { useBanking } from "@/lib/banking-context"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SettingsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type SettingsView = "main" | "notifications" | "security" | "preferences" | "data"

export function SettingsDrawer({ open, onOpenChange }: SettingsDrawerProps) {
  const [currentView, setCurrentView] = useState<SettingsView>("main")
  const [showClearDataDialog, setShowClearDataDialog] = useState(false)
  const { appSettings, updateAppSettings, exportData, clearAllData, addActivity } = useBanking()
  const { toast } = useToast()

  const handleExportData = () => {
    const data = exportData()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `chase-data-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({
      title: "Data Exported",
      description: "Your data has been downloaded",
    })
    addActivity({
      action: "Account data exported",
      device: "iPhone 15 Pro Max",
      location: "New York, NY",
    })
  }

  const handleClearData = () => {
    clearAllData()
    setShowClearDataDialog(false)
    toast({
      title: "Data Cleared",
      description: "All local data has been removed",
    })
  }

  const handleSettingChange = (key: string, value: boolean | string | number) => {
    updateAppSettings({ [key]: value })
    addActivity({
      action: `Setting changed: ${key}`,
      device: "iPhone 15 Pro Max",
      location: "New York, NY",
    })
  }

  const renderMainView = () => (
    <div className="space-y-4 p-4">
      {[
        { key: "notifications", label: "Notifications", desc: "Manage alerts and notifications", icon: Bell },
        { key: "security", label: "Security", desc: "Password, 2FA, and privacy", icon: Shield },
        { key: "preferences", label: "Preferences", desc: "Language, currency, and display", icon: Globe },
        { key: "data", label: "Data & Privacy", desc: "Export or delete your data", icon: Download },
      ].map((item) => (
        <Card
          key={item.key}
          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setCurrentView(item.key as SettingsView)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#0a4fa6]/10 flex items-center justify-center">
                <item.icon className="h-5 w-5 text-[#0a4fa6]" />
              </div>
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>
      ))}
    </div>
  )

  const renderNotificationsView = () => (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-lg font-semibold">Notifications</h3>
      </div>

      <Card className="p-4 space-y-4">
        <h4 className="font-medium text-[#0a4fa6]">Push Notifications</h4>
        {[
          { key: "pushNotifications", label: "Push Notifications", desc: "Receive notifications on your device" },
          { key: "transactionAlerts", label: "Transaction Alerts", desc: "Get notified for all transactions" },
          { key: "balanceAlerts", label: "Low Balance Alerts", desc: "Alert when balance is low" },
          { key: "loginAlerts", label: "Login Alerts", desc: "Notify about new logins" },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between py-2">
            <div>
              <Label className="font-medium">{item.label}</Label>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
            <Switch
              checked={appSettings?.[item.key as keyof typeof appSettings] as boolean}
              onCheckedChange={(checked) => handleSettingChange(item.key, checked)}
            />
          </div>
        ))}
      </Card>

      <Card className="p-4 space-y-4">
        <h4 className="font-medium text-[#0a4fa6]">Email & SMS</h4>
        {[
          { key: "emailNotifications", label: "Email Notifications", desc: "Receive emails for important updates" },
          { key: "smsAlerts", label: "SMS Alerts", desc: "Receive text messages for alerts" },
          { key: "marketingEmails", label: "Marketing Emails", desc: "Receive offers and promotions" },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between py-2">
            <div>
              <Label className="font-medium">{item.label}</Label>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
            <Switch
              checked={appSettings?.[item.key as keyof typeof appSettings] as boolean}
              onCheckedChange={(checked) => handleSettingChange(item.key, checked)}
            />
          </div>
        ))}
      </Card>

      {appSettings?.balanceAlerts && (
        <Card className="p-4 space-y-4">
          <h4 className="font-medium text-[#0a4fa6]">Balance Threshold</h4>
          <p className="text-sm text-muted-foreground">
            Alert when balance falls below ${appSettings.balanceThreshold || 100}
          </p>
          <Slider
            value={[appSettings.balanceThreshold || 100]}
            onValueChange={(value) => handleSettingChange("balanceThreshold", value[0])}
            max={1000}
            min={50}
            step={50}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$50</span>
            <span>$1,000</span>
          </div>
        </Card>
      )}
    </div>
  )

  const renderSecurityView = () => (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-lg font-semibold">Security</h3>
      </div>

      <Card className="p-4 space-y-4">
        <h4 className="font-medium text-[#0a4fa6]">Authentication</h4>
        <div className="flex items-center justify-between py-2">
          <div>
            <Label className="font-medium">Biometric Login</Label>
            <p className="text-sm text-muted-foreground">Use Face ID or Touch ID</p>
          </div>
          <Switch
            checked={appSettings?.biometricLogin}
            onCheckedChange={(checked) => handleSettingChange("biometricLogin", checked)}
          />
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <Label className="font-medium">Two-Factor Authentication</Label>
            <p className="text-sm text-muted-foreground">{appSettings?.twoFactorAuth ? "Enabled" : "Disabled"}</p>
          </div>
          <Badge variant={appSettings?.twoFactorAuth ? "default" : "secondary"}>
            {appSettings?.twoFactorAuth ? "Active" : "Off"}
          </Badge>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <h4 className="font-medium text-[#0a4fa6]">Quick Access</h4>
        <div className="flex items-center justify-between py-2">
          <div>
            <Label className="font-medium">Quick Balance</Label>
            <p className="text-sm text-muted-foreground">View balance without logging in</p>
          </div>
          <Switch
            checked={appSettings?.quickBalanceEnabled}
            onCheckedChange={(checked) => handleSettingChange("quickBalanceEnabled", checked)}
          />
        </div>
      </Card>
    </div>
  )

  const renderPreferencesView = () => (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-lg font-semibold">Preferences</h3>
      </div>

      <Card className="p-4 space-y-4">
        <h4 className="font-medium text-[#0a4fa6]">Display</h4>
        <div className="flex items-center justify-between py-2">
          <div>
            <Label className="font-medium">Dark Mode</Label>
            <p className="text-sm text-muted-foreground">Use dark theme</p>
          </div>
          <Switch
            checked={appSettings?.darkMode}
            onCheckedChange={(checked) => handleSettingChange("darkMode", checked)}
          />
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <h4 className="font-medium text-[#0a4fa6]">Regional</h4>
        <div className="space-y-4">
          <div>
            <Label className="font-medium">Language</Label>
            <Select
              value={appSettings?.language || "English"}
              onValueChange={(value) => handleSettingChange("language", value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Spanish">Spanish</SelectItem>
                <SelectItem value="French">French</SelectItem>
                <SelectItem value="Chinese">Chinese</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="font-medium">Currency</Label>
            <Select
              value={appSettings?.currency || "USD"}
              onValueChange={(value) => handleSettingChange("currency", value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR ($)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="JPY">JPY (¥)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <h4 className="font-medium text-[#0a4fa6]">Statements</h4>
        <div className="flex items-center justify-between py-2">
          <div>
            <Label className="font-medium">Paperless Statements</Label>
            <p className="text-sm text-muted-foreground">Receive statements electronically</p>
          </div>
          <Switch
            checked={appSettings?.paperlessStatements}
            onCheckedChange={(checked) => handleSettingChange("paperlessStatements", checked)}
          />
        </div>
      </Card>
    </div>
  )

  const renderDataView = () => (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView("main")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-lg font-semibold">Data & Privacy</h3>
      </div>

      <Card className="p-4 space-y-4">
        <h4 className="font-medium text-[#0a4fa6]">Your Data</h4>
        <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleExportData}>
          <Download className="h-4 w-4 mr-2" />
          Export My Data
        </Button>
        <p className="text-xs text-muted-foreground">
          Download a copy of your account data including transactions, messages, and settings.
        </p>
      </Card>

      <Card className="p-4 space-y-4 border-red-200">
        <h4 className="font-medium text-red-600">Danger Zone</h4>
        <Button variant="destructive" className="w-full justify-start" onClick={() => setShowClearDataDialog(true)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All Local Data
        </Button>
        <p className="text-xs text-muted-foreground">
          This will remove all locally stored data. Your actual bank account will not be affected.
        </p>
      </Card>

      <AlertDialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all locally stored data including settings, preferences, and cached
              information. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearData} className="bg-red-600 hover:bg-red-700">
              Clear Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle>Settings</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto pb-8">
          {currentView === "main" && renderMainView()}
          {currentView === "notifications" && renderNotificationsView()}
          {currentView === "security" && renderSecurityView()}
          {currentView === "preferences" && renderPreferencesView()}
          {currentView === "data" && renderDataView()}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
