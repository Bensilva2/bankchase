# BankChase Workflows

This directory contains durable, resumable workflows built with Vercel Workflow SDK for banking operations. All workflows are designed to survive restarts, handle failures gracefully, and integrate with external services.

## Available Workflows

### 1. Money Transfer (`transfer.ts`)

Processes money transfers between accounts with validation, fraud detection, and confirmation emails.

**Input:**
```typescript
{
  senderId: string          // Sender account ID
  senderEmail: string       // Sender email for confirmation
  senderName: string        // Sender name
  recipientId: string       // Recipient account ID
  recipientName: string     // Recipient name
  amount: number           // Transfer amount
}
```

**Process:**
1. Validates transfer details (amount, accounts)
2. Checks account balance
3. Performs fraud detection
4. Processes payment
5. Settles transaction
6. Records in database
7. Sends confirmation email

**Output:**
```typescript
{
  success: boolean
  transactionId?: string
  status?: 'completed' | 'failed'
  error?: string
}
```

### 2. Account Opening (`account-opening.ts`)

Complete account opening workflow with KYC verification, document uploads, and approval.

**Input:**
```typescript
{
  email: string            // User email
  fullName: string         // Full name
  dateOfBirth: string      // DOB
  ssn: string             // Social Security Number
  address: string         // Address
}
```

**Process:**
1. Performs KYC verification
2. Creates document upload hook (14-day window)
3. Waits for document uploads and verification
4. Creates account record
5. Creates approval hook (48-hour window)
6. Waits for manual approval
7. Notifies team via Slack
8. Sends welcome kit

**Output:**
```typescript
{
  success: boolean
  accountId?: string
  status?: 'opened' | 'failed'
  error?: string
}
```

**Hooks Used:**
- `account-docs-{email}`: Resume after document verification
- `account-approve-{email}`: Resume after manual approval

### 3. Loan Application (`loan-application.ts`)

Loan application processing with credit checks, offer generation, and funding.

**Input:**
```typescript
{
  userId: string           // User ID
  userEmail: string        // User email
  userName: string         // User name
  requestedAmount: number  // Requested loan amount
  loanTerm: number        // Term in months
  purpose: string         // Loan purpose
}
```

**Process:**
1. Creates application record
2. Waits for document uploads via hook
3. Performs credit check
4. Calculates loan offer
5. Sends offer email
6. Notifies admin via Slack
7. Waits for applicant acceptance
8. Processes loan funding
9. Sends confirmation

**Output:**
```typescript
{
  success: boolean
  applicationId?: string
  status?: 'funded' | 'failed'
  offer?: {
    amount: number
    rate: number
    term: number
  }
  error?: string
}
```

**Hooks Used:**
- `loan-docs-{applicationId}`: Resume after documents verified
- `loan-accept-{applicationId}`: Resume after applicant acceptance

### 4. Payment Dispute (`disputes.ts`)

Handles payment disputes with investigation, evidence collection, and resolution.

**Input:**
```typescript
{
  userId: string           // Customer user ID
  userEmail: string        // Customer email
  transactionId: string    // Disputed transaction ID
  amount: number          // Dispute amount
  reason: string          // Dispute reason
  description: string     // Detailed description
}
```

**Process:**
1. Creates dispute record
2. Creates webhook for evidence submission
3. Notifies merchant
4. Updates to evidence collection status
5. Waits for evidence via webhook
6. Investigates dispute
7. Escalates to Slack if needed
8. Processes refund if applicable
9. Sends resolution email

**Output:**
```typescript
{
  success: boolean
  disputeId?: string
  status?: 'resolved' | 'failed'
  error?: string
}
```

**Webhooks Used:**
- `/api/workflows/webhooks?token={webhook.token}`: Submit dispute evidence

### 5. Account Closure (`account-closure.ts`)

Safely closes accounts with verification, refund processing, and data archival.

**Input:**
```typescript
{
  userId: string           // User ID to close
  userEmail: string        // User email
  userName: string         // User name
  reason: string          // Closure reason
}
```

**Process:**
1. Logs closure request
2. Notifies compliance team
3. Creates verification hook
4. Validates no pending transactions
5. Calculates and processes refunds
6. Deactivates account
7. Archives user data
8. Sends confirmation email
9. Notifies compliance

**Output:**
```typescript
{
  success: boolean
  status?: 'closed' | 'failed'
  error?: string
}
```

**Hooks Used:**
- `closure-verify-{userId}`: Resume after manual verification

### 6. Bill Payment Automation (`bill-payment.ts`)

Automates bill payments with retry logic, scheduling, and confirmation.

**Input:**
```typescript
{
  userId: string           // User ID
  userEmail: string        // User email
  payeeId: string         // Payee ID
  payeeName: string       // Payee name
  amount: number          // Payment amount
  dueDate: string         // Due date
  frequency: 'one-time' | 'weekly' | 'monthly' | 'quarterly'
}
```

