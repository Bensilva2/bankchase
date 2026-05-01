# Workflows Module

Integration with Vercel Workflow SDK for durable, resumable workflows in BankChase.

## Architecture

```
FastAPI Backend (main.py)
  ↓
/api/workflows routes (routes.py)
  ↓
WorkflowClient (client.py) - HTTP bridge to Vercel
  ↓
Vercel Workflow SDK (Next.js)
  ↓
Step Functions (email, Slack, database, payments)
  ↓
Database (models.py)
```

## Components

### 1. WorkflowClient (`client.py`)
HTTP client that communicates with the Vercel Workflow API running in Next.js.

**Key Methods:**
- `start_workflow()` - Trigger a new workflow execution
- `get_workflow_status()` - Check workflow status
- `resume_hook()` - Resume paused workflow
- `handle_webhook()` - Accept webhook callbacks

**Usage:**
```python
client = get_workflow_client()
result = await client.start_workflow(
    workflow_type="transfer",
    user_id="user-123",
    org_id="default",
    payload={"from_account": "...", "to_account": "...", "amount": 100}
)
print(result["run_id"])
```

### 2. Models (`models.py`)
SQLAlchemy ORM models for workflow persistence:

- `WorkflowRun` - Central execution log
- `WorkflowEvent` - Step-by-step audit trail
- `WorkflowHook` - Pause/resume tracking
- `MoneyTransfer` - Transfer workflow data
- `LoanApplication` - Loan application data
- `PaymentDispute` - Dispute workflow data
- `AccountClosure` - Account closure data
- `BillPayment` - Bill payment data
- `AccountOpening` - Account opening/KYC data

All models include Row-Level Security (RLS) for multi-tenant isolation.

### 3. Routes (`routes.py`)
FastAPI endpoints for workflow management:

**Workflow Triggers:**
- `POST /api/workflows/transfer` - Start money transfer
- `POST /api/workflows/loan-application` - Start loan application
- `POST /api/workflows/dispute` - Start payment dispute
- `POST /api/workflows/bill-payment` - Start bill payment
- `POST /api/workflows/account-opening` - Start account opening

**Status & Management:**
- `GET /api/workflows` - List user's workflows
- `GET /api/workflows/{run_id}` - Get workflow details
- `GET /api/workflows/{run_id}/events` - Get execution events

**Hooks & Webhooks:**
- `POST /api/workflows/hooks/resume` - Resume paused workflow
- `POST /api/workflows/webhooks/callback` - Handle webhook callback

## Workflow Types

### 1. Money Transfer
**Status Flow:** pending → validating → fraud_check → processing → completed
**Hooks:** None (synchronous)
**Notifications:** Email confirmation, Slack alerts on fraud detection

```python
await client.start_workflow(
    workflow_type="transfer",
    payload={
        "from_account_id": "acc-123",
        "to_account_id": "acc-456",
        "amount": 100.00,
        "reference": "REF-001"
    }
)
```

### 2. Loan Application
**Status Flow:** submitted → kyc_pending → credit_check → offer_generated → accepted → approved → disbursed
**Hooks:** kyc_verification (document upload), acceptance (user confirmation)
**Notifications:** Email updates at each stage, Slack alerts for approvals

```python
await client.start_workflow(
    workflow_type="loan_application",
    payload={
        "loan_amount": 5000,
        "loan_term_months": 24,
        "employment_status": "employed",
        "annual_income": 50000
    }
)
```

### 3. Payment Dispute
**Status Flow:** submitted → under_investigation → evidence_requested → evidence_received → resolved
**Hooks:** evidence_upload (dispute evidence), merchant_response (evidence collection)
**Notifications:** Email status updates, Slack escalation alerts

```python
await client.start_workflow(
    workflow_type="payment_dispute",
    payload={
        "transaction_id": "txn-789",
        "disputed_amount": 50.00,
        "dispute_reason": "unauthorized"
    }
)
```

### 4. Bill Payment
**Status Flow:** scheduled → pending → processing → completed (with retry)
**Hooks:** payment_confirmation (external system callback)
**Notifications:** Email receipts, Slack alerts on failures

```python
await client.start_workflow(
    workflow_type="bill_payment",
    payload={
        "payee_name": "Electric Company",
        "amount": 150.00,
        "scheduled_date": "2024-06-01T00:00:00Z",
        "is_recurring": True,
        "frequency": "monthly"
    }
)
```

