import { StoredStripeEvent, CloudEventEnvelope, EventProcessingResult, EventRetryPolicy } from '@/lib/types/stripe-events'

// In-memory event storage (replace with database in production)
const eventStore = new Map<string, StoredStripeEvent>()
const eventSequence: string[] = []

const DEFAULT_RETRY_POLICY: EventRetryPolicy = {
  maxRetries: 5,
  retryDelayMs: 5000,
  backoffMultiplier: 2,
  maxBackoffMs: 300000, // 5 minutes
}

export class StripeEventService {
  /**
   * Store a new Stripe event from Azure Event Grid
   */
  static async storeEvent(
    userId: string,
    event: CloudEventEnvelope
  ): Promise<StoredStripeEvent> {
    const eventId = event.id
    const stripeEventId = event.data?.id || eventId

    const storedEvent: StoredStripeEvent = {
      id: eventId,
      userId,
      eventId: stripeEventId,
      eventType: event.type,
      status: 'received',
      data: event,
      retryCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    eventStore.set(eventId, storedEvent)
    eventSequence.push(eventId)

    console.log('[v0] Event stored:', {
      eventId: storedEvent.id,
      eventType: storedEvent.eventType,
      userId,
    })

    return storedEvent
  }

  /**
   * Get event by ID
   */
  static async getEvent(eventId: string): Promise<StoredStripeEvent | null> {
    return eventStore.get(eventId) || null
  }

  /**
   * Get all events for a user with filtering
   */
  static async getUserEvents(
    userId: string,
    options?: {
      eventType?: string
      status?: string
      limit?: number
      offset?: number
    }
  ): Promise<StoredStripeEvent[]> {
    let events = Array.from(eventStore.values()).filter(
      (e) => e.userId === userId
    )

    if (options?.eventType) {
      events = events.filter((e) => e.eventType === options.eventType)
    }

    if (options?.status) {
      events = events.filter((e) => e.status === options.status)
    }

    // Sort by creation date descending
    events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const limit = options?.limit || 50
    const offset = options?.offset || 0

    return events.slice(offset, offset + limit)
  }

  /**
   * Update event status after processing
   */
  static async updateEventStatus(
    eventId: string,
    status: 'processing' | 'completed' | 'failed',
    options?: {
      error?: string
      processedAt?: Date
    }
  ): Promise<StoredStripeEvent | null> {
    const event = eventStore.get(eventId)
    if (!event) return null

    event.status = status
    event.updatedAt = new Date()

    if (options?.error) {
      event.error = options.error
    }

    if (options?.processedAt) {
      event.processedAt = options.processedAt
    }

    eventStore.set(eventId, event)

    console.log('[v0] Event status updated:', {
      eventId,
      status,
      hasError: !!options?.error,
    })

    return event
  }

  /**
   * Mark event for retry with exponential backoff
   */
  static async scheduleRetry(eventId: string): Promise<StoredStripeEvent | null> {
    const event = eventStore.get(eventId)
    if (!event) return null

    if (event.retryCount >= DEFAULT_RETRY_POLICY.maxRetries) {
      event.status = 'failed'
      console.log('[v0] Event max retries exceeded:', eventId)
      return event
    }

    event.retryCount += 1
    event.lastRetryAt = new Date()

    // Calculate next retry time with exponential backoff
    const backoffMs = Math.min(
      DEFAULT_RETRY_POLICY.retryDelayMs *
        Math.pow(DEFAULT_RETRY_POLICY.backoffMultiplier, event.retryCount - 1),
      DEFAULT_RETRY_POLICY.maxBackoffMs
    )

    event.nextRetryAt = new Date(Date.now() + backoffMs)
    event.updatedAt = new Date()

    eventStore.set(eventId, event)

    console.log('[v0] Event scheduled for retry:', {
      eventId,
      retryCount: event.retryCount,
      nextRetryIn: `${backoffMs}ms`,
    })

    return event
  }

  /**
   * Get events ready for retry
   */
  static async getEventsForRetry(): Promise<StoredStripeEvent[]> {
    const now = new Date()
    return Array.from(eventStore.values()).filter(
      (e) =>
        e.nextRetryAt &&
        e.nextRetryAt <= now &&
        e.retryCount < DEFAULT_RETRY_POLICY.maxRetries
    )
  }

  /**
   * Get event statistics
   */
  static async getEventStats(userId?: string): Promise<{
    total: number
    received: number
    processing: number
    completed: number
    failed: number
    byType: Record<string, number>
  }> {
    let events = Array.from(eventStore.values())

    if (userId) {
      events = events.filter((e) => e.userId === userId)
    }

    const stats = {
      total: events.length,
      received: events.filter((e) => e.status === 'received').length,
      processing: events.filter((e) => e.status === 'processing').length,
      completed: events.filter((e) => e.status === 'completed').length,
      failed: events.filter((e) => e.status === 'failed').length,
      byType: {} as Record<string, number>,
    }

    events.forEach((e) => {
      stats.byType[e.eventType] = (stats.byType[e.eventType] || 0) + 1
    })

    return stats
  }

  /**
   * Get recent failed events
   */
  static async getFailedEvents(limit: number = 20): Promise<StoredStripeEvent[]> {
    return Array.from(eventStore.values())
      .filter((e) => e.status === 'failed')
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit)
  }

  /**
   * Manual retry of a failed event
   */
  static async manualRetry(eventId: string): Promise<EventProcessingResult> {
    const event = eventStore.get(eventId)

    if (!event) {
      return {
        success: false,
        eventId,
        processedAt: new Date(),
        error: 'Event not found',
      }
    }

    // Reset retry count and status
    event.retryCount = 0
    event.status = 'received'
    event.error = undefined
    event.nextRetryAt = undefined
    event.updatedAt = new Date()

    eventStore.set(eventId, event)

    console.log('[v0] Event manually retried:', eventId)

    return {
      success: true,
      eventId,
      processedAt: new Date(),
      message: 'Event queued for reprocessing',
    }
  }
}
