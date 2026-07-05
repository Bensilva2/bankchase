'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Smartphone,
  Fingerprint,
  Wifi,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Trash2,
  Toggle
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function PrivacySecurityPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [biometricsEnabled, setBiometricsEnabled] = useState(false)
  const [dataSharing, setDataSharing] = useState(false)
  const [locationTracking, setLocationTracking] = useState(false)
  const [httpsOnly, setHttpsOnly] = useState(true)
  const [showPasswords, setShowPasswords] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a4fa6] to-[#003087]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-border"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#0a4fa6] hover:underline mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-[#0a4fa6]" />
            <h1 className="text-4xl font-bold text-foreground">Privacy & Security</h1>
          </div>
          <p className="text-muted-foreground">Manage your account security, data privacy, and authentication methods</p>
        </div>

        {/* Security Status Overview */}
        <Card className="bg-background shadow-lg border-0 mb-8 p-6">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-foreground">Account Security Status</h3>
              <p className="text-muted-foreground text-sm mt-2">
                Your account is protected with industry-leading security measures. Enable additional features 
                below to enhance your protection.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="bg-green-100 text-green-800 border-0">HTTPS Enabled</Badge>
                <Badge className="bg-green-100 text-green-800 border-0">Encryption Active</Badge>
                <Badge className={twoFactorEnabled ? 'bg-green-100 text-green-800 border-0' : 'bg-yellow-100 text-yellow-800 border-0'}>
                  {twoFactorEnabled ? '2FA Enabled' : '2FA Disabled'}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Settings Tabs */}
        <Tabs defaultValue="authentication" className="space-y-6">
          <TabsList className="bg-background border shadow-sm w-full justify-start overflow-x-auto">
            <TabsTrigger value="authentication" className="gap-2">
              <Lock className="w-4 h-4" />
              Authentication
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Eye className="w-4 h-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2">
              <Smartphone className="w-4 h-4" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Download className="w-4 h-4" />
              Data
            </TabsTrigger>
          </TabsList>

          {/* Authentication Tab */}
          <TabsContent value="authentication" className="space-y-6">
            {/* Two-Factor Authentication */}
            <Card className="bg-background shadow-lg border-0 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Smartphone className="w-6 h-6 text-[#0a4fa6] mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">Two-Factor Authentication (2FA)</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Add an extra layer of security to your account by requiring a code from your phone in addition to your password.
                    </p>
                    <div className="mt-3">
                      <Badge className={twoFactorEnabled ? 'bg-green-100 text-green-800 border-0' : 'bg-background text-foreground border-0'}>
                        {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    twoFactorEnabled
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-card text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {twoFactorEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </Card>

            {/* Biometric Authentication */}
            <Card className="bg-background shadow-lg border-0 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Fingerprint className="w-6 h-6 text-[#0a4fa6] mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">Biometric Authentication</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Use your fingerprint or face recognition to quickly and securely access your account.
                    </p>
                    <div className="mt-3">
                      <Badge className={biometricsEnabled ? 'bg-green-100 text-green-800 border-0' : 'bg-background text-foreground border-0'}>
                        {biometricsEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setBiometricsEnabled(!biometricsEnabled)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    biometricsEnabled
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-card text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {biometricsEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </Card>

            {/* Password Management */}
            <Card className="bg-background shadow-lg border-0 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Lock className="w-6 h-6 text-[#0a4fa6] mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">Password Management</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Update your password regularly to maintain account security.
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Last changed: 45 days ago</span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Recommended to change soon</span>
                    </div>
                  </div>
                </div>
                <Button className="bg-[#0a4fa6] hover:bg-[#003087]">Change Password</Button>
              </div>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            {/* Data Sharing */}
            <Card className="bg-background shadow-lg border-0 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Eye className="w-6 h-6 text-[#0a4fa6] mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">Data Sharing</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Control whether your transaction data is shared with partners for personalized offers and insights.
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <li>• Marketing partners for personalized offers</li>
                      <li>• Affiliate services and third-party integrations</li>
                      <li>• Analytics providers for usage insights</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => setDataSharing(!dataSharing)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    dataSharing
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-card text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {dataSharing ? 'Disable' : 'Enable'}
                </button>
              </div>
            </Card>

            {/* Location Tracking */}
            <Card className="bg-background shadow-lg border-0 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Wifi className="w-6 h-6 text-[#0a4fa6] mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">Location Services</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Allow the app to use your location for fraud detection, ATM finder, and branch locator features.
                    </p>
                    <div className="mt-3">
                      <Badge className={locationTracking ? 'bg-card text-blue-800 border-0' : 'bg-background text-foreground border-0'}>
                        {locationTracking ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setLocationTracking(!locationTracking)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    locationTracking
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-card text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {locationTracking ? 'Disable' : 'Enable'}
                </button>
              </div>
            </Card>

            {/* HTTPS & Encryption */}
            <Card className="bg-background shadow-lg border-0 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Shield className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">Encrypted Connection Only</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Require all connections to use HTTPS encryption. This protects your data from interception.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 border-0">Always On</Badge>
                      <span className="text-xs text-muted-foreground">This setting cannot be disabled for security</span>
                    </div>
                  </div>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              </div>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <div className="space-y-4">
              {/* Current Session */}
              <Card className="bg-background shadow-lg border-0 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Smartphone className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">Current Session</h3>
                        <Badge className="bg-green-100 text-green-800 border-0">Active</Badge>
                      </div>
                      <p className="text-muted-foreground text-sm mt-1">Chrome on macOS</p>
                      <div className="mt-3 text-xs text-muted-foreground space-y-1">
                        <p>IP Address: 203.0.113.42</p>
                        <p>Location: San Francisco, CA</p>
                        <p>Last Active: Just now</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Other Sessions */}
              <Card className="bg-background shadow-lg border-0 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Smartphone className="w-6 h-6 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">Mobile App</h3>
                      <p className="text-muted-foreground text-sm mt-1">Safari on iPhone</p>
                      <div className="mt-3 text-xs text-muted-foreground space-y-1">
                        <p>IP Address: 203.0.113.99</p>
                        <p>Location: San Francisco, CA</p>
                        <p>Last Active: 2 hours ago</p>
                      </div>
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200 text-sm">
                    Sign Out
                  </button>
                </div>
              </Card>

              {/* Sign Out All */}
              <div className="mt-6 p-4 bg-background border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Sign Out All Sessions</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      Sign out from all devices. You&apos;ll need to log in again on each device.
                    </p>
                  </div>
                  <Button className="ml-auto bg-primary hover:bg-primary text-background">
                    Sign Out All
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-6">
            {/* Download Data */}
            <Card className="bg-background shadow-lg border-0 p-6">
              <div className="flex items-start gap-4">
                <Download className="w-6 h-6 text-[#0a4fa6] mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">Download Your Data</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Download a copy of all your personal data, transactions, and account information in a portable format (JSON/CSV).
                  </p>
                  <div className="mt-4 p-4 bg-background rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground mb-3">Select the data you want to download:</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4" />
                        <span className="text-sm text-foreground">Personal Information</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4" />
                        <span className="text-sm text-foreground">Transaction History</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4" />
                        <span className="text-sm text-foreground">Account Details</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4" />
                        <span className="text-sm text-foreground">Login History & Security Logs</span>
                      </label>
                    </div>
                  </div>
                  <Button className="mt-4 bg-[#0a4fa6] hover:bg-[#003087]">
                    <Download className="w-4 h-4 mr-2" />
                    Download Data
                  </Button>
                </div>
              </div>
            </Card>

            {/* Delete Account */}
            <Card className="bg-background shadow-lg border-0 p-6 border-l-4 border-l-red-600">
              <div className="flex items-start gap-4">
                <Trash2 className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">Delete Account</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <p className="text-sm text-red-600 font-semibold mt-3">
                    Warning: This will delete your account, close all accounts, and erase all transaction history.
                  </p>
                  <Button className="mt-4 bg-red-600 hover:bg-red-700 text-background">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Privacy Policy Footer */}
        <Card className="bg-background border border-blue-200 shadow-lg p-6 mt-8">
          <div className="flex items-start gap-4">
            <Shield className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Your Privacy Matters</h3>
              <p className="text-blue-800 text-sm mt-2">
                We are committed to protecting your privacy and security. Your data is encrypted and stored securely. 
                For more information, please review our <a href="#" className="underline font-semibold hover:text-blue-700">Privacy Policy</a> and 
                <a href="#" className="underline font-semibold hover:text-blue-700"> Terms of Service</a>.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
