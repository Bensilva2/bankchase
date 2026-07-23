# Stripe Event Processing System - Quick Start Guide

Get up and running with Stripe event processing via Azure Event Grid in 5 minutes.

## TL;DR

1. Configure Azure Event Grid for Stripe events
2. System automatically processes events via webhook
3. Monitor events at `http://localhost:3000/stripe-events`
4. Customize event handlers in `lib/services/event-processors.ts`

## Access Dashboard

**URL**: `http://localhost:3000/stripe-events`

**Features**:
- Real-time event statistics
- Event list with detailed view
- Filter by status and event type
- Manual retry for failed events
- Copy event JSON for debugging

## Test Webhook (Local Development)

```bash
# Test with sample charge.succeeded event
curl -X POST http://localhost:3000/api/webhooks/stripe-events \
  -H "Content-Type: application/json" \
  -d '{
    "specversion": "1.0",
    "type": "charge.succeeded",
    "source": "/providers/stripe/ed_test",
    "id": "test-event-001",
    "time": "2026-07-16T09:00:00Z",
    "subject": null,
    "dataContentType": "application/cloudevents+json",
    "data": {
      "id": "evt_test_charge",
      "object": "v2.core.event",
      "type": "charge.succeeded",
      "livemode": false,
      "created": "2026-07-16T09:00:00Z"
    }
  }'

# Expected response
# {"success":true,"eventsProcessed":1,"results":[...]}
```

## Event Types Supported

- `charge.succeeded` - Successful payment
- `charge.failed` - Failed payment
- `invoice.paid` - Invoice payment completed
- `payment_intent.succeeded` - Payment intent succeeded
- `customer.created` - New customer created

## Add New Event Handler

1. Create handler function in `lib/services/event-processors.ts`:

```typescript
export async function processYourEvent(
  eventId: string,
  event: CloudEventEnvelope
): Promise<EventProcessingResult> {
  try {
    const data = event.data
    
    // TODO: Add your business logic
    console.log('[v0] Processing your event:', data)
    
    await StripeEventService.updateEventStatus(eventId, 'completed')
    
    return {
      success: true,
      eventId,
      processedAt: new Date(),
      message: 'Success'
    }
  } catch (error) {
    await StripeEventService.updateEventStatus(eventId, 'failed', {
      error: error.message
    })
    await StripeEventService.scheduleRetry(eventId)
    
    return {
      success: false,
      eventId,
      processedAt: new Date(),
      error: error.message
    }
  }
}
```

2. Add case in `processEvent()` router:

```typescript
case 'your.event':
  result = await processYourEvent(eventId, event)
  break
```

## API Endpoints

### Receive Events
```
POST /api/webhooks/stripe-events
Content-Type: application/json

[CloudEvents from Azure Event Grid]
```

### Fetch User Events
```
GET /api/stripe-events?status=completed&eventType=charge.succeeded&limit=50
Authorization: Bearer [Clerk Token]
```

### Retry Failed Event
```
POST /api/stripe-events/[eventId]/retry
Authorization: Bearer [Clerk Token]
```

### Admin Failed Events
```
GET /api/admin/stripe-events
Authorization: Bearer [Clerk Token]
```

## Event Status Flow

```
Events are processed through these states:

received
  ↓
processing
  ├→ completed ✓ (Success)
  └→ failed
       ↓
    Auto-retry after delay
       ↓
    processing
       ├→ completed ✓ (Success on retry)
       └→ failed (max retries exceeded)
```

## Retry Configuration

- **Max Retries**: 5 attempts
- **Initial Delay**: 5 seconds
- **Backoff**: Exponential (2x)
- **Max Backoff**: 5 minutes
- **Check Interval**: 30 seconds

## Debugging

### View Event Details
1. Go to `http://localhost:3000/stripe-events`
2. Click event to expand
3. View error message and retry count
4. Check "Next Retry" time

### Manual Retry Failed Event
1. Locate failed event
2. Click "Retry Now" button
3. Event reprocessed immediately

### Check Event Statistics
```typescript
const stats = await StripeEventService.getEventStats()
console.log(stats)
// Output: { total, received, processing, completed, failed, byType }
```

### View Recent Failed Events
```typescript
const failed = await StripeEventService.getFailedEvents(20)
failed.forEach(event => {
  console.log(`${event.id}: ${event.error}`)
})
```

## Production Checklist

- [ ] Add database persistence (replace in-memory storage)
- [ ] Implement webhook signature validation
- [ ] Add monitoring and alerting
- [ ] Configure dead letter queue for permanent failures
- [ ] Set up idempotency checks
- [ ] Implement rate limiting if needed
- [ ] Add request authentication/authorization
- [ ] Deploy to production environment
- [ ] Configure Azure Event Grid in production
- [ ] Set up Stripe event destination pointing to production webhook

## Azure Event Grid Setup

1. **Register Resource Provider**
   - Azure Portal → Subscriptions → Your Sub
   - Settings → Resource providers
   - Register: Microsoft.EventGrid

2. **Create Partner Authorization**
   - Azure Portal → Partner Configurations
   - Add Stripe as partner
   - Set expiration: 90 days

3. **Create Stripe Event Destination**
   - Stripe Dashboard → Workbench → Webhooks
   - Event Destination → Azure Event Grid
   - Enter Azure Sub ID, Resource Group, Region

4. **Activate Partner Topic**
   - Azure Portal → Event Grid Partner Topics
   - Find Stripe topic
   - Click Activate
   - Confirm activation

5. **Create Event Subscription**
   - Azure Portal → Event Grid Partner Topics
   - Select Stripe topic
   - Event Subscription
   - Select events to receive
   - Point to webhook endpoint

## Common Issues

### Events not being received
- Check webhook endpoint is publicly accessible
- Verify partner topic is activated
- Check Azure Event Grid delivery logs

### High failure rate
- Review error messages in dashboard
- Check external service connectivity
- Verify event data format

### Events stuck in processing
- Check processor function for infinite loops
- Review database connections
- Check timeout settings

## Monitoring

```bash
# Watch for new events in real-time
# (You'd typically use a proper monitoring solution)
curl http://localhost:3000/api/stripe-events -H "Authorization: Bearer ..." \
  | jq '.stats'
```

## File Locations

- **Dashboard**: `app/stripe-events/page.tsx`
- **Webhook**: `app/api/webhooks/stripe-events/route.ts`
- **Processors**: `lib/services/event-processors.ts`
- **Service**: `lib/services/stripe-event-service.ts`
- **Types**: `lib/types/stripe-events.ts`
- **Documentation**: `STRIPE_EVENTS_SYSTEM.md`

## Next Steps

1. Set up Azure Event Grid (see above)
2. Create Stripe event destination pointing to webhook
3. Test with sample events using curl
4. Implement business logic in event processors
5. Deploy to production
6. Monitor events via dashboard

## Help

See **STRIPE_EVENTS_SYSTEM.md** for:
- Complete API reference
- Detailed architecture
- Production guide
- Troubleshooting
- Custom handlers

Your event processing system is ready to go!
