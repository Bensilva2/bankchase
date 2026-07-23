'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, CheckCircle, AlertCircle, TrendingDown, CreditCard, Lock, X } from 'lucide-react'

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [preferences, setPreferences] = useState<any>(null)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 5000) // Real-time every 5 seconds
    return () => clearInterval(interval)
  }, [])

  async function fetchNotifications() {
    try {
      const response = await fetch('/api/notifications')
      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error('[v0] Failed to fetch notifications:', error)
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      })
      await fetchNotifications()
    } catch (error) {
      console.error('[v0] Failed to mark as read:', error)
    }
  }

  async function deleteNotification(notificationId: string) {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })
      await fetchNotifications()
    } catch (error) {
      console.error('[v0] Failed to delete notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transfer':
        return <CreditCard className="w-5 h-5 text-blue-500" />
      case 'deposit':
        return <TrendingDown className="w-5 h-5 text-green-500" />
      case 'fraud':
        return <Lock className="w-5 h-5 text-red-500" />
      case 'low_balance':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return <Bell className="w-5 h-5 text-primary" />
    }
  }

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-96 bg-card border border-border rounded-lg shadow-2xl z-50">
            <div className="p-4 border-b border-border">
              <h3 className="font-bold text-lg">Notifications</h3>
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-border hover:bg-muted/50 transition-colors ${
                      notification.read ? 'opacity-60' : 'bg-primary/5'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="pt-1">{getNotificationIcon(notification.type)}</div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-sm">{notification.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                          </div>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleTimeString()}
                          </span>
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-primary hover:underline"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {notifications.length > 0 && (
              <div className="p-3 border-t border-border text-center">
                <button className="text-sm text-primary hover:underline font-medium">
                  View all notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
