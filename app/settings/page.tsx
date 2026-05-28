'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, Lock, Users, CreditCard, LogOut } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

interface SettingsTab {
  id: string
  label: string
  icon: React.ReactNode
  href: string
}

const settingsTabs: SettingsTab[] = [
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" />, href: '/settings/notifications' },
  { id: 'security', label: 'Security', icon: <Lock className="w-5 h-5" />, href: '/settings/security' },
  { id: 'accounts', label: 'Connected Accounts', icon: <Users className="w-5 h-5" />, href: '/settings/connected-accounts' },
  { id: 'payment', label: 'Payment Methods', icon: <CreditCard className="w-5 h-5" />, href: '/settings/payment-methods' },
]

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('notifications')

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <Navigation />
      
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-2xl p-4 sticky top-20">
              <nav className="space-y-2">
                {settingsTabs.map(tab => (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      activeTab === tab.id
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-background/50'
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.icon}
                    <span className="font-medium">{tab.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="border-t border-border mt-4 pt-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>

            {/* Profile Card */}
            <div className="bg-card border border-border rounded-2xl p-4 mt-4">
              <p className="text-xs text-muted-foreground mb-3">ACCOUNT</p>
              <div className="space-y-2">
                <p className="font-medium text-foreground">{user?.first_name || 'User'}</p>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-card border border-border rounded-2xl p-8">
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Notification Settings</h2>
                    <p className="text-muted-foreground">Manage how you receive alerts and updates</p>
                  </div>

                  <div className="space-y-4">
                    {/* Email Notifications */}
                    <div className="p-4 bg-background/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Email Notifications</p>
                          <p className="text-sm text-muted-foreground mt-1">Get updates via email</p>
                        </div>
                        <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                      </div>
                    </div>

                    {/* SMS Notifications */}
                    <div className="p-4 bg-background/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">SMS Notifications</p>
                          <p className="text-sm text-muted-foreground mt-1">Get urgent alerts via text</p>
                        </div>
                        <input type="checkbox" className="w-5 h-5 rounded" />
                      </div>
                    </div>

                    {/* In-App Notifications */}
                    <div className="p-4 bg-background/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">In-App Notifications</p>
                          <p className="text-sm text-muted-foreground mt-1">Get alerts within the app</p>
                        </div>
                        <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
                      </div>
                    </div>

                    {/* Push Notifications */}
                    <div className="p-4 bg-background/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Push Notifications</p>
                          <p className="text-sm text-muted-foreground mt-1">Get instant alerts on your device</p>
                        </div>
                        <Link
                          href="/settings/notifications/push"
                          className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90 transition"
                        >
                          Configure
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium">
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Security Settings</h2>
                    <p className="text-muted-foreground">Manage your security and privacy</p>
                  </div>
                  <p className="text-muted-foreground">Visit the <Link href="/settings/security" className="text-primary hover:underline">Security</Link> page to manage 2FA and biometric authentication.</p>
                </div>
              )}

              {activeTab === 'accounts' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Connected Accounts</h2>
                    <p className="text-muted-foreground">Link external bank accounts via Plaid</p>
                  </div>
                  <p className="text-muted-foreground">Visit the <Link href="/settings/connected-accounts" className="text-primary hover:underline">Connected Accounts</Link> page to manage external account connections.</p>
                </div>
              )}

              {activeTab === 'payment' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Payment Methods</h2>
                    <p className="text-muted-foreground">Manage your cards and transfer methods</p>
                  </div>
                  <p className="text-muted-foreground">Visit the <Link href="/cards" className="text-primary hover:underline">Cards</Link> page to manage your payment methods and card settings.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
