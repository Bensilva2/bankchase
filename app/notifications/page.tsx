'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useBanking } from '@/lib/banking-context'
import { ArrowLeft, Bell, Trash2, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function NotificationsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { notifications = [], markNotificationRead, deleteNotification, clearAllNotifications } = useBanking()
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const filteredNotifications = filterType === 'unread' 
    ? notifications.filter((n: any) => !n.read)
    : notifications

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pb-8">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">Stay updated with your account activity</p>
          </div>
        </div>

        {/* Filter and Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilterType('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterType === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
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

        {/* Notifications List */}
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
                    : 'border-l-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      <p className="text-gray-600 text-sm">{notification.message}</p>
                      <p className="text-gray-500 text-xs mt-2">
                        {new Date(notification.date).toLocaleDateString()} at{' '}
                        {new Date(notification.date).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!notification.read && (
                      <button
                        onClick={() => markNotificationRead?.(notification.id)}
                        className="p-2 hover:bg-white rounded transition"
                        title="Mark as read"
                      >
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification?.(notification.id)}
                      className="p-2 hover:bg-white rounded transition text-red-600"
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
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No notifications to display</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
