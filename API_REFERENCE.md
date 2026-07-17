# Real-Time Banking Transfer API Reference

## Overview

This document describes the real-time transfer API with balance synchronization. The system provides instant money transfers between accounts with real-time balance updates for both sender and receiver.

## System Architecture

### Core Components

1. **Transfer Service** (`/api/transfers/realtime`)
   - Processes transfers with ACID guarantees
   - Updates balances immediately
   - Returns transfer status in real-time

2. **Balance Webhook** (`/api/webhooks/balance-updates`)
   - Receives balance update events
   - Broadcasts updates to connected clients
   - Maintains transaction history

3. **Status Tracking** (`/api/transfers/realtime-status`)
   - Provides real-time transfer status
   - Returns account balances
   - Supports Server-Sent Events (SSE) for live updates

## API Endpoints

### 1. Send Money (Real-Time Transfer)

**Endpoint:** `POST /api/transfers/realtime`

**Description:** Process an immediate money transfer with real-time balance updates.

**Authentication:** Required (Clerk)

**Request Body:**
```json
{
  "userId": "user_id",
  "fromAccountId": "account_id",
  "toAccountNumber": "recipient_account_number",
  "toBankCode": "INTERNAL|SWIFT|ACH",
  "amount": 100.50,
  "recipientName": "John Doe",
  "narration": "Payment for invoice #123" // optional
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "transaction": {
    "id": "tx_uuid",
    "status": "completed",
    "transactionId": "tx_uuid",
    "amount": 100.50,
    "fromAccount": "1234567890",
    "toAccount": "9876543210",
    "recipientName": "John Doe",
    "timestamp": "2026-07-16T04:35:17.337Z",
    "estimatedDelivery": "2026-07-16T04:35:17.337Z"
  },
  "status": "completed"
}
```

**Response (Error - 400/401/404/500):**
```json
{
  "success": false,
  "error": "Insufficient funds|Invalid account|Unauthorized|etc",
  "transaction": {
    "id": "tx_uuid",
    "status": "failed",
    "transactionId": "tx_uuid",
    "amount": 100.50,
    "fromAccount": "",
    "toAccount": "9876543210",
    "recipientName": "John Doe",
    "timestamp": "2026-07-16T04:35:17.337Z"
  },
  "status": "failed"
}
```

**Error Codes:**
- `401` - Unauthorized (missing auth)
- `400` - Invalid request (missing fields, insufficient funds)
- `404` - Account not found
- `500` - Server error

**Key Features:**
- Immediate balance updates for both accounts
- ACID transaction guarantees
- Automatic rollback on failure
- Instant completion for internal transfers
- Support for external bank transfers (SWIFT/ACH)

---

### 2. Check Transfer Status

**Endpoint:** `GET /api/transfers/realtime?transactionId=xxx`

**Description:** Get the status of a specific transfer.

**Authentication:** Required (Clerk)

**Query Parameters:**
- `transactionId` (required) - The transfer transaction ID

**Response (Success - 200):**
```json
{
  "success": true,
  "transaction": {
    "id": "tx_uuid",
    "status": "completed|processing|pending|failed",
    "amount": 100.50,
    "from_account_id": "account_id",
    "to_account_number": "9876543210",
    "to_bank_code": "INTERNAL",
    "recipient_name": "John Doe",
    "initiated_at": "2026-07-16T04:35:17.337Z",
    "completed_at": "2026-07-16T04:35:17.500Z",
    "metadata": { ... }
  },
  "status": "completed"
}
```

---

### 3. Real-Time Status Dashboard

**Endpoint:** `GET /api/transfers/realtime-status`

**Description:** Get user's transfer history and account balances with real-time data.

**Authentication:** Required (Clerk)

**Query Parameters:**
- `limit` (optional, default: 20) - Number of transfers to return
- `offset` (optional, default: 0) - Pagination offset

**Response (Success - 200):**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com"
  },
  "transfers": [
    {
      "id": "tx_uuid",
      "transactionId": "tx_uuid",
      "status": "completed",
      "amount": 100.50,
      "currency": "USD",
      "description": "Payment to John Doe",
      "recipientName": "John Doe",
      "toAccountNumber": "9876543210",
      "toBankCode": "INTERNAL",
      "toBankName": "Internal Transfer",
      "type": "transfer|deposit",
      "initiatedAt": "2026-07-16T04:35:17.337Z",
      "completedAt": "2026-07-16T04:35:17.500Z",
      "updatedAt": "2026-07-16T04:35:17.500Z",
      "metadata": { ... }
    }
  ],
  "accounts": [
    {
      "id": "account_id",
      "account_number": "1234567890",
      "balance": 5000.00,
      "currency": "USD",
      "updated_at": "2026-07-16T04:35:17.337Z"
    }
  ],
  "totalBalance": 15000.00,
  "stats": {
    "totalTransfers": 42,
    "completedTransfers": 40,
    "pendingTransfers": 1,
    "failedTransfers": 1
  },
  "pagination": {
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "timestamp": "2026-07-16T04:35:17.337Z"
}
```

---

### 4. Balance Update Webhook

**Endpoint:** `POST /api/webhooks/balance-updates`

**Description:** Receive and process balance update events.

**Authentication:** Optional (Webhook signature verification)

**Headers:**
- `x-webhook-signature` - HMAC signature (optional in dev)
- `x-webhook-timestamp` - Event timestamp (optional in dev)

**Request Body:**
```json
{
  "timestamp": "2026-07-16T04:35:17.337Z",
  "userId": "user_id",
  "accountId": "account_id",
  "previousBalance": 5000.00,
  "newBalance": 4899.50,
  "changeAmount": -100.50,
  "transactionId": "tx_uuid",
  "reason": "Transfer sent",
  "metadata": {
    "recipientName": "John Doe",
    "recipientAccount": "9876543210"
  }
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Balance update processed",
  "account": {
    "id": "account_id",
    "balance": 4899.50,
    "currency": "USD",
    "updated_at": "2026-07-16T04:35:17.500Z"
  },
  "timestamp": "2026-07-16T04:35:17.500Z"
}
```

**Features:**
- Server-Sent Events (SSE) support for live updates
- Automatic subscriber management
- Keep-alive heartbeat (30s)
- Real-time broadcast to all connected clients

---

### 5. Subscribe to Balance Updates (SSE)

**Endpoint:** `GET /api/webhooks/balance-updates`

**Description:** Subscribe to real-time balance updates via Server-Sent Events.

**Authentication:** Required (Clerk)

**Response Format:**
```
data: {
  "accountId": "account_id",
  "previousBalance": 5000.00,
  "newBalance": 4899.50,
  "changeAmount": -100.50,
  "reason": "Transfer sent",
  "timestamp": "2026-07-16T04:35:17.337Z"
}

