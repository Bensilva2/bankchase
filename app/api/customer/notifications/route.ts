import { NextRequest, NextResponse } from 'next/server';
import { getUserNotifications, markNotificationAsRead, deleteNotification } from '@/lib/mongodb/operations';
import { checkMongoHealth } from '@/lib/mongodb/client';

/**
 * GET /api/customer/notifications
 * Get user's notifications from MongoDB
 */
export async function GET(request: NextRequest) {
  try {
    // Verify MongoDB is available
    const mongoHealth = await checkMongoHealth();
    if (!mongoHealth) {
      return NextResponse.json(
        { error: 'Database unavailable' },
        { status: 503 }
      );
    }

    // Get user ID from JWT (in production, extract from session)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    const notifications = await getUserNotifications(userId, Math.min(limit, 100));

    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({
      success: true,
      data: notifications,
      meta: {
        total: notifications.length,
        unread: unreadCount,
      },
    });
  } catch (error) {
    console.error('[v0] Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/customer/notifications/:id
 * Mark notification as read
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { notificationId, action } = await request.json();

    if (action === 'read') {
      const success = await markNotificationAsRead(notificationId, userId);
      if (!success) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notification updated',
    });
  } catch (error) {
    console.error('[v0] Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/customer/notifications/:id
 * Delete notification
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { notificationId } = await request.json();

    const success = await deleteNotification(notificationId, userId);
    if (!success) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('[v0] Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
