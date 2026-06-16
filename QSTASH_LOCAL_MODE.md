# QStash Local Mode Setup

## Quick Start (5 minutes)

### Terminal 1: Start QStash Local Server
```bash
npm install -g @upstash/qstash-cli
npx @upstash/qstash-cli@latest dev
```

You'll see output like:
```
QStash local server running at http://localhost:8080
```

### Terminal 2: Start Backend
```bash
cd backend
source .venv/bin/activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 3: Start Frontend (Optional)
```bash
npm run dev
```

## Testing QStash Integration

### Test Transfer Notification
```bash
curl -X POST http://localhost:8000/api/qstash/transfer-notification \
  -H "Content-Type: application/json" \
  -d '{"transfer_id":"tf123","amount":100.00,"to_account":"ACC999"}'
```

Expected response:
```json
{
  "status": "queued",
  "message_id": "msg_xxx",
  "event": "transfer_notification"
}
```

### Test Receipt Email
```bash
curl -X POST http://localhost:8000/api/qstash/receipt-email \
  -H "Content-Type: application/json" \
  -d '{"receipt_id":"rc123","email":"user@example.com"}'
```

### Test Account Statement
```bash
curl -X POST http://localhost:8000/api/qstash/account-statement \
  -H "Content-Type: application/json" \
  -d '{"account_id":"acc123"}'
```

### Check Health
```bash
curl http://localhost:8000/api/qstash/health
```

## Monitoring QStash

### View Logs in QStash Console
1. Open http://localhost:8080 in your browser
2. See all published events
3. Check message statuses
4. View retry history

### Backend Logs
Check your terminal running the backend for:
```
Processing QStash event: transfer_notification
Handling transfer notification: {...}
```

## Environment Variables

The following env vars are optional for local development:

```bash
# Local Mode Configuration
QSTASH_LOCAL_MODE=true
QSTASH_URL=http://localhost:8080
QSTASH_TOKEN=  # Leave empty for local mode
QSTASH_SIGNING_KEY=test-key  # For webhook signature verification
```

## Available Endpoints

### Event Triggers
- `POST /api/qstash/transfer-notification` - Queue transfer notification
- `POST /api/qstash/receipt-email` - Queue receipt email
- `POST /api/qstash/account-statement` - Queue account statement
- `POST /api/qstash/compliance-check` - Queue compliance check

### Webhook Handlers
- `POST /api/qstash/webhook` - Main webhook processor

### Health Checks
- `GET /api/qstash/health` - Check QStash status

## Troubleshooting

### "Connection refused" error
- Make sure QStash CLI is running on port 8080
- Check: `curl http://localhost:8080`

### "QSTASH_TOKEN not set" warning
- This is normal in local mode. Token is not required for development.

### Webhook not processing
- Check backend logs for errors
- Verify request payload matches expected format
- Ensure signature verification is working (if enabled)

## Production Setup

When deploying to production:

1. Set `QSTASH_TOKEN` to your real Upstash token
2. Set `QSTASH_URL` to your production endpoint
3. Remove `QSTASH_LOCAL_MODE`
4. Verify webhook URLs are accessible from the internet
5. Set up proper error handling and retries

## Implementation Guide

Add QStash events to your transfer flow:

```python
from utils.qstash_config import publish_event

async def create_transfer(transfer_data):
    # ... create transfer in database
    
    # Queue notification
    await publish_event(
        event_name="transfer_notification",
        data={
            "transfer_id": transfer.id,
            "amount": transfer.amount,
            "to_account": transfer.to_account
        }
    )
    
    return transfer
```

Schedule delayed operations:

```python
# Send receipt email after 5 seconds
await publish_event(
    event_name="receipt_email",
    data={"receipt_id": receipt.id},
    delay_seconds=5
)
```
