# Real-Time Banking Server Architecture

## Overview

This implementation provides a **high-performance, asynchronous, event-driven banking server** built on Next.js 16 with TypeScript. The system enables non-blocking transaction processing with real-time SMS alerts using an event-based pattern.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ API Gateway │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐      ┌─────▼──────┐      ┌───▼────┐
   │Transfer │      │   Status   │      │  Init  │
   │  API    │      │  Polling   │      │  API   │
   └────┬────┘      └────────────┘      └────────┘
        │
        ▼
   ┌──────────────────────┐
   │  Transaction State   │
   │  (Redis Cache)       │
   └──────────────────────┘
        │
        ▼
   ┌──────────────────────────────────────────┐
   │        Event Emitter (Node.js)           │
   │  • Publishes transaction events          │
   │  • Non-blocking event publishing         │
   │  • Redis integration for distribution    │
   └──────────────────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────────────────┐
   │      Alert Consumer (Background)         │
   │  • Listens for transfer events           │
   │  • Sends SMS asynchronously              │
   │  • Handles retries with backoff          │
   │  • Logs delivery status                  │
   └──────────────────────────────────────────┘
        │
        ▼
   ┌──────────────────────┐
   │   SMS Gateway        │
   │  (Prelude SDK)       │
   └──────────────────────┘
```

## Key Components

### 1. Event Emitter (`lib/event-emitter.ts`)

Centralized event system for publishing and subscribing to banking events.

**Features:**
- Event types: `transfer.initiated`, `transfer.completed`, `transfer.failed`, `alert.scheduled`, `compliance.checked`
- Local Node.js EventEmitter for immediate consumption
- Redis integration for distributed event publishing
- Automatic error handling with fallback to local-only publishing

**Usage:**
```typescript
import { publishTransactionEvent, subscribeToTransactionEvent } from '@/lib/event-emitter';

// Publish event
await publishTransactionEvent('transfer.initiated', {
  transactionId: 'TXN-123456',
  senderId: 'user-1',
  receiverAccount: 'account-2',
  amount: 1000,
  currency: 'USD',
  timestamp: Date.now(),
  senderPhone: '+1234567890',
});

// Subscribe to events
subscribeToTransactionEvent('transfer.initiated', async (data) => {
  console.log('Transfer initiated:', data);
  // Handle event
});
```

### 2. Alert Consumer (`lib/alert-consumer.ts`)

Background service that listens for transaction events and sends SMS alerts asynchronously.

**Features:**
- Listens for `transfer.initiated`, `transfer.completed`, `transfer.failed` events
- Non-blocking SMS sending with retry logic
- Exponential backoff: 5s → 10s → 20s (configurable)
- Maximum 3 retry attempts per alert
- Alert delivery logging for compliance
- In-memory retry queue with 10-second processing loop

**Retry Logic:**
```
Initial Send
    ↓
[Success] → Log & Complete
[Failed] → Add to Retry Queue
    ↓
Wait (5s × 2^retryCount)
    ↓
