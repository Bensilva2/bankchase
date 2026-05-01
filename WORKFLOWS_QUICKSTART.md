# BankChase Workflows - Quick Start Guide

## Installation Complete ✅

All 6 workflows have been successfully implemented and integrated into your BankChase application.

## What's Ready to Use

### Workflows Implemented
1. **Money Transfer** - Transfer funds between accounts
2. **Account Opening** - Onboard new customers with KYC
3. **Loan Application** - Process loan requests
4. **Payment Dispute** - Handle transaction disputes
5. **Account Closure** - Safely close accounts
6. **Bill Payment** - Automate recurring payments

### Files Created
- 6 main workflow files
- 4 step function modules (email, Slack, database, payments)
- 4 API route handlers
- Complete documentation

## Configuration Steps

### 1. Set Environment Variables

Add to Vercel project settings (Settings → Environment Variables):

```
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@bankchase.example.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
```

### 2. Create Database Tables

Run this SQL in Supabase to create the required tables:

```sql
-- Workflow events log
CREATE TABLE workflow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT NOT NULL,
  run_id TEXT NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transfers
CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  status TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Loan applications
CREATE TABLE loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  term INTEGER NOT NULL,
  status TEXT NOT NULL,
  offered_amount DECIMAL,
  interest_rate DECIMAL,
  funding_id TEXT,
  funded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Disputes
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL,
  resolution TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bill payments
CREATE TABLE bill_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  payee_id TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Get API Keys

- **Resend**: Sign up at [resend.com](https://resend.com)
- **Slack**: Create incoming webhook at your Slack workspace settings
- **Supabase**: Already connected to your BankChase project

## Test Your Workflows

### Start Local Dev Server
```bash
npm run dev
```

### Test Money Transfer (Browser Console)
```javascript
fetch('/api/workflows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workflowType: 'transfer',
    input: {
      senderId: 'user123',
      senderEmail: 'test@example.com',
      senderName: 'Test User',
      recipientId: 'user456',
      recipientName: 'Recipient',
      amount: 100
    }
  })
})
  .then(r => r.json())
  .then(d => console.log('Workflow started:', d.runId))
```

### Check Status
```javascript
fetch('/api/workflows/run_YOUR_RUN_ID')
  .then(r => r.json())
  .then(d => console.log('Status:', d.status, 'Result:', d.result))
```

## API Reference

### Trigger Workflow
```bash
POST /api/workflows
Content-Type: application/json

{
  "workflowType": "transfer|account-opening|loan-application|dispute|account-closure|bill-payment",
  "input": { /* workflow-specific input */ }
}

Response:
{
  "success": true,
  "runId": "run_abc123",
  "workflowType": "transfer",
  "message": "transfer workflow started successfully"
}
```

### Check Status
```bash
GET /api/workflows/{runId}

Response:
{
  "runId": "run_abc123",
  "status": "completed|running",
  "result": { /* workflow output */ }
}
```

### Resume Hook (For Paused Workflows)
```bash
POST /api/workflows/hooks
Content-Type: application/json

{
  "token": "loan-docs-app123",
  "data": { "documentsVerified": true }
}
```

### Submit Webhook (For External Events)
```bash
POST /api/workflows/webhooks?token=WEBHOOK_TOKEN
Content-Type: application/json

{ /* event data */ }
```

## Workflow Input Examples

### Transfer
```json
{
  "senderId": "user123",
  "senderEmail": "sender@example.com",
  "senderName": "John Doe",
  "recipientId": "user456",
  "recipientName": "Jane Smith",
  "amount": 500
}
```

### Account Opening
```json
{
  "email": "newuser@example.com",
  "fullName": "Alice Johnson",
  "dateOfBirth": "1990-05-15",
  "ssn": "123-45-6789",
  "address": "123 Main St, City, State"
}
```

### Loan Application
```json
{
  "userId": "user123",
  "userEmail": "john@example.com",
  "userName": "John Doe",
  "requestedAmount": 50000,
  "loanTerm": 60,
  "purpose": "Home renovation"
}
```

### Bill Payment
```json
{
  "userId": "user123",
  "userEmail": "john@example.com",
  "payeeId": "payee_123",
  "payeeName": "City Utilities",
  "amount": 150,
  "dueDate": "2026-05-15",
  "frequency": "monthly"
}
```

### Payment Dispute
```json
{
  "userId": "user123",
  "userEmail": "john@example.com",
  "transactionId": "txn_abc123",
  "amount": 150,
  "reason": "unauthorized_transaction",
  "description": "I did not authorize this transaction"
}
```

### Account Closure
```json
{
  "userId": "user123",
  "userEmail": "john@example.com",
  "userName": "John Doe",
  "reason": "Moving to another bank"
}
```

## File Locations

- **Workflows**: `/lib/workflows/`
- **API Routes**: `/app/api/workflows/`
- **Documentation**: `/lib/workflows/README.md`, `/lib/workflows/EXAMPLES.md`
- **Implementation Details**: `/WORKFLOWS_IMPLEMENTATION.md`

## Monitoring

### View in Slack
- Loan approvals posted automatically
- Dispute escalations notify admins
- Payment failures trigger alerts
- Account closures logged

### Check Database
- Query `workflow_events` table for audit trail
- All steps and decisions logged with timestamps
- Full request/response data saved

### CLI Monitoring (After Deployment)
```bash
# Visual dashboard
npx workflow web

# Inspect specific run
npx workflow inspect run {runId}

# List all runs
npx workflow inspect runs
```

## Common Tasks

### Resume a Paused Workflow
```javascript
// After user uploads documents or approves something
fetch('/api/workflows/hooks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'loan-docs-app123',  // Hook token
    data: { documentsVerified: true }
  })
})
```

### Handle Webhook Callback
```javascript
// External system submits evidence via webhook
fetch('/api/workflows/webhooks?token=WEBHOOK_TOKEN', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    evidence: 'base64_encoded_data',
    suspicious: true
  })
})
```

### Check All Workflow Events
```sql
-- In Supabase SQL Editor
SELECT * FROM workflow_events 
ORDER BY created_at DESC 
LIMIT 20;
```

## Troubleshooting

### Workflow Not Starting
- Check API response for errors
- Verify all environment variables set
- Check browser console for network errors

### Emails Not Sending
- Verify RESEND_API_KEY is set
- Check email domain is verified in Resend
- Look for failed step in workflow_events table

### Slack Not Notifying
- Verify SLACK_WEBHOOK_URL is correct
- Test webhook manually in Slack
- Check workflow_events for step failures

### Database Errors
- Verify table names match exactly
- Check Supabase service key has permissions
- Ensure all columns are created

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Set environment variables
3. ✅ Create database tables
4. ✅ Test workflows via API
5. ✅ Integrate with UI components
6. ✅ Monitor in production

## Documentation

- **Complete Guide**: `/lib/workflows/README.md`
- **Code Examples**: `/lib/workflows/EXAMPLES.md`
- **Implementation Summary**: `/WORKFLOWS_IMPLEMENTATION.md`

## Support

For issues or questions:
1. Check workflow_events table in Supabase
2. Review error messages in API response
3. Check Slack for notifications
4. Monitor via `npx workflow web`

---

**Ready to go!** Your workflows are fully implemented and waiting for testing. 🚀
