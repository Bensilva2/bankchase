# QStash Integration Guide for BankChase

## Architecture Overview

```
Frontend Request
    ↓
FastAPI Route Handler
    ↓
Publish Event to QStash
    ↓
QStash (Local/Cloud)
    ↓
Webhook Handler (retry on failure)
    ↓
Process Background Job
```

## Files Created

### Backend Files

1. **`backend/utils/qstash_config.py`** (140 lines)
   - QStash client initialization
   - `publish_event()` - Queue events for processing
   - `schedule_job()` - Schedule recurring jobs
   - `verify_qstash_signature()` - Secure webhook verification
   - `get_config()` - Configuration inspection

2. **`backend/routes/qstash_webhooks.py`** (179 lines)
   - Main webhook handler with signature verification
   - 4 specific event handlers (transfer, receipt, statement, compliance)
   - 4 trigger endpoints for testing
   - Health check endpoint

3. **`backend/main.py`** (updated)
   - Imported qstash_webhooks router
   - Registered QStash routes

## How to Use

### Publish an Event

```python
from utils.qstash_config import publish_event

# Immediate processing
await publish_event(
    event_name="transfer_notification",
    data={
        "transfer_id": "tf123",
        "amount": 100.00,
        "to_account": "ACC999"
    }
)

# Delayed processing (5 second delay)
await publish_event(
    event_name="receipt_email",
    data={"receipt_id": "rc123", "email": "user@example.com"},
    delay_seconds=5
)

# Custom webhook path
await publish_event(
    event_name="custom_event",
    data={"key": "value"},
    url_path="/api/custom/handler"
)
```

### Handle Webhook Events

```python
# In qstash_webhooks.py
async def handle_transfer_notification(data: Dict[str, Any]) -> Dict[str, Any]:
    """Handle transfer notification events"""
    transfer_id = data.get("transfer_id")
    amount = data.get("amount")
    
    # TODO: Implement your logic
    # - Send email notification
    # - Update database
    # - Call external API
    
    return {"status": "processed"}
```

### Verify Signatures

```python
from utils.qstash_config import verify_qstash_signature

@app.post("/api/webhook")
async def secure_webhook(request: Request):
    signature = request.headers.get("X-Qstash-Signature")
    body = await request.body()
    
    if not verify_qstash_signature(signature, body):
        raise HTTPException(status_code=401, detail="Invalid")
    
    # Process webhook...
```

## Event Types

### 1. Transfer Notification
**Trigger:** `POST /api/qstash/transfer-notification`
```json
{
  "transfer_id": "tf123",
  "amount": 100.00,
  "to_account": "ACC999"
}
```

**Handler:** `handle_transfer_notification()`
- [ ] Send notification email
- [ ] Update transfer status
- [ ] Log to audit trail

### 2. Receipt Email
**Trigger:** `POST /api/qstash/receipt-email`
```json
{
  "receipt_id": "rc123",
  "email": "user@example.com"
}
```

**Handler:** `handle_receipt_email()`
- [ ] Generate PDF receipt
- [ ] Send email
- [ ] Update database

### 3. Account Statement
**Trigger:** `POST /api/qstash/account-statement`
```json
{
  "account_id": "acc123"
}
```

**Handler:** `handle_account_statement()`
- [ ] Fetch transactions
- [ ] Generate PDF statement
- [ ] Email to user

### 4. Compliance Check
**Trigger:** `POST /api/qstash/compliance-check`
```json
{
  "user_id": "user123"
}
```

**Handler:** `handle_compliance_check()`
- [ ] Run KYC checks
- [ ] Verify transaction limits
- [ ] Update compliance status

## Integration Examples

### Example 1: Queue Notification After Transfer

In `routes/pay_transfer_router.py`:
```python
@router.post("/api/transfers")
async def create_transfer(transfer: TransferRequest):
    # Create transfer
    transfer_result = await execute_transfer(transfer)
    
    # Queue notification
    from utils.qstash_config import publish_event
    await publish_event(
        event_name="transfer_notification",
        data={
            "transfer_id": transfer_result.id,
            "amount": transfer.amount,
            "to_account": transfer.to_account
        }
    )
    
    return transfer_result
```

### Example 2: Schedule Delayed Email

```python
from utils.qstash_config import publish_event

# Send receipt after 10 seconds
await publish_event(
    event_name="receipt_email",
    data={
        "receipt_id": receipt.id,
        "email": user.email
    },
    delay_seconds=10
)
```

### Example 3: Batch Processing

```python
from utils.qstash_config import publish_event

# Process monthly statements for all accounts
async def generate_monthly_statements():
    accounts = await fetch_all_accounts()
    
    for account in accounts:
        await publish_event(
            event_name="account_statement",
            data={"account_id": account.id}
        )
```

## Local Development Workflow

### 1. Start QStash Server
```bash
npx @upstash/qstash-cli@latest dev
```

### 2. Start Backend
```bash
cd backend
source .venv/bin/activate
python -m uvicorn main:app --reload
```

### 3. Publish Test Event
```bash
curl -X POST http://localhost:8000/api/qstash/transfer-notification \
  -H "Content-Type: application/json" \
  -d '{"transfer_id":"tf123","amount":100,"to_account":"ACC999"}'
```

### 4. Monitor in QStash Console
Visit http://localhost:8080 and check:
- Message status
- Webhook responses
- Retry count
- Logs

## Error Handling

### Automatic Retries
QStash automatically retries failed webhooks with exponential backoff.

### Custom Retry Logic
```python
# In qstash_webhooks.py
async def handle_transfer_notification(data):
    max_retries = 3
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            # Your logic
            return {"status": "success"}
        except Exception as e:
            retry_count += 1
            if retry_count >= max_retries:
                logger.error(f"Failed after {max_retries} retries: {e}")
                return {"status": "failed"}
            await asyncio.sleep(2 ** retry_count)  # exponential backoff
```

## Testing

### Unit Test Example
```python
import pytest
from utils.qstash_config import publish_event

@pytest.mark.asyncio
async def test_transfer_notification():
    message_id = await publish_event(
        event_name="transfer_notification",
        data={"transfer_id": "test123", "amount": 100}
    )
    
    assert message_id is not None
    assert len(message_id) > 0
```

### Integration Test
```python
# Use QStash local mode for testing
# Events will be processed by your webhook handlers
```

## Production Deployment

### Environment Setup
```bash
# Set in your production environment
QSTASH_TOKEN=<your-upstash-token>
QSTASH_URL=<your-upstash-endpoint>
QSTASH_SIGNING_KEY=<your-signing-key>
```

### Webhook URL Configuration
1. Go to Upstash Console
2. Add your production webhook URL
3. Get signing key for verification

### Monitoring
- Set up logging for all webhook handlers
- Monitor message success/failure rates
- Set up alerts for failed retries
- Track event processing latency

## Troubleshooting

### Event Not Processing
1. Check QStash console for message status
2. Verify webhook handler is implemented
3. Check backend logs for errors
4. Ensure signature verification passes

### Connection Issues
1. Verify QStash server is running
2. Check firewall/CORS settings
3. Ensure QSTASH_URL is correct

### Missing Events
1. Check if publish_event() is being called
2. Verify event name matches handler
3. Check for exceptions in logs

## Next Steps

1. Implement the TODO handlers in `qstash_webhooks.py`
2. Integrate with your transfer/account routes
3. Set up email templates for notifications
4. Configure database persistence
5. Add monitoring and alerting
6. Deploy to production with real Upstash account
