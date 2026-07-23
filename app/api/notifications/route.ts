import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notification-service'
import { Notification } from '@/lib/notifications'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const userId = 'user_demo' // In real app, get from session
    const notifications = await NotificationService.getNotifications(userId, 50)
    const unreadCount = notifications.filter(n => !n.read).length

    console.log('[v0] Fetched notifications for user:', userId)

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] Notifications API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, title, message, channel, data } = body

    const notification: Notification = {
      id: uuidv4(),
      userId: 'user_demo',
      type,
      channel,
      title,
      message,
      data,
      read: false,
      createdAt: new Date(),
    }

    await NotificationService.publishNotification(notification)

    console.log('[v0] Notification created:', notification.id)

    return NextResponse.json({
      success: true,
      notification,
    })
  } catch (error) {
    console.error('[v0] Failed to create notification:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}
