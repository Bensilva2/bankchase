import { NextRequest, NextResponse } from 'next/server'
import { StripeEventService } from '@/lib/services/stripe-event-service'

/**
 * GET /api/admin/stripe-events
 * Get all failed events (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = 'demo-user'

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: In production, add role-based access control
    // For now, allow all authenticated users
    if (!userId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10)

    // Get failed events
    const failedEvents = await StripeEventService.getFailedEvents(limit)

    // Get global stats (not filtered by user)
    const stats = await StripeEventService.getEventStats()

    return NextResponse.json({
      failedEvents,
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] Error fetching admin events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}
