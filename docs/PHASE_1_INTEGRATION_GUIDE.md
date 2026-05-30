# Phase 1: Real-Time Transfer Processing - Integration Guide

## Overview

Phase 1 implements a production-grade transfer processing system with ACID guarantees, idempotency protection, real-time status tracking, and SMS alerts.

## Architecture Diagram

```
Client Request
    ↓
POST /api/transfers/process
    ↓
[1] Authenticate & Validate
    ↓
[2] Check Idempotency Key
    ↓ (duplicate found?)
    └─→ Return existing transaction (202)
    ↓ (new request)
[3] Process Transfer (processTransfer function)
    ├─ Start DB transaction
    ├─ Validate balance
    ├─ Lock accounts (row-level)
    ├─ Create ledger entries
    └─ Commit transaction
    ↓
[4] Queue SMS Alert
    ├─ Redis LPUSH sms:queue
    └─ Background worker processes
    ↓
Return 202 Accepted
    ├─ transactionId
    ├─ status: 'pending'
    └─ pollUrl: /api/transfers/status

Client Polls for Status (5-second intervals)
    ↓
GET /api/transfers/status?transactionId=xxx
    ↓
    Loop until completed/failed
    └─ Return progress %, stage, message

Payment Provider Webhook
    ↓
POST /api/webhooks/payment-provider
    ├─ Verify HMAC signature
    ├─ Update transaction status
    ├─ Create ledger entries
    └─ Queue completion SMS
    ↓
Return 200 OK
```

## Files Created/Modified

### Core Infrastructure
- `lib/transfer-processor.ts` - Transfer processing with ACID guarantees
- `lib/transfer-integration.ts` - Workflow orchestration (NEW)
- `lib/sms-alert-service.ts` - SMS delivery abstraction (NEW)
- `lib/transaction-ledger-service.ts` - Double-entry ledger operations
- `migrations/001-ledger-schema.sql` - Database schema with indexes

### API Endpoints
- `app/api/transfers/process/route.ts` - Initiate transfers
- `app/api/transfers/status/route.ts` - Poll transfer status
- `app/api/webhooks/payment-provider/route.ts` - Provider callbacks
- `app/api/sms/alert/route.ts` - SMS alert dispatcher

### Frontend Components
- `components/transaction-monitor.tsx` - Real-time status display
- `components/demo-transfer-form.tsx` - Transfer initiation UI
- `components/transaction-metrics.tsx` - Analytics dashboard

## Setup Instructions

### 1. Database Schema

Run the migration to create transfer tables:

```bash
# Via Supabase SQL Editor
psql "your-connection-string" < migrations/001-ledger-schema.sql
```

Tables created:
- `transaction_ledger` - Main transfer records
- `ledger_entries` - Double-entry audit log
- `sms_logs` - SMS delivery tracking

### 2. Environment Variables

Add to your `.env.local`:

```env
# SMS Provider (twilio or infobip)
SMS_PROVIDER=twilio

# Twilio (if using Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Infobip (if using Infobip)
INFOBIP_API_KEY=your-api-key
INFOBIP_BASE_URL=https://api.infobip.com
INFOBIP_SENDER_ID=BankChase

# Redis (for SMS queue)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Webhook Security
WEBHOOK_SECRET=your-secret-key-for-hmac
```

### 3. Configure Payment Providers

For each provider (Wise, CurrencyCloud, etc.):

1. Register webhook endpoint: `https://yourdomain.com/api/webhooks/payment-provider`
2. Add provider signature header mapping in `lib/webhook-verifier.ts`
3. Test webhook signature verification

### 4. SMS Queue Processing

Create a background worker to process SMS queue. Options:

**Option A: Vercel Cron Jobs**
```typescript
// app/api/cron/sms-queue/route.ts
import { processSmsQueue } from '@/lib/sms-alert-service'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const result = await processSmsQueue()
  return Response.json(result)
}

// Add to vercel.json:
// "crons": [{
//   "path": "/api/cron/sms-queue",
//   "schedule": "*/5 * * * *"
// }]
```

**Option B: External Service**
```bash
# Run in separate worker container
node scripts/sms-queue-worker.js
```

## API Usage Examples

### 1. Initiate Transfer

```bash
curl -X POST http://localhost:3000/api/transfers/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "fromAccountId": "acc_123",
    "toAccountNumber": "IBAN123456",
    "toBankCode": "DEUTDEFF",
    "amount": 100.00,
    "currency": "EUR",
    "narration": "Payment for invoice #123"
  }'

# Response (202 Accepted):
{
  "status": "processing",
  "transactionId": "txn_abc123",
  "message": "Transfer initiated. Processing in background...",
  "_links": {
    "status": "/api/transfers/status/txn_abc123",
    "poll_interval_ms": 5000
  }
}
```

