'use client'

import { Navigation } from '@/components/Navigation'
import { PushNotificationsSetup } from '@/components/push-notifications-setup'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotificationsPage() {
  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <Navigation />
      
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        {/* Back Button */}
        <Link
          href="/settings"
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Notification Settings</h1>
          <p className="text-muted-foreground">Manage how you receive alerts and updates from Chase Banking</p>
        </div>

        {/* Notification Categories */}
        <div className="bg-card border border-border rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Communication Preferences</h2>
          
          <div className="space-y-4">
            <div className="flex items-start justify-between p-4 bg-background/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-foreground">Transaction Alerts</p>
                <p className="text-sm text-muted-foreground mt-1">Receive instant alerts for all transactions</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded mt-1" />
            </div>

            <div className="flex items-start justify-between p-4 bg-background/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-foreground">Security Alerts</p>
                <p className="text-sm text-muted-foreground mt-1">Get notified of login attempts and security events</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded mt-1" />
            </div>

            <div className="flex items-start justify-between p-4 bg-background/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-foreground">Low Balance Alerts</p>
                <p className="text-sm text-muted-foreground mt-1">Alert when balance falls below threshold</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded mt-1" />
            </div>

            <div className="flex items-start justify-between p-4 bg-background/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-foreground">Bill Payment Reminders</p>
                <p className="text-sm text-muted-foreground mt-1">Reminders for upcoming bill payments</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded mt-1" />
            </div>

            <div className="flex items-start justify-between p-4 bg-background/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-foreground">Offers & Promotions</p>
                <p className="text-sm text-muted-foreground mt-1">Receive exclusive offers tailored to your account</p>
              </div>
              <input type="checkbox" className="w-5 h-5 rounded mt-1" />
            </div>
          </div>
        </div>

        {/* Push Notifications Setup */}
        <PushNotificationsSetup />

        {/* Notification History */}
        <div className="bg-card border border-border rounded-2xl p-8 mt-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Recent Notifications</h2>
          
          <div className="space-y-3">
            {[
              { title: 'Transfer Sent', description: '$500.00 transferred to John Doe', time: '2 hours ago' },
              { title: 'Security Alert', description: 'New login from Chrome on Windows', time: '1 day ago' },
              { title: 'Bill Payment', description: 'Electric bill of $125.50 paid', time: '3 days ago' },
              { title: 'Offer Available', description: 'You qualify for 2% cashback on dining', time: '5 days ago' },
            ].map((notification, idx) => (
              <div key={idx} className="flex items-start justify-between p-4 bg-background/50 rounded-lg hover:bg-background transition">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{notification.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{notification.description}</p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap ml-4">{notification.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