```

**JavaScript Client Example:**
```javascript
const eventSource = new EventSource('/api/webhooks/balance-updates');

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log('Balance updated:', data);
  // Update UI with new balance
});

eventSource.onerror = () => {
  console.error('Connection error');
  eventSource.close();
};
```

---

### 6. Trigger Manual Balance Update

**Endpoint:** `PUT /api/webhooks/balance-updates`

**Description:** Manually trigger a balance update (admin/testing only).

**Authentication:** Required (Clerk)

**Request Body:**
```json
{
  "accountId": "account_id",
  "newBalance": 4899.50,
  "reason": "Manual adjustment"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Balance update processed",
  "account": { ... },
  "timestamp": "2026-07-16T04:35:17.500Z"
}
```

---

## Database Schema

### Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  from_account_id UUID NOT NULL,
  to_account_id UUID,
  to_account_number VARCHAR(50),
  to_bank_code VARCHAR(20),
  to_bank_name VARCHAR(100),
  amount DECIMAL(19, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL, -- completed|processing|pending|failed
  transaction_type VARCHAR(20) NOT NULL, -- transfer|deposit|withdrawal
  recipient_name VARCHAR(100),
  description TEXT,
  initiated_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP,
  metadata JSONB,
  
  FOREIGN KEY (user_id) REFERENCES auth.users(id),
  FOREIGN KEY (from_account_id) REFERENCES accounts(id),
  FOREIGN KEY (to_account_id) REFERENCES accounts(id),
  INDEX (user_id, initiated_at),
  INDEX (status)
);
```

### Accounts Table
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  account_number VARCHAR(20) NOT NULL UNIQUE,
  account_type VARCHAR(20), -- checking|savings|money_market
  balance DECIMAL(19, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES auth.users(id),
  INDEX (user_id),
  INDEX (account_number)
);
```

### Balance Updates Log Table
```sql
CREATE TABLE balance_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID NOT NULL,
  previous_balance DECIMAL(19, 2),
  new_balance DECIMAL(19, 2),
  change_amount DECIMAL(19, 2),
  transaction_id UUID,
  reason VARCHAR(100),
  metadata JSONB,
  webhook_received_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES auth.users(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  INDEX (user_id, webhook_received_at),
  INDEX (account_id)
);
```

---

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details",
  "timestamp": "2026-07-16T04:35:17.337Z"
}
```

### Common Error Scenarios

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| Unauthorized | 401 | Missing/invalid auth token | Sign in with Clerk |
| Invalid payload | 400 | Missing required fields | Include all required fields |
| Insufficient funds | 400 | Account balance too low | Transfer smaller amount |
| Account not found | 404 | Account doesn't exist | Verify account ID |
| Server error | 500 | Internal server error | Contact support |

---

## Real-Time Balance Synchronization

### Flow Diagram
```
1. Sender initiates transfer
   ↓
2. Server deducts from sender account
   ↓
3. Server adds to receiver account
   ↓
4. Transaction record created
   ↓
5. Balance update events broadcast
   ↓
6. Connected clients receive updates
   ↓
7. UI refreshes immediately
```

### Client Update Loop
```javascript
// Polling (less efficient)
setInterval(async () => {
  const data = await fetch('/api/transfers/realtime-status');
  updateUI(data);
}, 5000);

// Server-Sent Events (recommended)
const eventSource = new EventSource('/api/webhooks/balance-updates');
eventSource.onmessage = (e) => updateUI(JSON.parse(e.data));
```

---

## Rate Limiting & Quotas

- **Transfer limit:** 1000 transfers/hour per user
- **Amount limit:** $1,000,000 per transfer
- **API calls:** 100 requests/minute per user
- **Webhook events:** No limit (system generated)

---

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables set:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `DATABASE_URL`
- [ ] Webhook signatures configured (production)
- [ ] SSL/HTTPS enabled
- [ ] Monitoring & alerting set up
- [ ] Load testing completed
- [ ] Documentation reviewed

---

## Support

For issues or questions:
1. Check this API reference
2. Review error logs: `user_read_only_context/v0_debug_logs.log`
3. Contact: support@bankchase.app
