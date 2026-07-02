# Chase Banking App - Durable Workflow System

## Overview

The Chase banking application now includes a comprehensive durable workflow system powered by Upstash Workflow SDK. This system ensures reliability, scalability, and observability for critical banking operations.

## Workflow Types

### 1. Transaction Workflow (`/lib/workflows/transaction.ts`)

**Purpose**: Process financial transactions with full validation and confirmation.

**Steps**:
1. **Validate Transaction** - Ensures transaction amount and accounts are valid
2. **Process Transaction** - Executes the actual fund transfer
3. **Update Balances** - Updates account balances in the database
4. **Send Confirmation Email** - Notifies the user of the transaction
5. **Log Activity** - Records the transaction in audit logs

**Usage**:
```typescript
import { triggerTransactionWorkflow } from "@/lib/workflow-client";

const result = await triggerTransactionWorkflow({
  transactionId: "tx_123456",
  userId: "user_789",
  type: "transfer",
  amount: 500,
  fromAccount: "checking",
  toAccount: "savings",
  description: "Monthly savings transfer",
  userEmail: "user@example.com",
  userName: "Lin Huang"
});
```

**Features**:
- Automatic retry on failure
- Step-level error handling
- Transactional consistency
- Email notifications
- Activity logging

---

### 2. Signup Workflow (`/lib/workflows/signup.ts`)

**Purpose**: Onboard new users with automated account setup and emails.

**Steps**:
1. **Create Account** - Sets up user account in the database
2. **Send Welcome Email** - Sends immediate welcome message
3. **Setup Default Accounts** - Creates checking and savings accounts
4. **Wait 1 Day** - Pauses workflow for 1 day
5. **Send Onboarding Tips** - Sends tips email after waiting period

**Usage**:
```typescript
import { triggerSignupWorkflow } from "@/lib/workflow-client";

const result = await triggerSignupWorkflow({
  userId: "user_new_123",
  email: "newuser@example.com",
  name: "John Doe"
});
```

**Features**:
- Scheduled email sequences
- Automatic account setup
- Long-running operations with sleep
- Multi-step onboarding
- Resource-efficient delays

---

### 3. Notification Workflow (`/lib/workflows/notification.ts`)

**Purpose**: Send multi-channel notifications with priority handling.

**Steps**:
1. **Create Notification** - Records notification in database
2. **Send Email** - Delivers email notification (if email provided)
3. **Send Push** - Sends push notification to mobile app
4. **Send SMS** - Sends SMS for high-priority alerts (if SMS provided)
5. **Log Event** - Records notification event for analytics

**Usage**:
```typescript
import { triggerNotificationWorkflow } from "@/lib/workflow-client";

const result = await triggerNotificationWorkflow({
  userId: "user_789",
  type: "alert",
  title: "Large Transaction",
  message: "A $1,000 transfer was made from your account",
  email: "user@example.com",
  sms: "+1234567890",
  priority: "high"
});
```

**Features**:
- Multi-channel notifications (email, push, SMS)
- Priority-based handling
- Conditional logic (SMS only for high priority)
- Event tracking
- Flexible notification types

---

## API Endpoints

### Transaction Workflow
- **POST** `/api/workflows/transaction` - Start transaction workflow
- **GET** `/api/workflows/transaction?id={transactionId}` - Check status

### Signup Workflow
- **POST** `/api/workflows/signup` - Start signup workflow
- **GET** `/api/workflows/signup?userId={userId}` - Check status

### Notification Workflow
- **POST** `/api/workflows/notification` - Start notification workflow
- **GET** `/api/workflows/notification?userId={userId}` - Check status

---

## Key Features

### 1. Durability
Workflows automatically resume after system failures, ensuring operations complete even during outages.

### 2. Observability
Each workflow step is independently tracked with:
- Step names and status
- Execution timing
- Error messages
- Activity logs

### 3. Retry Logic
Automatic retries with exponential backoff for failed steps (configurable).

### 4. Long-Running Operations
Support for operations that span hours or days (e.g., scheduled emails, batch processing).

### 5. Step-Level Error Handling
Each step can have custom error handling:
- Critical failures (throw FatalError) stop the workflow
- Non-critical failures (console.error) are logged but workflow continues

---

## Configuration

### Environment Variables
Required for workflow system:
```
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_qstash_token
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or production URL
```

### Local Development
Run QStash locally:
```bash
npm run qstash:dev
```

This starts a local QStash server for development at `http://localhost:8080`.

---

## Workflow Execution Flow

```
Client Request
    ↓
Trigger API Endpoint
    ↓
Upstash Workflow Queue
    ↓
Step 1: Execute & Store State
    ↓
Step 2: Resume from Stored State
    ↓
... (more steps)
    ↓
Return Workflow Result
    ↓
Client Receives Response
```

---

## Example: Complete Transaction Flow

```typescript
// 1. User initiates transfer
const transactionId = generateId();

// 2. Trigger workflow
const workflow = await triggerTransactionWorkflow({
  transactionId,
  userId: "user_123",
  type: "transfer",
  amount: 1000,
  fromAccount: "checking_main",
  toAccount: "savings_emergency",
  description: "Emergency fund transfer",
  userEmail: "user@example.com",
  userName: "Lin Huang"
});

// 3. Workflow executes asynchronously:
//    - Validates: checks amount > 0, accounts exist
//    - Processes: debit/credit accounts
//    - Updates: database balances
//    - Emails: confirmation message
//    - Logs: activity record

// 4. Check status later if needed
const status = await getTransactionStatus(transactionId);
// Returns: { status: "processing", message: "..." }
```

---

## Best Practices

1. **Use Unique IDs**: Always generate unique IDs for transactions, workflows, etc.
2. **Implement Idempotency**: Workflows may retry, so steps should be idempotent
3. **Log at Steps**: Use console.log for debugging each step
4. **Error Classification**: Use FatalError for critical failures only
5. **Test Locally**: Always test with local QStash before deploying
6. **Monitor Workflows**: Check logs and status regularly in production

---

## Troubleshooting

### Workflow Not Triggering
- Check QSTASH_TOKEN environment variable
- Verify QStash service is running locally/in cloud
- Check API endpoint logs for errors

### Steps Not Executing
- Verify each step function is properly awaited
- Check for FatalError being thrown prematurely
- Look for network errors in console logs

### Email Not Sending
- Verify email service (Resend) is configured
- Check email address is valid
- Review API logs for delivery status

### Workflow Timeout
- Increase timeout in client configuration
- Split long-running operations into smaller steps
- Use `sleep()` for intentional delays

---

## Next Steps

1. **Integration**: Integrate workflows into banking features (transfers, payments)
2. **Monitoring**: Set up workflow status dashboards
3. **Analytics**: Track workflow success rates and performance
4. **Scaling**: Configure retry policies based on failure patterns
5. **Testing**: Add workflow tests to CI/CD pipeline

---

## References

- [Upstash Workflow SDK](https://upstash.com/workflow)
- [QStash Documentation](https://upstash.com/docs/qstash)
- [Next.js API Routes](https://nextjs.org/docs/api-routes)