### 2. Poll Transfer Status

```bash
curl http://localhost:3000/api/transfers/status?transactionId=txn_abc123 \
  -H "Authorization: Bearer your-jwt-token"

# Response (200 OK):
{
  "transaction": {
    "id": "txn_abc123",
    "status": "processing",
    "amount": 100,
    "currency": "EUR",
    "elapsedSeconds": 12
  },
  "progress": {
    "percent": 50,
    "message": "Processing through payment network...",
    "stage": "processing"
  },
  "_meta": {
    "timestamp": "2024-01-15T10:30:45Z",
    "pollIntervalMs": 5000
  }
}
```

### 3. Webhook Callback (from Provider)

```bash
curl -X POST http://localhost:3000/api/webhooks/payment-provider \
  -H "Content-Type: application/json" \
  -H "x-provider-name: wise" \
  -H "x-provider-signature: sha256=..." \
  -d '{
    "event_id": "evt_123",
    "transaction_id": "txn_abc123",
    "status": "delivered",
    "provider_reference_id": "WISE123456"
  }'

# Response (200 OK):
{
  "success": true,
  "message": "Webhook processed successfully",
  "event_id": "evt_123",
  "transaction_id": "txn_abc123"
}
```

### 4. Send SMS Alert

```bash
curl -X POST http://localhost:3000/api/sms/alert \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "transactionId": "txn_abc123",
    "type": "transfer_completed",
    "amount": 100,
    "currency": "EUR"
  }'

# Response (200 OK):
{
  "success": true,
  "messageId": "msg_123",
  "message": "SMS sent successfully",
  "phoneNumber": "****5678"
}
```

## Testing Workflow

### 1. Unit Tests

```bash
npm test -- lib/transfer-processor.test.ts
npm test -- lib/sms-alert-service.test.ts
npm test -- lib/transfer-integration.test.ts
```

### 2. Integration Test Flow

```bash
# 1. Create transfer
TXID=$(curl -s -X POST http://localhost:3000/api/transfers/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"fromAccountId":"acc_1","toAccountNumber":"IBAN123","toBankCode":"DEUTDEFF","amount":100,"currency":"EUR"}' \
  | jq -r '.transactionId')

# 2. Poll status
for i in {1..10}; do
  curl -s http://localhost:3000/api/transfers/status?transactionId=$TXID \
    -H "Authorization: Bearer $TOKEN" | jq '.progress'
  sleep 5
done

# 3. Simulate webhook from provider
curl -X POST http://localhost:3000/api/webhooks/payment-provider \
  -H "Content-Type: application/json" \
  -H "x-provider-name: test" \
  -H "x-provider-signature: test-sig" \
  -d "{\"transaction_id\":\"$TXID\",\"status\":\"delivered\"}"

# 4. Check final status
curl -s http://localhost:3000/api/transfers/status?transactionId=$TXID \
  -H "Authorization: Bearer $TOKEN" | jq '.transaction.status'
```

### 3. End-to-End Test

Use the demo transfer form at `/demo-transfers`:
1. Fill in transfer details
2. Click "Send Transfer"
3. Watch real-time status updates
4. Check SMS logs for alerts
5. Verify ledger entries in database

## Performance Metrics

Expected latencies:
- Transfer initiation API: <100ms
- Status check API: <50ms
- Webhook processing: <500ms
- SMS queue processing: <2s per message

Expected throughput:
- 1000 transfers/second
- 50,000 status checks/second

## Troubleshooting

### Transfer stuck in "pending"

1. Check webhook is being called: `SELECT * FROM webhook_logs WHERE transaction_id = 'xxx'`
2. Verify provider signature: Check WEBHOOK_SECRET env var
3. Check Redis connection: `redis-cli LLEN sms:queue`

### SMS not sending

1. Check Twilio/Infobip credentials in env vars
2. Verify phone numbers: Look in `sms_logs` table
3. Check SMS queue: `redis-cli LRANGE sms:queue 0 -1`

### Duplicate transfers

1. Idempotency key not provided
2. Use `idempotency-key` header in request
3. Key format: UUID or `${userId}-${timestamp}`

## Next Steps

- Implement error recovery and automatic retries
- Add transaction dispute handling (Phase 2)
- Build admin dashboard for transaction monitoring
- Set up monitoring and alerting
- Load testing with k6 or JMeter

## Support

See `/docs` for:
- `RBAC_ARCHITECTURE.md` - Role-based access control
- `MONGODB_INTEGRATION.md` - NoSQL data storage
- `HYBRID_ARCHITECTURE_SUMMARY.md` - Database strategy
