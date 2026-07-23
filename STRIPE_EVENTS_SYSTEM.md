# Stripe Event Processing System

Complete event processing system for handling Stripe events via Azure Event Grid in BankChase.

## System Architecture

```
Azure Event Grid
      ↓
Stripe Events (CloudEvents format)
      ↓
/api/webhooks/stripe-events (Webhook Handler)
      ↓
StripeEventService (Store & Track)
      ↓
Event Processors (Route & Process)
      ↓
Business Logic Updates
```

## Components

### 1. Event Types & Models (`lib/types/stripe-events.ts`)

- **CloudEventEnvelope**: Wrapper for Stripe events from Azure Event Grid
- **StripeEvent**: Core Stripe event data structure
- **StoredStripeEvent**: Database record for tracking events
- **EventProcessingResult**: Result of event processing
- **EventRetryPolicy**: Configuration for automatic retries

### 2. Event Service (`lib/services/stripe-event-service.ts`)

Core service for event lifecycle management:

- **storeEvent()**: Store new Stripe events from Azure Event Grid
- **getEvent()**: Retrieve event by ID
- **getUserEvents()**: Get filtered events for a user with pagination
- **updateEventStatus()**: Update event processing status
- **scheduleRetry()**: Schedule automatic retry with exponential backoff
- **getEventsForRetry()**: Find events ready for retry
- **getEventStats()**: Get event statistics and metrics
- **getFailedEvents()**: Get recent failed events for admin dashboard
- **manualRetry()**: Manually retry a failed event

### 3. Event Processors (`lib/services/event-processors.ts`)

Specialized handlers for different Stripe event types:

- **processChargeSucceeded()**: Handle successful charges
- **processChargeFailed()**: Handle failed charges
- **processInvoicePaid()**: Handle paid invoices
- **processPaymentIntentSucceeded()**: Handle successful payment intents
- **processCustomerCreated()**: Handle new customers
- **processEvent()**: Router that dispatches to specific processors

### 4. Webhook Handler (`app/api/webhooks/stripe-events/route.ts`)

Azure Event Grid webhook endpoint:

- Receives CloudEvents from Azure Event Grid
- Validates event format
- Stores events in the system
- Routes events to appropriate processors
- Returns processing results

### 5. Event Retry Scheduler (`lib/services/event-retry-scheduler.ts`)

Automatic retry mechanism:

- Runs every 30 seconds
- Identifies events ready for retry
- Implements exponential backoff (5s → 10s → 20s... max 5 minutes)
- Respects maximum retry count (5 attempts)
- Graceful error handling

### 6. Dashboard & UI

#### Event List Component (`components/stripe-events/event-list.tsx`)
- Display events with status indicators
- Expandable event details
- Copy JSON to clipboard
- Manual retry button for failed events

#### Event Stats Component (`components/stripe-events/event-stats.tsx`)
- Real-time event statistics
- Visual indicators by status
- Total events, completed, processing, failed

#### Events Dashboard Page (`app/stripe-events/page.tsx`)
- Main events tracking interface
- Filter by status and event type
- Pagination support
- Real-time refresh

## API Endpoints

### Webhook

**POST /api/webhooks/stripe-events**
- Receives Stripe events from Azure Event Grid
- Validates CloudEvents format
- Processes and stores events
- Returns: `{ success, eventsProcessed, results, timestamp }`

**GET /api/webhooks/stripe-events**
- Health check for webhook endpoint

### User Events

**GET /api/stripe-events**
- Fetch user's Stripe events
- Query params: `eventType`, `status`, `limit`, `offset`
- Returns: `{ events, stats, pagination }`

**POST /api/stripe-events/[eventId]/retry**
- Manually retry a failed event
- Only accessible by event owner
- Returns: `{ success, eventId, processedAt, message, error }`

### Admin

**GET /api/admin/stripe-events**
- Admin-only endpoint for all failed events
- Query params: `limit`
- Returns: `{ failedEvents, stats, timestamp }`

## Event Flow

### 1. Event Reception
```
Stripe generates event
  ↓
Event sent to Azure Event Grid
  ↓
Event Grid routes to /api/webhooks/stripe-events
```

### 2. Event Storage
```
Webhook receives CloudEvent
  ↓
Validate CloudEvents format
  ↓
Store event with status: "received"
```

### 3. Event Processing
```
Route to appropriate processor
  ↓
Update status to "processing"
  ↓
Execute business logic
  ↓
Update status to "completed" or "failed"
```

### 4. Error Handling & Retry
```
If processing fails:
  ↓
Update status to "failed"
  ↓
Schedule retry with exponential backoff
  ↓
Retry scheduler picks up at next interval
  ↓
Reprocess with updated state
```

## Retry Strategy

- **Max Retries**: 5 attempts
- **Backoff**: Exponential with multiplier 2x
  - 1st retry: 5 seconds
  - 2nd retry: 10 seconds
  - 3rd retry: 20 seconds
  - 4th retry: 40 seconds
  - 5th retry: 80 seconds
- **Max Backoff**: 5 minutes
- **Scheduler Interval**: 30 seconds

## Event Status Flow

```
received → processing → completed
         ↓           ↓
         ↓      → failed (schedule retry)
         ↓           ↓
         ↓      → processing (automatic retry)
         ↓           ↓
         ↓      → completed or max retries exceeded
```

## Implementing Custom Event Handlers

To handle a new Stripe event type:

1. Add event type to `StripeEventType` in `lib/types/stripe-events.ts`
2. Create processor function in `lib/services/event-processors.ts`:

