import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notification-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = 'user_demo'
    await NotificationService.markAsRead(userId, params.id)

    console.log('[v0] Notification marked as read:', params.id)

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
    })
  } catch (error) {
    console.error('[v0] Failed to mark as read:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to mark as read' },
      { status: 500 }
    )
  }
}
