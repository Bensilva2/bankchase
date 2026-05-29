# Webhook Security & Payment Provider Integration

This guide covers secure webhook handling for payment provider callbacks in production banking operations.

## Overview

When transfers are processed through payment providers, they respond asynchronously via webhooks to update your system when funds arrive at destination banks. This must be handled securely to prevent spoofing and ensure proper transaction state management.

## Webhook Verification

### HMAC Signature Validation

All incoming webhooks must verify the cryptographic signature from your payment provider:

```typescript
import crypto from 'crypto';

export function verifyWebhookSignature(
  body: string | Buffer,
  signature: string,
  secret: string
): boolean {
  const mac = crypto.createHmac('sha256', secret);
  mac.update(body);
  const expectedSignature = mac.digest('hex');
  
  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Webhook Payload Structure

Payment providers typically send status updates with this structure:

```typescript
interface ProviderWebhookPayload {
  event_id: string;           // Unique provider event ID
  transaction_id: string;     // Reference to your local transaction
  status: 'delivered' | 'failed' | 'pending';
  amount: number;
  currency: string;
  failure_reason?: string;    // Set if status = 'failed'
  timestamp: string;          // ISO 8601 format
}
```

## Implementation Pattern

### 1. Receive & Verify Webhook

```typescript
export async function handlePaymentWebhook(request: Request): Promise<Response> {
  // Extract signature header
  const signature = request.headers.get('x-provider-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 401 });
  }

  // Read body once and store for signature validation
  const body = await request.text();
  
  // Verify signature using secret from AWS Secrets Manager
  const webhookSecret = process.env.WEBHOOK_SECRET || '';
  const isValid = verifyWebhookSignature(body, signature, webhookSecret);
  
  if (!isValid) {
    console.error('[v0] Invalid webhook signature - potential spoofing attempt');
    return new Response('Unauthorized', { status: 401 });
  }

  const payload: ProviderWebhookPayload = JSON.parse(body);
  
  // Process webhook with database transaction
  return await processWebhook(payload);
}
```

### 2. Update Transaction Status

```typescript
async function processWebhook(payload: ProviderWebhookPayload): Promise<Response> {
  const client = await pool.connect();
  
  try {
    // Start transaction for atomic status update
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
    
    // Fetch current transaction state
    const txResult = await client.query(
      `SELECT transaction_id, status, sender_account_id, amount, phone_number
       FROM transactions t
       JOIN accounts a ON t.sender_account_id = a.account_id
       WHERE t.reference_id = $1
       FOR UPDATE`,
      [payload.transaction_id]
    );
    
    if (txResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return new Response('Transaction not found', { status: 404 });
    }
    
    const transaction = txResult.rows[0];
    
    // Determine final status mapping
    let finalStatus: 'completed' | 'failed' = 'completed';
    if (payload.status === 'failed' || payload.status === 'pending') {
      finalStatus = 'failed';
    }
    
    // Update transaction status atomically
    await client.query(
      `UPDATE transactions
       SET status = $1, updated_at = NOW()
       WHERE transaction_id = $2`,
      [finalStatus, transaction.transaction_id]
    );
    
    await client.query('COMMIT');
    
    // Queue async SMS notification (outside transaction)
    await queueSMSNotification({
      phone: transaction.phone_number,
      amount: transaction.amount,
      status: finalStatus,
      transactionId: transaction.transaction_id
    });
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Webhook processed successfully' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[v0] Webhook processing error:', error);
    
    // Return 500 to signal provider to retry (idempotent)
    return new Response('Processing error', { status: 500 });
  } finally {
    client.release();
  }
}
```

## Security Best Practices

### 1. Idempotency
Process webhooks idempotently - reprocessing shouldn't cause duplicate updates:

```typescript
// Use event_id as idempotency key
const processedEvents = new Set();

if (processedEvents.has(payload.event_id)) {
  return new Response('Event already processed', { status: 200 });
}
processedEvents.add(payload.event_id);
```

### 2. Timeout Handling
Set strict timeouts to prevent hanging connections:

```typescript
const WEBHOOK_TIMEOUT = 30000; // 30 seconds

const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Webhook timeout')), WEBHOOK_TIMEOUT)
);

await Promise.race([processWebhook(payload), timeoutPromise]);
```

### 3. Retry Logic
For failed webhooks, providers will retry. Ensure your handler is idempotent:

```typescript
try {
  await updateTransaction(payload);
  return new Response('Success', { status: 200 });
} catch (error) {
  // Return 5xx for transient errors (provider will retry)
  if (isTransientError(error)) {
    return new Response('Temporary error', { status: 503 });
  }
  // Return 2xx for permanent errors to prevent infinite retries
  return new Response('Processed', { status: 200 });
}
```

### 4. Logging & Monitoring
Log webhook activity for audit trails while scrubbing sensitive data:

```typescript
function logWebhookEvent(
  payload: ProviderWebhookPayload,
  status: 'success' | 'failure'
) {
  // Scrub sensitive fields before logging
  const sanitized = {
    event_id: payload.event_id,
    transaction_id: payload.transaction_id,
    status: payload.status,
    // Don't log amounts or user data
  };
  
  console.log('[v0] Webhook processed:', sanitized, 'Result:', status);
}
```

## Environment Variables

Required configuration for production webhook handling:

```env
# Webhook Configuration
WEBHOOK_SECRET=your-provider-signing-secret
WEBHOOK_TIMEOUT_MS=30000

# Database for transaction updates
DATABASE_URL=postgresql://...

# SMS Queue for notifications
SMS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/...
```

## Testing Webhook Integration

### Local Testing with Provider Webhooks

Many payment providers offer sandbox webhook testing:

```typescript
// Example: Test webhook with signature
const testPayload: ProviderWebhookPayload = {
  event_id: 'evt_test_123',
  transaction_id: 'txn_abc456',
  status: 'delivered',
  amount: 100,
  currency: 'USD',
  timestamp: new Date().toISOString()
};

const body = JSON.stringify(testPayload);
const signature = crypto
  .createHmac('sha256', 'test-secret')
  .update(body)
  .digest('hex');

// Send to http://localhost:3000/api/webhooks/payment
// With header: x-provider-signature: {signature}
```

## Deployment Checklist

- [ ] Webhook secret stored in AWS Secrets Manager (not in code)
- [ ] HMAC verification enabled for all webhooks
- [ ] Transaction isolation level set to SERIALIZABLE
- [ ] Webhook timeout configured (30 seconds recommended)
- [ ] Logging configured with PII scrubbing
- [ ] SMS notification queue tested
- [ ] Error handling returns proper HTTP status codes
- [ ] Monitoring alerts configured for failed webhooks
- [ ] Load testing performed to handle peak webhook volume
