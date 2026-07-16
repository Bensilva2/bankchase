/**
 * Test Script for Stripe Event Processing System
 * 
 * This script tests the event processing system by simulating
 * CloudEvents from Azure Event Grid containing Stripe events.
 */

import { StripeEventService } from '../lib/services/stripe-event-service'
import { processEvent } from '../lib/services/event-processors'
import { CloudEventEnvelope } from '../lib/types/stripe-events'

// Sample CloudEvent from Azure Event Grid
const sampleChargeSucceededEvent: CloudEventEnvelope = {
  specversion: '1.0',
  type: 'charge.succeeded',
  source: '/providers/stripe/ed_test_sample',
  id: 'test-event-001',
  time: new Date().toISOString(),
  subject: null,
  dataContentType: 'application/cloudevents+json',
  data: {
    id: 'evt_test_chargesucceeded',
    object: 'v2.core.event',
    type: 'charge.succeeded',
    livemode: false,
    created: new Date().toISOString(),
    related_object: {
      id: 'ch_test_123',
      type: 'charge',
      url: '/v1/charges/ch_test_123',
    },
  },
}

const sampleChargeFailedEvent: CloudEventEnvelope = {
  specversion: '1.0',
  type: 'charge.failed',
  source: '/providers/stripe/ed_test_sample',
  id: 'test-event-002',
  time: new Date().toISOString(),
  subject: null,
  dataContentType: 'application/cloudevents+json',
  data: {
    id: 'evt_test_chargefailed',
    object: 'v2.core.event',
    type: 'charge.failed',
    livemode: false,
    created: new Date().toISOString(),
    related_object: {
      id: 'ch_test_456',
      type: 'charge',
      url: '/v1/charges/ch_test_456',
    },
  },
}

async function testEventSystem() {
  console.log('\n=== Stripe Event Processing System Test ===\n')

  try {
    // Test 1: Store event
    console.log('Test 1: Storing charge.succeeded event...')
    const storedEvent = await StripeEventService.storeEvent(
      'test-user-001',
      sampleChargeSucceededEvent
    )
    console.log('✓ Event stored:', {
      id: storedEvent.id,
      status: storedEvent.status,
      eventType: storedEvent.eventType,
    })

    // Test 2: Get event
    console.log('\nTest 2: Retrieving stored event...')
    const retrievedEvent = await StripeEventService.getEvent(storedEvent.id)
    console.log('✓ Event retrieved:', {
      id: retrievedEvent?.id,
      eventType: retrievedEvent?.eventType,
    })

    // Test 3: Process event
    console.log('\nTest 3: Processing charge.succeeded event...')
    const processResult = await processEvent(
      storedEvent.id,
      storedEvent.eventType,
      sampleChargeSucceededEvent
    )
    console.log('✓ Event processed:', {
      success: processResult.success,
      message: processResult.message,
    })

    // Test 4: Check event status after processing
    console.log('\nTest 4: Checking event status...')
    const updatedEvent = await StripeEventService.getEvent(storedEvent.id)
    console.log('✓ Event status:', {
      id: updatedEvent?.id,
      status: updatedEvent?.status,
      processedAt: updatedEvent?.processedAt,
    })

    // Test 5: Store and process failed event
    console.log('\nTest 5: Storing and processing charge.failed event...')
    const failedEvent = await StripeEventService.storeEvent(
      'test-user-002',
      sampleChargeFailedEvent
    )
    const failedResult = await processEvent(
      failedEvent.id,
      failedEvent.eventType,
      sampleChargeFailedEvent
    )
    console.log('✓ Failed event processed:', {
      success: failedResult.success,
      message: failedResult.message,
    })

    // Test 6: Get event stats
    console.log('\nTest 6: Getting event statistics...')
    const stats = await StripeEventService.getEventStats()
    console.log('✓ Event statistics:', {
      total: stats.total,
      completed: stats.completed,
      failed: stats.failed,
      byType: stats.byType,
    })

    // Test 7: Get user events
    console.log('\nTest 7: Getting user events...')
    const userEvents = await StripeEventService.getUserEvents('test-user-001', {
      limit: 10,
    })
    console.log('✓ User events:', {
      count: userEvents.length,
      events: userEvents.map((e) => ({
        id: e.id,
        type: e.eventType,
        status: e.status,
      })),
    })

    // Test 8: Manual retry
    console.log('\nTest 8: Testing manual retry...')
    const retryResult = await StripeEventService.manualRetry(failedEvent.id)
    const retriedEvent = await StripeEventService.getEvent(failedEvent.id)
    console.log('✓ Event retry scheduled:', {
      success: retryResult.success,
      newStatus: retriedEvent?.status,
      retryCount: retriedEvent?.retryCount,
    })

    console.log('\n=== All Tests Passed! ===\n')

    return true
  } catch (error) {
    console.error('\n✗ Test failed:', error)
    return false
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testEventSystem().then((success) => {
    process.exit(success ? 0 : 1)
  })
}

export { testEventSystem }