### 5. Account Closure
**Status Flow:** initiated → verified → transactions_cleared → refunds_processed → archived → completed
**Hooks:** verification (user confirmation), archive_confirmation (final approval)
**Notifications:** Confirmation emails, Slack audit trail

```python
await client.start_workflow(
    workflow_type="account_closure",
    payload={
        "account_id": "acc-123",
        "reason": "customer_request",
        "details": "Closing due to account consolidation"
    }
)
```

### 6. Account Opening
**Status Flow:** initiated → kyc_pending → kyc_verified → documents_requested → documents_received → approved → account_created → completed
**Hooks:** kyc_verification (KYC submission), document_collection (document upload)
**Notifications:** Email status updates, Slack approvals

```python
await client.start_workflow(
    workflow_type="account_opening",
    payload={
        "account_type": "checking",
        "phone_number": "+1234567890",
        "email": "user@example.com"
    }
)
```

## Integration with FastAPI Main App

In `main.py`, include the workflows router:

```python
from app.workflows import workflows_router

app.include_router(workflows_router)
```

This makes all workflow endpoints available at `/api/workflows/*`.

## Database Integration

All workflow data is persisted to PostgreSQL with automatic RLS. The database schema is created by migrations:

- `012_create_workflow_runs.sql` - Core workflow table
- `013_create_workflow_events.sql` - Event log
- `014_create_workflow_hooks.sql` - Hook tracking
- `015_create_money_transfers.sql` - Transfer data
- `016_create_loan_applications.sql` - Loan data
- `017_create_payment_disputes.sql` - Dispute data
- `018_create_account_closures.sql` - Closure data
- `019_create_bill_payments.sql` - Payment data
- `020_create_account_openings.sql` - Opening data

Run migrations:
```bash
python scripts/run_migrations.py
```

## Error Handling

### Workflow Client Errors
```python
try:
    result = await client.start_workflow(...)
except httpx.HTTPError as e:
    logger.error(f"Workflow API error: {e}")
    # Retry logic or fallback
```

### Database Errors
```python
try:
    db.add(workflow_run)
    db.commit()
except SQLAlchemyError as e:
    db.rollback()
    logger.error(f"Database error: {e}")
```

## Monitoring & Debugging

### Check Workflow Status
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/workflows/run-123
```

### View Execution Events
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/workflows/run-123/events
```

### Check Workflow Health
```bash
curl http://localhost:8000/api/workflows/health
```

### View Logs
```bash
docker-compose logs -f api | grep "workflow"
```

## Environment Variables

```bash
# Workflow Configuration
WORKFLOW_ENDPOINT=http://localhost:3000/api/workflows
WORKFLOW_API_KEY=dev-key-change-in-production
WORKFLOW_BACKEND=vercel

# Notifications
RESEND_API_KEY=<your-resend-key>
SLACK_WEBHOOK_URL=<your-slack-webhook>
TWILIO_ACCOUNT_SID=<your-twilio-sid>

# Database
DATABASE_URL=postgresql://user:password@host/db
```

## Testing Workflows

### Local Testing
```python
# In a test file
from app.workflows import get_workflow_client

async def test_transfer_workflow():
    client = get_workflow_client()
    result = await client.start_workflow(
        workflow_type="transfer",
        user_id="test-user",
        org_id="default",
        payload={
            "from_account_id": "acc-1",
            "to_account_id": "acc-2",
            "amount": 100
        }
    )
    assert "run_id" in result
```

### Docker Testing
```bash
# Start all services
docker-compose up -d

# Test workflow endpoint
curl -X POST http://localhost:8000/api/workflows/transfer \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "from_account_id": "acc-1",
      "to_account_id": "acc-2",
      "amount": 100
    }
  }'
```

## Production Deployment

1. **Set environment variables** in your deployment platform
2. **Run migrations** on database startup
3. **Configure CORS** for your Next.js domain
4. **Enable HTTPS** for all API calls
5. **Set up monitoring** for workflow failures
6. **Configure backup strategy** for database

## Support & Troubleshooting

**Workflow fails to start:**
- Check WORKFLOW_ENDPOINT is correct
- Verify WORKFLOW_API_KEY is valid
- Check Next.js /api/workflows endpoint is running

**Hook not resuming:**
- Verify hook token is correct
- Check hook has not expired
- Verify payload structure matches expected

**Database errors:**
- Run migrations: `python scripts/run_migrations.py`
- Check DATABASE_URL is correct
- Verify RLS policies are enabled

See DOCKER_SETUP.md and DATABASE_SCHEMA.md for more details.
