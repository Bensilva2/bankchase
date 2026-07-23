import { StripeEventService } from './stripe-event-service'
import { processEvent } from './event-processors'

/**
 * Event Retry Scheduler
 * Handles automatic retry of failed events with exponential backoff
 */
export class EventRetryScheduler {
  private static instance: EventRetryScheduler
  private isRunning = false
  private intervalId: NodeJS.Timeout | null = null

  private constructor() {}

  static getInstance(): EventRetryScheduler {
    if (!this.instance) {
      this.instance = new EventRetryScheduler()
    }
    return this.instance
  }

  /**
   * Start the retry scheduler
   * Runs every 30 seconds to check for events that need retrying
   */
  async start() {
    if (this.isRunning) {
      console.log('[v0] Retry scheduler already running')
      return
    }

    this.isRunning = true
    console.log('[v0] Starting event retry scheduler')

    // Run immediately
    await this.processRetries()

    // Then run every 30 seconds
    this.intervalId = setInterval(async () => {
      try {
        await this.processRetries()
      } catch (error) {
        console.error('[v0] Error in retry scheduler:', error)
      }
    }, 30000) // 30 seconds
  }

  /**
   * Stop the retry scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('[v0] Stopped event retry scheduler')
  }

  /**
   * Process events that are ready for retry
   */
  private async processRetries() {
    try {
      const eventsToRetry = await StripeEventService.getEventsForRetry()

      if (eventsToRetry.length === 0) {
        return
      }

      console.log(`[v0] Processing ${eventsToRetry.length} events for retry`)

      for (const event of eventsToRetry) {
        try {
          console.log('[v0] Retrying event:', {
            eventId: event.id,
            retryCount: event.retryCount,
          })

          // Process the event again
          const result = await processEvent(event.id, event.eventType, event.data)

          if (!result.success) {
            // Schedule another retry if it still failed
            await StripeEventService.scheduleRetry(event.id)
          }
        } catch (error) {
          console.error('[v0] Error retrying event:', error)

          // Try to schedule another retry
          try {
            await StripeEventService.scheduleRetry(event.id)
          } catch (scheduleError) {
            console.error('[v0] Error scheduling retry:', scheduleError)
          }
        }
      }
    } catch (error) {
      console.error('[v0] Error in processRetries:', error)
    }
  }
}

// Export singleton instance
export const retryScheduler = EventRetryScheduler.getInstance()