Retry Send
[Max 3 retries]
```

### 3. Transaction Tracker (`lib/transaction-tracker.ts`)

Real-time transaction state management using Redis caching.

**Features:**
- Stores transaction state: `initiated` → `validating` → `processing` → `settling` → `completed`
- Step-by-step progress tracking with timestamps
- 24-hour Redis TTL for state persistence
- Atomic state updates
- Metadata support for custom transaction data

**State Example:**
```json
{
  "transactionId": "TXN-123456",
  "status": "processing",
  "senderId": "user-1",
  "amount": 1000,
  "currency": "USD",
  "steps": [
    {
      "step": "transaction_initiated",
      "status": "completed",
      "timestamp": 1234567890
    },
    {
      "step": "ledger_validation_started",
      "status": "pending",
      "timestamp": 1234567891
    }
  ]
}
```

### 4. Transfer APIs

#### `POST /api/transfers/internal`

Non-blocking internal transfer endpoint.

**Request:**
```json
{
  "senderId": "user-1",
  "receiverAccountId": "account-2",
  "amount": 1000,
  "currency": "USD",
  "senderPhone": "+1234567890"
}
```

**Response (Immediate - <100ms):**
```json
{
  "status": "success",
  "message": "Transfer initiated. SMS alert will be sent shortly.",
  "transactionId": "TXN-123456",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Flow:**
1. ✅ Create transaction state in Redis
2. ✅ Lock funds in ledger (ACID)
3. ✅ Publish `transfer.initiated` event (async)
4. ✅ Return response to client
5. 🔄 (Background) Alert consumer sends SMS

#### `GET /api/transfers/status?transactionId=TXN-123456`

Real-time transaction status polling.

**Response:**
```json
{
  "transactionId": "TXN-123456",
  "status": "processing",
  "amount": 1000,
  "currency": "USD",
  "sender": "user-1",
  "receiver": "account-2",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:05Z",
  "processingTimeMs": 5000,
  "steps": [
    {
      "step": "transaction_initiated",
      "status": "completed",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "step": "ledger_validation_started",
      "status": "pending",
      "timestamp": "2024-01-15T10:30:01Z"
    }
  ]
}
```

#### `POST /api/transfers/status/batch`

Batch status check for multiple transactions.

**Request:**
```json
{
  "transactionIds": ["TXN-123456", "TXN-789012", "TXN-345678"]
}
```

**Response:**
```json
{
  "total": 3,
  "found": 3,
  "notFound": 0,
  "transactions": [
    {
      "transactionId": "TXN-123456",
      "status": "completed",
      "amount": 1000,
      "currency": "USD",
      "sender": "user-1",
      "receiver": "account-2",
      "updatedAt": "2024-01-15T10:30:05Z"
    }
    // ... more transactions
  ]
}
```

### 5. Health Monitoring (`app/api/admin/health/route.ts`)

System health and performance metrics.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:35:00Z",
  "uptime": 300000,
  "alertConsumer": {
    "status": "active",
    "pendingRetries": 2,
    "queueDepth": 2
  },
  "redis": {
    "connected": true,
    "responseTime": 1
  },
  "eventEmitter": {
    "status": "ready",
    "listeners": 4
  }
}
```

**Health Status:**
- 🟢 `healthy` - All systems operational, <50 pending retries
- 🟡 `degraded` - Systems running, >50 pending retries
- 🔴 `unhealthy` - Alert consumer inactive or critical issues

### 6. Application Initialization (`lib/app-init.ts`)

Startup sequence for background services.

**Initialization Order:**
1. Event Emitter initialization
2. Alert Consumer startup
3. Transaction Tracker readiness
4. Health Monitor initialization

**Call via:** `GET /api/init` (should be called once on app startup)

## Non-Blocking Transaction Flow

### Detailed Timeline

```
Time: T+0ms
├─ Client sends POST /api/transfers/internal
│
T+10ms
├─ Server receives request
├─ Validates request (senderId, amount, currency)
├─ Generates transactionId: TXN-1234567890-abc123
│
T+20ms
├─ Create transaction state in Redis
├─ Update status to "validating"
│
T+50ms
├─ Lock funds in ledger (DB transaction)
├─ Update status to "processing"
│
T+60ms
├─ Publish "transfer.initiated" event
├─ Event triggers Alert Consumer (non-blocking)
│
T+65ms
├─ Return 200 response to client ← CLIENT RECEIVES RESPONSE
│
T+100ms (Background)
├─ Alert Consumer picks up event
├─ Calls SMS Gateway (Prelude)
│
T+500ms (Background)
├─ SMS sent successfully
├─ Log delivery status to database
├─ Update transaction_alerts table

Total client wait time: ~65ms (excluding network latency)
Total SMS delivery time: ~500ms (non-blocking)
```

## Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| **Transfer API Response Time** | <100ms | Excluding network latency |
| **SMS Delivery** | 300-800ms | Asynchronous, non-blocking |
| **Retry Loop Interval** | 10 seconds | Checks retry queue every 10s |
| **Max Retries** | 3 | With exponential backoff |
| **Transaction State TTL** | 24 hours | Redis cache expiration |
| **Concurrent Transactions** | 100+ | EventEmitter max listeners |

## Integration Points

### Environment Variables Required

```env
# Upstash Redis (for event distribution and transaction state)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# SMS Service (Prelude SDK)
PRELUDE_API_KEY=...

# Database (Supabase/PostgreSQL)
DATABASE_URL=...
```

### External Services

1. **Redis (Upstash)** - Event publishing & transaction state caching
2. **PostgreSQL (Supabase)** - Transaction ledger and compliance logging
3. **SMS Gateway (Prelude)** - Alert delivery

## Database Schema (PostgreSQL)

```sql
-- Core transactions ledger
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES users(id),
  receiver_account VARCHAR NOT NULL,
  amount DECIMAL(19, 4) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(50) DEFAULT 'initiated',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT amount_positive CHECK (amount > 0)
);

