import { NextRequest, NextResponse } from 'next/server'
import { StripeEventService } from '@/lib/services/stripe-event-service'

/**
 * POST /api/stripe-events/[eventId]/retry
 * Manually retry a failed event
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const userId = 'demo-user'

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.eventId

    // Get the event first to verify it exists and user owns it
    const event = await StripeEventService.getEvent(eventId)

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Verify user owns this event
    if (event.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Perform manual retry
    const result = await StripeEventService.manualRetry(eventId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[v0] Error retrying event:', error)
    return NextResponse.json(
      { error: 'Failed to retry event' },
      { status: 500 }
    )
  }
}
