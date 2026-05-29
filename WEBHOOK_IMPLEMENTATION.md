# Webhook Implementation Guide

## Overview

The BankChase webhook system enables real-time event notifications for key banking operations. This implementation provides:

- **Webhook CRUD Management**: Create, list, update, and delete webhooks
- **Event Subscriptions**: Subscribe to specific event types (transfers, balance updates)
- **Secure Delivery**: HMAC-SHA256 signature verification for all webhook payloads
- **Automatic Retries**: Exponential backoff retry logic with up to 24 hours of retry window
- **Event History**: Complete audit trail of webhook events and retry attempts

## Database Schema

### Tables Created

1. **webhooks** - Stores webhook configurations
   - `id`: UUID primary key
   - `user_id`: Owner of the webhook
   - `url`: Endpoint URL for webhook delivery
   - `secret`: Encrypted secret for HMAC signing
   - `events`: Array of subscribed event types
   - `is_active`: Enable/disable webhooks
   - `created_at`, `updated_at`, `last_triggered_at`: Timestamps

2. **webhook_events** - Audit trail of webhook events
   - `id`: UUID primary key
   - `webhook_id`: Reference to webhook
   - `event_type`: Type of event (transfer.completed, balance.updated, etc.)
   - `payload`: Full event data as JSON
   - `status`: pending, succeeded, failed, max_retries
   - `created_at`: When event was triggered
   - `last_attempt_at`: Last delivery attempt
   - `next_retry_at`: When next retry is scheduled
   - `retry_count`: Number of delivery attempts

3. **webhook_retries** - Tracks retry attempts for failed deliveries
   - `id`: UUID primary key
   - `event_id`: Reference to webhook_event
   - `webhook_id`: Reference to webhook
   - `attempt_number`: Which attempt (1-5)
   - `status`: pending, succeeded, failed
   - `response_code`: HTTP response code from endpoint
   - `response_body`: Response body from endpoint
   - `next_retry_at`: When to retry next
   - `created_at`: When retry was created
   - `error_message`: Error details

## API Endpoints

All endpoints require authentication via JWT token in Authorization header.

### Webhook Management

#### Create Webhook
```
POST /api/webhooks
{
  "url": "https://example.com/webhook",
  "events": ["transfer.completed", "balance.updated"]
}
```

Response:
```
{
  "id": "uuid",
  "url": "https://example.com/webhook",
  "events": ["transfer.completed", "balance.updated"],
  "is_active": true,
  "created_at": "2024-04-29T10:30:00Z"
}
```

#### List Webhooks
```
GET /api/webhooks
```

Returns array of webhook configurations for the current user.

#### Update Webhook
```
PATCH /api/webhooks/{webhook_id}
{
  "url": "https://example.com/webhook-new",
  "events": ["transfer.completed"],
  "is_active": false
}
```

#### Delete Webhook
```
DELETE /api/webhooks/{webhook_id}
```

### Event Tracking

#### Get Webhook Events
```
GET /api/webhooks/{webhook_id}/events?limit=50&offset=0
```

Returns list of events delivered to this webhook with:
- Event type
- Payload
- Delivery status
- Retry count
- Next retry time

#### Get Webhook Stats
```
GET /api/webhooks/{webhook_id}/stats
```

Returns statistics including:
- Total events
- Successful deliveries
- Failed deliveries
- Average response time
- Last event time

## Event Types

### transfer.completed
Triggered when a transfer is successfully completed.

```json
{
  "transfer_id": "uuid",
  "from_account": "1234567890",
  "to_account": "0987654321",
  "amount": 100.00,
  "status": "completed",
  "currency": "USD",
  "timestamp": "2024-04-29T10:30:00Z",
  "debit_transaction_id": "uuid",
  "credit_transaction_id": "uuid"
}
```

### transfer.pending
Triggered when a transfer is initiated but pending (for external transfers).

```json
{
  "transfer_id": "uuid",
  "from_account": "1234567890",
  "to_account": "0987654321",
  "amount": 100.00,
  "status": "pending",
  "currency": "USD",
  "timestamp": "2024-04-29T10:30:00Z",
  "debit_transaction_id": "uuid",
  "credit_transaction_id": "uuid"
}
```

### balance.updated
Triggered after any account balance change.

```json
{
  "account": "1234567890",
  "balance": 5000.00,
  "timestamp": "2024-04-29T10:30:00Z"
}
```

## Security

### HMAC Signature Verification

Every webhook delivery includes a `X-Webhook-Signature` header with HMAC-SHA256 signature:

```
X-Webhook-Signature: sha256=<hex-encoded-hmac>
```

