/**
 * Notifications API - Push, email, SMS notification management
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/notifications - Fetch user notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const userId = request.headers.get('x-user-id')
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const category = searchParams.get('category')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data: notifications, error } = await query
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const unreadCount = notifications?.filter(n => !n.read).length || 0

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount,
      total: notifications?.length || 0
    })
  } catch (error) {
    console.error('[v0] Notifications fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// PATCH /api/notifications - Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const userId = request.headers.get('x-user-id')
    const { notificationId, markAllAsRead } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (markAllAsRead) {
      // Mark all as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({
        message: 'All notifications marked as read'
      })
    }

    if (notificationId) {
      // Mark specific notification as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({
        message: 'Notification marked as read'
      })
    }

    return NextResponse.json(
      { error: 'notificationId or markAllAsRead required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[v0] Notification update error:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications - Delete notification
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const userId = request.headers.get('x-user-id')
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('notificationId')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      message: 'Notification deleted'
    })
  } catch (error) {
    console.error('[v0] Notification delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}

// POST /api/notifications/preferences - Update notification preferences
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const userId = request.headers.get('x-user-id')
    const {
      emailNotifications,
      smsNotifications,
      pushNotifications,
      transactionAlerts,
      securityAlerts,
      offerNotifications,
      promotionalEmails,
    } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update user preferences
    const { error } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: userId,
          email_notifications: emailNotifications,
          sms_notifications: smsNotifications,
          push_notifications: pushNotifications,
          transaction_alerts: transactionAlerts,
          security_alerts: securityAlerts,
          offer_notifications: offerNotifications,
          promotional_emails: promotionalEmails,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      message: 'Notification preferences updated successfully'
    })
  } catch (error) {
    console.error('[v0] Preferences update error:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
