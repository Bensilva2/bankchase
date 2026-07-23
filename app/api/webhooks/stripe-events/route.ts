import { NextRequest, NextResponse } from 'next/server'
import { StripeEventService } from '@/lib/services/stripe-event-service'
import { processEvent } from '@/lib/services/event-processors'
import { CloudEventEnvelope } from '@/lib/types/stripe-events'

/**
 * POST handler for Azure Event Grid Stripe events
 * 
 * This endpoint receives CloudEvents from Azure Event Grid containing Stripe events.
 * It validates, stores, and processes each event according to its type.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Received Event Grid webhook request')

    // Get the request body
    const body = await request.json()

    // Azure Event Grid can send either a single event or an array of events
    const events = Array.isArray(body) ? body : [body]

    console.log(`[v0] Processing ${events.length} event(s)`)

    const results = []

    for (const event of events) {
      try {
        // Validate CloudEvents format
        if (!event.specversion || !event.type || !event.id) {
          console.error('[v0] Invalid CloudEvent format:', event)
          results.push({
            eventId: event.id || 'unknown',
            success: false,
            error: 'Invalid CloudEvent format',
          })
          continue
        }

        const cloudEvent: CloudEventEnvelope = event

        console.log('[v0] Processing CloudEvent:', {
          eventId: cloudEvent.id,
          type: cloudEvent.type,
          source: cloudEvent.source,
        })

        // For now, use 'system' as userId since events come from system
        // In production, extract userId from event data or source
        const userId = 'system'

        // Store the event
        const storedEvent = await StripeEventService.storeEvent(userId, cloudEvent)

        // Process the event based on type
        const processResult = await processEvent(cloudEvent.id, cloudEvent.type, cloudEvent)

        results.push({
          eventId: storedEvent.id,
          stripeEventId: storedEvent.eventId,
          eventType: storedEvent.eventType,
          success: processResult.success,
          message: processResult.message,
          error: processResult.error,
        })

        console.log('[v0] Event processed:', {
          eventId: storedEvent.id,
          success: processResult.success,
        })
      } catch (error) {
        console.error('[v0] Error processing individual event:', error)

        results.push({
          eventId: event.id || 'unknown',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Return success response with results
    return NextResponse.json(
      {
        success: true,
        eventsProcessed: events.length,
        results,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Webhook error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  }
}

/**
 * GET handler for health check
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    message: 'Stripe Event Grid webhook endpoint is operational',
    timestamp: new Date().toISOString(),
  })
}
