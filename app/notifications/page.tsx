'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import { useBanking } from '@/lib/banking-context'
import { Bell, Trash2, CheckCircle, AlertCircle, Info, Zap, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BackButton } from '@/components/back-button'
import { WebhookConnectors } from '@/components/webhook-connectors'

export default function NotificationsPage() {
  const router = useRouter()
  
  const { notifications = [], markNotificationRead, deleteNotification, clearAllNotifications } = useBanking()
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all')
  const [activeTab, setActiveTab] = useState<'notifications' | 'webhooks' | 'preferences'>('notifications')
  const [isGeneratingEvent, setIsGeneratingEvent] = useState(false)

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-card">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!userId) {
    router.push('/login')
    return null
  }

  const filteredNotifications = filterType === 'unread' 
    ? notifications.filter((n: any) => !n.read)
    : notifications

  async function triggerDemoEvent() {
    try {
      setIsGeneratingEvent(true)
      const response = await fetch('/api/demo/trigger-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'transaction.completed',
          data: {
            amount: 250.00,
            description: 'Wire Transfer to Account',
            timestamp: new Date().toISOString(),
          },
        }),
      })

      if (response.ok) {
        alert('Demo event triggered! Check your webhooks.')
      }
    } catch (error) {
      console.error('[v0] Failed to trigger event:', error)
      alert('Failed to trigger event')
    } finally {
      setIsGeneratingEvent(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card pb-8">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Bell className="w-8 h-8 text-primary" />
              Notifications & Webhooks
            </h1>
            <p className="text-muted-foreground">Manage notifications and webhook integrations</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </span>
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'webhooks'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Webhooks
            </span>
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'preferences'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Preferences
            </span>
          </button>
        </div>

        {/* Filter and Actions - Only for notifications tab */}
        {activeTab === 'notifications' && (
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterType === 'all'
                    ? 'bg-primary text-background'
                    : 'bg-background text-foreground hover:bg-background'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilterType('unread')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterType === 'unread'
                    ? 'bg-primary text-background'
                    : 'bg-background text-foreground hover:bg-background'
                }`}
              >
                Unread ({notifications.filter((n: any) => !n.read).length})
              </button>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={() => clearAllNotifications?.()}
                className="text-red-600 hover:text-red-700 font-medium text-sm"
              >
                Clear All
              </button>
            )}
          </div>
        )}

        {/* Content Sections */}
        {activeTab === 'notifications' && (
          <div className="space-y-3">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification: any) => (
                <Card
                  key={notification.id}
                  className={`p-4 border-l-4 ${
                    notification.type === 'alert'
                      ? 'border-l-red-500 bg-red-50'
                      : notification.type === 'success'
                      ? 'border-l-green-500 bg-green-50'
                      : 'border-l-blue-500 bg-background'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{notification.title}</h3>
                        <p className="text-muted-foreground text-sm">{notification.message}</p>
                        <p className="text-muted-foreground text-xs mt-2">
                          {new Date(notification.date).toLocaleDateString()} at{' '}
                          {new Date(notification.date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => markNotificationRead?.(notification.id)}
                          className="p-2 hover:bg-background rounded transition"
                          title="Mark as read"
                        >
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification?.(notification.id)}
                        className="p-2 hover:bg-background rounded transition text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications to display</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div className="space-y-6">
            <WebhookConnectors />
            
            <Card className="p-6 border-border">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Test Your Webhooks
              </h3>
              <p className="text-muted-foreground mb-4">
                Trigger a demo banking event to test your webhook connectors in real-time
              </p>
              <button
                onClick={triggerDemoEvent}
                disabled={isGeneratingEvent}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
                {isGeneratingEvent ? 'Sending...' : 'Trigger Demo Event'}
              </button>
            </Card>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-4">
            <Card className="p-6 border-border">
              <h3 className="text-xl font-bold mb-6">Notification Preferences</h3>
              <div className="space-y-4">
                {['Transfer', 'Deposit', 'Withdrawal', 'Fraud Alert', 'Low Balance'].map((type) => (
                  <div key={type} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">{type}</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                      <span className="text-sm text-muted-foreground">Enable notifications</span>
                    </label>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 border-border">
              <h3 className="text-lg font-semibold mb-4">Notification Channels</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Email', 'SMS', 'Slack', 'Discord'].map((channel) => (
                  <label key={channel} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="font-medium">{channel}</span>
                  </label>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
