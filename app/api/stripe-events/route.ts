import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { StripeEventService } from '@/lib/services/stripe-event-service'

/**
 * GET /api/stripe-events
 * Fetch user's Stripe events with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const eventType = searchParams.get('eventType') || undefined
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Fetch events
    const events = await StripeEventService.getUserEvents(userId, {
      eventType: eventType || undefined,
      status: status || undefined,
      limit,
      offset,
    })

    // Fetch stats
    const stats = await StripeEventService.getEventStats(userId)

    return NextResponse.json({
      events,
      stats,
      pagination: {
        limit,
        offset,
        total: stats.total,
      },
    })
  } catch (error) {
    console.error('[v0] Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}
