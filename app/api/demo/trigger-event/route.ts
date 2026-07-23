import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notification-service'
import { BankingEvent } from '@/lib/notifications'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventType, data } = body

    // Create banking event
    const event: BankingEvent = {
      id: uuidv4(),
      userId: 'user_demo',
      eventType,
      description: `Banking event: ${eventType}`,
      data,
      timestamp: new Date(),
    }

    // Publish banking event
    await NotificationService.publishBankingEvent(event)

    // Create corresponding notification
    const notification = {
      id: uuidv4(),
      userId: 'user_demo',
      type: 'transfer',
      channel: 'email' as const,
      title: `Transaction: ${data.description}`,
      message: `Amount: $${data.amount.toFixed(2)}`,
      data,
      read: false,
      createdAt: new Date(),
    }

    await NotificationService.publishNotification(notification)

    console.log('[v0] Demo event triggered:', eventType)

    return NextResponse.json({
      success: true,
      event,
      notification,
      message: 'Event triggered successfully',
    })
  } catch (error) {
    console.error('[v0] Failed to trigger event:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to trigger event' },
      { status: 500 }
    )
  }
}