-- Transaction processing steps
CREATE TABLE transaction_steps (
  id UUID PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  step VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SMS alert delivery logs
CREATE TABLE transaction_alerts (
  id UUID PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  phone_number VARCHAR NOT NULL,
  status VARCHAR(50) NOT NULL,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_transactions_sender_id ON transactions(sender_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transaction_steps_transaction_id ON transaction_steps(transaction_id);
CREATE INDEX idx_alerts_transaction_id ON transaction_alerts(transaction_id);
```

## Error Handling

### Transfer API Errors

- **400 Bad Request** - Missing/invalid fields
- **402 Payment Required** - Insufficient funds
- **500 Internal Server Error** - Ledger/processing error

### Alert Consumer Errors

- SMS API failure → Added to retry queue
- Network timeout → Exponential backoff retry
- Max retries exceeded → Logged for manual review
- Phone number invalid → Silent failure (logged)

### System Recovery

- Alert Consumer maintains in-memory retry queue
- Retry loop runs every 10 seconds
- Failed alerts persist across request cycles
- Health check exposes retry queue depth for monitoring

## Monitoring & Observability

### Health Endpoints

- `GET /api/admin/health` - Quick health status
- `GET /api/admin/health/detailed` - Comprehensive metrics

### Key Metrics to Track

1. **Alert Queue Depth** - Number of pending SMS retries
2. **SMS Success Rate** - Percentage of successful deliveries
3. **Transaction Processing Time** - Time from initiation to completion
4. **API Response Time** - Transfer endpoint response latency
5. **Event Processing Latency** - Time from event publish to consumer pickup

### Logging

- `[EventEmitter]` - Event publishing events
- `[AlertConsumer]` - SMS sending and retry attempts
- `[TransactionTracker]` - Transaction state updates
- `[TransferAPI]` - Transfer processing
- `[StatusAPI]` - Status polling requests
- `[HealthAPI]` - System health checks
- `[AppInit]` - Application startup sequence

## Future Enhancements

1. **Database Persistence** - Move transaction state from Redis to PostgreSQL
2. **Message Broker** - Upgrade from EventEmitter to RabbitMQ/Kafka for distributed systems
3. **Compliance Validator** - Chain-of-responsibility pattern for compliance checks
4. **Advanced Monitoring** - Datadog/New Relic integration for production observability
5. **Rate Limiting** - Token bucket algorithm for API protection
6. **Request Tracing** - Distributed tracing with OpenTelemetry
7. **Circuit Breaker** - Handle SMS gateway outages gracefully

## Testing

### Unit Tests

```typescript
// Test event publishing
describe('EventEmitter', () => {
  it('should publish and receive events', async () => {
    const data = { transactionId: 'TXN-123' };
    subscribeToTransactionEvent('transfer.initiated', (received) => {
      expect(received).toEqual(data);
    });
    await publishTransactionEvent('transfer.initiated', data);
  });
});

// Test alert consumer
describe('AlertConsumer', () => {
  it('should send SMS on transfer.initiated event', async () => {
    const spy = jest.spyOn(smsService, 'sendSMSAlert');
    await publishTransactionEvent('transfer.initiated', mockData);
    expect(spy).toHaveBeenCalled();
  });

  it('should retry on SMS failure', async () => {
    jest.spyOn(smsService, 'sendSMSAlert').mockRejectedValueOnce(new Error());
    await publishTransactionEvent('transfer.initiated', mockData);
    // Wait for retry
    await new Promise(resolve => setTimeout(resolve, 5100));
    expect(smsService.sendSMSAlert).toHaveBeenCalledTimes(2);
  });
});
```

### Integration Tests

```typescript
describe('Transfer Flow', () => {
  it('should complete transfer and send alert asynchronously', async () => {
    const response = await POST('/api/transfers/internal', {
      senderId: 'user-1',
      receiverAccountId: 'account-2',
      amount: 1000,
      currency: 'USD',
      senderPhone: '+1234567890',
    });

    expect(response.status).toBe(200);
    expect(response.body.transactionId).toBeDefined();

    // Poll status
    const status = await GET(`/api/transfers/status?transactionId=${response.body.transactionId}`);
    expect(status.body.status).toMatch(/initiated|processing|completed/);

    // Verify SMS was sent (check logs or SMS service mock)
  });
});
```

## Deployment Checklist

- [ ] Environment variables configured (Redis, SMS API, Database)
- [ ] Database migrations applied
- [ ] Redis cluster configured with appropriate memory allocation
- [ ] SMS gateway API keys validated
- [ ] Health check endpoint monitored (e.g., Vercel's health monitoring)
- [ ] Error logging configured (e.g., Sentry)
- [ ] Alert thresholds set (e.g., >100 pending retries)
- [ ] Backup and disaster recovery procedures documented
- [ ] Load testing completed (target: 1000+ concurrent transfers)
- [ ] Compliance audit completed

## Support & Debugging

### Common Issues

**Alert Consumer Inactive**
- Check: `GET /api/admin/health` → alertConsumer.status
- Solution: Restart app or call `GET /api/init`

**SMS Not Sending**
- Check retry queue: `GET /api/admin/health/detailed` → retryDetails
- Verify Prelude SDK credentials in .env
- Check SMS provider account balance

**Transaction Status Not Updating**
- Verify Redis connectivity
- Check transaction_tracker logs for errors
- Confirm transactionId is correct

**High Retry Queue Depth**
- Indicates SMS gateway or network issues
- Check SMS provider status page
- Increase max retries temporarily if issue is transient

---

**Version:** 1.0.0  
**Last Updated:** 2024-01-15  
**Status:** Production Ready