```typescript
export async function processYourEvent(
  eventId: string,
  event: CloudEventEnvelope
): Promise<EventProcessingResult> {
  try {
    console.log('[v0] Processing your.event:', eventId)
    const data = event.data
    
    // TODO: Implement business logic
    
    await StripeEventService.updateEventStatus(eventId, 'completed', {
      processedAt: new Date(),
    })
    
    return {
      success: true,
      eventId,
      processedAt: new Date(),
      message: 'Successfully processed your event',
    }
  } catch (error) {
    // Handle error and schedule retry
    await StripeEventService.updateEventStatus(eventId, 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    await StripeEventService.scheduleRetry(eventId)
    
    return {
      success: false,
      eventId,
      processedAt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
```

3. Add case in `processEvent()` router:

```typescript
case 'your.event':
  result = await processYourEvent(eventId, event)
  break
```

## Azure Event Grid Setup

### Register Event Grid Resource Provider

1. Azure Portal → Subscriptions → Your Subscription
2. Settings → Resource providers
3. Search for "Microsoft.EventGrid"
4. Click "Register" if not already registered

### Create Partner Authorization

1. Azure Portal → Search "Partner Configurations"
2. Click "Create" → "Create Partner Configuration"
3. Select subscription and resource group
4. Add "Stripe" as partner
5. Set authorization expiration (recommend 90 days)
6. Review and create

### Add Event Destination in Stripe

1. Stripe Dashboard → Workbench → Webhooks
2. Click "Create new destination"
3. Select "Azure Event Grid"
4. Enter:
   - Azure Subscription ID
   - Azure Resource Group
   - Azure Region
   - Destination name (optional)
5. Create destination
6. Activate partner topic in Azure within 7 days

### Create Event Subscriptions in Azure

1. Azure Portal → Event Grid Partner Topics
2. Select Stripe partner topic
3. Click "+ Event Subscription"
4. Configure:
   - Name for subscription
   - Event types to receive
   - Endpoint type (Webhook, Function, etc.)
   - Endpoint details
5. Create subscription

## Monitoring & Debugging

### View Events Dashboard
Navigate to `/stripe-events` to see:
- Real-time event statistics
- Event processing status
- Filter by status and type
- View event details and errors
- Manual retry controls

### Check Event Stats
```typescript
const stats = await StripeEventService.getEventStats()
console.log('[v0] Event stats:', stats)
```

### View Failed Events
```typescript
const failed = await StripeEventService.getFailedEvents(20)
console.log('[v0] Failed events:', failed)
```

### Manual Retry Event
```typescript
const result = await StripeEventService.manualRetry(eventId)
console.log('[v0] Retry result:', result)
```

## Production Considerations

1. **Database**: Currently uses in-memory storage. Implement database persistence for production:
   - Use Neon, Supabase, or Aurora for event storage
   - Add database queries to StripeEventService

2. **Authentication**: Validate webhook requests:
   - Verify Azure Event Grid signature
   - Verify Stripe event signature if available

3. **Idempotency**: Handle duplicate events:
   - Check for existing event ID before processing
   - Implement idempotent business logic

4. **Dead Letter Queue**: Handle permanently failed events:
   - Move events to dead letter after max retries
   - Alert admin for investigation

5. **Monitoring & Alerting**:
   - Add application metrics tracking
   - Alert on high failure rates
   - Monitor processing latency

6. **Scaling**:
   - Use job queue (Vercel Queues, AWS SQS) for processing
   - Distribute retry scheduler across multiple instances
   - Implement event sharding

## Example: Tracking a Payment

1. Customer makes payment via Stripe checkout
2. Stripe generates `charge.succeeded` event
3. Event sent to Azure Event Grid
4. Event Grid routes to `/api/webhooks/stripe-events`
5. System stores event with status "received"
6. `processChargeSucceeded()` handler:
   - Updates transaction in database
   - Sends confirmation email
   - Updates user balance
   - Sets status to "completed"
7. User can view event in `/stripe-events` dashboard

## Files Overview

```
lib/
├── types/
│   └── stripe-events.ts          # Event types and interfaces
├── services/
│   ├── stripe-event-service.ts   # Event storage and lifecycle
│   ├── event-processors.ts       # Event type handlers
│   └── event-retry-scheduler.ts  # Automatic retry logic

components/stripe-events/
├── event-list.tsx                # Event list display component
└── event-stats.tsx               # Statistics component

app/
├── stripe-events/
│   └── page.tsx                  # Events dashboard page
├── api/
│   ├── webhooks/stripe-events/
│   │   └── route.ts              # Webhook endpoint
│   ├── stripe-events/
│   │   ├── route.ts              # Get events API
│   │   └── [eventId]/retry/
│   │       └── route.ts          # Retry event API
│   └── admin/stripe-events/
│       └── route.ts              # Admin events API
```

## Troubleshooting

### Events Not Being Received

1. Verify Azure Event Grid destination is active
2. Check partner topic activation status in Azure
3. Confirm webhook endpoint is public and accessible
4. Review Event Grid delivery status in Azure Portal
5. Check Stripe dashboard for webhook delivery logs

### Events Getting Stuck in Processing

1. Check error logs for processor errors
2. Verify business logic doesn't have infinite loops
3. Monitor processor function timeout settings
4. Check database connections if using external database

### High Failure Rate

1. Review error messages in event details
2. Check external service connectivity (email, APIs, etc.)
3. Verify authentication credentials for downstream services
4. Check event data format matches processor expectations

## Support

For issues or questions:
1. Check event details in `/stripe-events` dashboard
2. Review error messages and stack traces
3. Check application logs in `/tmp/` or cloud provider logs
4. Verify Azure Event Grid and Stripe dashboard configurations