To verify:
1. Get the webhook secret from your webhook configuration
2. Create HMAC-SHA256 hash of the request body using the secret
3. Compare with `X-Webhook-Signature` header

Example (Node.js):
```javascript
const crypto = require('crypto');
const signature = req.get('X-Webhook-Signature').split('=')[1];
const hmac = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(req.body))
  .digest('hex');
const isValid = hmac === signature;
```

### Encryption

Webhook secrets are encrypted in the database using AES-256-GCM encryption. The encryption key is stored securely in environment variables.

## Retry Logic

Failed webhook deliveries are automatically retried with exponential backoff:

- **Attempt 1**: Immediate (if initial delivery fails)
- **Attempt 2**: 5 minutes
- **Attempt 3**: 30 minutes
- **Attempt 4**: 2 hours
- **Attempt 5**: 24 hours

After 5 failed attempts, the event is marked as failed and no further retries are attempted.

### Retry Triggers

Retries are triggered when:
- HTTP status code is >= 400
- Network timeout (30 seconds)
- Connection refused
- DNS resolution failure

### Processing Retries

Background job processes pending retries every minute. To manually trigger:

```
POST /api/webhooks/retry-process
```

## Integration Points

### Transfer Flow

When a transfer is initiated via `POST /api/transfers/send`, the following webhooks are triggered:

1. **transfer.completed** or **transfer.pending** - Sent to both sender and receiver
2. **balance.updated** - Sent to both sender and receiver with updated balances

### Event Triggering

The webhook system is integrated into `/backend/routes/pay_transfer.py`:

```python
# After transfer is recorded, trigger webhooks asynchronously
asyncio.create_task(trigger_webhook_event(
    user_id,
    "transfer.completed",
    {
        "transfer_id": transfer_id,
        "amount": amount,
        # ... payload
    }
))
```

## Monitoring and Debugging

### View Event Status

```bash
# Get all webhook events for a webhook
curl -H "Authorization: Bearer $TOKEN" \
  https://api.bankchase.com/api/webhooks/{webhook_id}/events

# Get webhook statistics
curl -H "Authorization: Bearer $TOKEN" \
  https://api.bankchase.com/api/webhooks/{webhook_id}/stats
```

### Common Issues

**Webhook not receiving events:**
- Verify webhook URL is correct and accessible
- Check webhook is marked as `is_active: true`
- Verify webhook subscription includes the event type
- Check logs for delivery failures

**Signature verification failing:**
- Ensure you're using the correct secret
- Verify you're hashing the raw request body
- Check that timestamp skew isn't too large

**Retries not processing:**
- Ensure background retry job is running
- Check database for stuck events in `pending` status
- Review error messages in webhook_retries table

## Implementation Details

### File Structure

```
backend/
├── routes/
│   ├── webhooks.py          # Webhook CRUD endpoints
│   └── pay_transfer.py      # Integration with transfers
├── utils/
│   ├── webhook_events.py    # Event triggering and delivery logic
│   └── webhook_retry.py     # Retry processing worker
├── models.py                # Webhook Pydantic models
└── main.py                  # FastAPI app with webhook router

scripts/
├── 008_create_webhooks_table.sql
├── 009_create_webhook_events_table.sql
└── 010_create_webhook_retries_table.sql
```

### Key Functions

**trigger_webhook_event()** - `webhook_events.py`
- Finds all active webhooks subscribed to event type
- Creates webhook_events record
- Attempts delivery with HMAC signature
- Creates webhook_retry records on failure

**process_pending_retries()** - `webhook_retry.py`
- Fetches pending retries due for processing
- Attempts delivery with exponential backoff
- Updates retry status and next retry time
- Moves to failed status after 5 attempts

**_send_webhook_request()** - `webhook_events.py`
- HTTP POST to webhook URL
- Adds HMAC signature header
- Handles timeouts and connection errors
- Returns HTTP status code

## Environment Variables

Required:
- `WEBHOOK_SECRET_KEY` - AES encryption key for secrets (32 bytes, hex-encoded)
- `DATABASE_URL` or `POSTGRES_URL` - PostgreSQL connection string

## Performance Considerations

- Webhook deliveries are non-blocking (fire-and-forget)
- Events are persisted immediately
- Retries are processed asynchronously
- Webhook queries are indexed for quick lookups
- Event pagination supports large histories

## Future Enhancements

- [ ] Webhook event filtering with JQ selectors
- [ ] Signature verification libraries for SDK
- [ ] Webhook delivery templates
- [ ] Rate limiting per webhook
- [ ] Webhook replay functionality
- [ ] Webhook testing endpoint
- [ ] Admin dashboard for webhook management