**Process:**
1. Validates payee
2. Creates payment record
3. Processes payment with retry logic (3 attempts)
4. Uses exponential backoff on failures
5. Sends confirmation email
6. Schedules next payment if recurring
7. Logs success

**Output:**
```typescript
{
  success: boolean
  paymentId?: string
  status?: 'completed' | 'failed'
  error?: string
}
```

## API Endpoints

### Trigger Workflow

**POST** `/api/workflows`

```json
{
  "workflowType": "transfer",
  "input": {
    "senderId": "user123",
    "senderEmail": "sender@example.com",
    "senderName": "John Doe",
    "recipientId": "user456",
    "recipientName": "Jane Smith",
    "amount": 500
  }
}
```

**Response:**
```json
{
  "success": true,
  "runId": "run_abc123",
  "workflowType": "transfer",
  "message": "transfer workflow started successfully"
}
```

### Check Workflow Status

**GET** `/api/workflows/{runId}`

Returns current status and result if available.

### Resume Hook

**POST** `/api/workflows/hooks`

```json
{
  "token": "loan-docs-app123",
  "data": {
    "documentsVerified": true
  }
}
```

### Submit Webhook Callback

**POST** `/api/workflows/webhooks?token={webhook_token}`

Submit evidence or data for webhook-waiting workflows.

## Step Functions

### Email Steps (`steps/email.ts`)

- `sendEmail()` - Send generic email
- `sendTransferConfirmation()` - Transfer confirmation
- `sendLoanOfferEmail()` - Loan offer
- `sendDisputeStatusEmail()` - Dispute status update
- `sendAccountClosureEmail()` - Account closure confirmation

### Slack Steps (`steps/slack.ts`)

- `notifySlack()` - Generic Slack notification
- `notifyDisputeEscalation()` - Escalation alert
- `notifyAccountClosureRequest()` - Closure request
- `notifyLoanApproval()` - Approval notification
- `notifyFailedPaymentRetry()` - Retry notification

### Database Steps (`steps/database.ts`)

- `logWorkflowEvent()` - Log workflow event
- `recordTransferTransaction()` - Record transfer
- `createLoanApplication()` - Create loan app
- `updateLoanApplication()` - Update loan app
- `createDispute()` - Create dispute record
- `updateDisputeStatus()` - Update dispute
- `archiveUserData()` - Archive user
- `recordBillPayment()` - Record payment

### Payment Steps (`steps/payment.ts`)

- `validateTransfer()` - Validate transfer details
- `checkAccountBalance()` - Check balance
- `performFraudDetection()` - Fraud check
- `processTransferPayment()` - Execute transfer
- `settlementProcess()` - Settlement
- `processLoanFunding()` - Fund loan
- `processBillPayment()` - Process payment
- `refundTransaction()` - Issue refund

## Error Handling

Workflows use two types of errors:

- **FatalError** - Permanent failures (invalid input, auth denied, business rule violations)
  - No automatic retry
  - Workflow terminates immediately
  
- **RetryableError** - Transient failures (timeouts, rate limits, service unavailable)
  - Automatic retry with optional `retryAfter` delay
  - Useful for external service calls

```typescript
import { FatalError, RetryableError } from 'workflow'

// Permanent failure
throw new FatalError('Invalid account ID')

// Transient failure with retry delay
throw new RetryableError('Service temporarily unavailable', {
  retryAfter: '5m'
})
```

## Environment Variables

Required environment variables:

- `RESEND_API_KEY` - Resend email service
- `RESEND_FROM_EMAIL` - From email address
- `SLACK_WEBHOOK_URL` - Slack incoming webhook
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key

## Database Schema

Workflows expect these tables in Supabase:

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

-- Transfer records
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

## Testing Workflows

### Local Testing

Run the dev server:
```bash
npm run dev
```

Trigger a workflow via API:
```bash
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "workflowType": "transfer",
    "input": {
      "senderId": "user123",
      "senderEmail": "test@example.com",
      "senderName": "Test User",
      "recipientId": "user456",
      "recipientName": "Recipient",
      "amount": 100
    }
  }'
```

Check workflow status:
```bash
curl http://localhost:3000/api/workflows/run_abc123
```

Resume a hook:
```bash
curl -X POST http://localhost:3000/api/workflows/hooks \
  -H "Content-Type: application/json" \
  -d '{
    "token": "loan-docs-app123",
    "data": {"documentsVerified": true}
  }'
```

## Production Deployment

1. Set all required environment variables in Vercel
2. Ensure database tables are created
3. Configure Slack webhook URL
4. Set up Resend email domain
5. Deploy to Vercel

The Workflow SDK automatically handles persistence, retries, and resumption across deployments.
