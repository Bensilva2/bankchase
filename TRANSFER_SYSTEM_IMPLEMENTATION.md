# Transfer System - Complete Implementation Guide

## Overview

The BankChase transfer system allows users to send money between accounts (internal transfers) and to external bank accounts. The system includes:

- **Balance management** - Debit sender account, credit receiver account
- **Transaction records** - Track debit and credit transactions
- **Receipt generation** - Create transfer receipts for records
- **Webhook notifications** - Notify both sender and receiver
- **SMS alerts** - Send SMS confirmation messages
- **Security** - PIN validation, rate limiting, audit logging

## System Architecture

### Flow Diagram

```
1. Frontend Form
   ↓
2. Next.js API Route (/app/api/...)
   ↓
3. Python FastAPI Backend (/backend/routes/pay_transfer.py)
   ↓
4. Database Update (accounts, transactions)
   ↓
5. Async Tasks (receipts, webhooks, SMS)
   ↓
6. Response to Frontend
```

## Step-by-Step Implementation

### 1. **Backend Transfer Route** (`/backend/routes/pay_transfer.py`)

The main transfer endpoint handles:

```
POST /api/pay-transfer/send
```

**Request Model:**
```python
class TransferRequest(BaseModel):
    from_account_number: str          # Sender's account
    to_account_number: str            # Receiver's account
    to_bank_code: str                 # Bank code (e.g., "CHASE", "INTERNAL")
    amount: float                     # Transfer amount
    currency: str = "USD"             # Currency
    country_code: str = "US"          # Country
    pin: str                          # User's PIN for verification
    narration: Optional[str] = None   # Transfer description
    to_routing_number: Optional[str]  # Routing number (US)
    to_swift_code: Optional[str]      # SWIFT code (International)
```

**Step-by-Step Process:**

#### Step 1: PIN Validation
```python
await validate_pin(current_user.user_id, request.pin)
```
- Verifies user's PIN is correct
- Prevents unauthorized transfers
- Checks for PIN lockout (too many failed attempts)

#### Step 2: Source Account Verification
```python
from_account = await fetchrow(
    "SELECT id, account_number, balance FROM accounts WHERE account_number = $1 AND user_id = $2",
    request.from_account_number,
    current_user.user_id
)
```
- Confirms sender owns the account
- Checks sufficient balance exists

#### Step 3: Destination Account Resolution
```python
# For internal transfers: find existing account
# For external transfers: create new account if doesn't exist
to_account = await fetchrow(
    "SELECT id, user_id FROM accounts WHERE account_number = $1",
    request.to_account_number
)

if not to_account:
    to_account = await fetchrow(
        "INSERT INTO accounts (account_number, user_id, org_id, balance, is_demo_account, account_type) 
         VALUES ($1, NULL, $2, 0.0, true, 'checking') RETURNING id, user_id",
        request.to_account_number,
        current_user.org_id
    )
```

#### Step 4: Create Debit Transaction (Sender)
```python
debit_tx = await fetchrow(
    "INSERT INTO transactions (account_id, user_id, org_id, transaction_type, amount, description, to_account_number, status) 
     VALUES ($1, $2, $3, 'debit', $4, $5, $6, $7) RETURNING id",
    from_account["id"],
    current_user.user_id,
    current_user.org_id,
    request.amount,
    request.narration or f"Transfer to {request.to_account_number}",
    request.to_account_number,
    "completed" if is_internal else "pending"
)
```
- Records money leaving sender's account
- Transaction type: "debit"
- Status: "completed" for internal, "pending" for external

#### Step 5: Create Credit Transaction (Receiver)
```python
credit_tx = await fetchrow(
    "INSERT INTO transactions (account_id, user_id, org_id, transaction_type, amount, description, to_account_number, status) 
     VALUES ($1, $2, $3, 'credit', $4, $5, NULL, $6) RETURNING id",
    to_account["id"],
    to_account["user_id"],
    current_user.org_id,
    request.amount,
    request.narration or "Funds received",
    "completed" if is_internal else "pending"
)
```
- Records money entering receiver's account
- Transaction type: "credit"
- `user_id` is NULL for external accounts (no registered user)

#### Step 6: Update Account Balances
```python
# Debit sender
await execute(
    "UPDATE accounts SET balance = balance - $1 WHERE id = $2",
    request.amount,
    from_account["id"]
)

# Credit receiver
await execute(
    "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
    request.amount,
    to_account["id"]
)
```
- Immediately moves funds in database
- Atomic operation ensures consistency

#### Step 7: Generate Receipt
```python
receipt_data = await generate_receipt(
    from_account_id=from_account["id"],
    from_account_number=request.from_account_number,
    to_account_number=request.to_account_number,
    amount=request.amount,
    currency="USD",
    narration=request.narration,
    transfer_id=transfer_id,
    balance_after=float(from_account_balance["balance"])
)
```
- Creates detailed receipt
- Includes transfer ID, timestamp, amounts
- Saved to database for retrieval

#### Step 8: Trigger Webhooks (Async)
```python
asyncio.create_task(trigger_webhook_event(
    from_user_id, 
    "transfer.completed", 
    transfer_payload
))

if to_user_id:
    asyncio.create_task(trigger_webhook_event(
        to_user_id, 
        "transfer.completed", 
        transfer_payload
    ))
```
- Notifies sender and receiver asynchronously
- Doesn't block main request
- Includes transfer ID for reference

#### Step 9: Return Response
```python
return TransferResponse(
    success=True,
    transaction_id=str(debit_tx["id"]),
    receipt=receipt_response,
    message="Transfer completed successfully"
)
```

### 2. **Frontend Implementation**

#### Frontend Form (`/components/demo-transfer-form.tsx`)

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  try {
    const response = await fetch('/api/admin/demo-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to_account_number: toAccount,
        amount: parseFloat(amount),
        days_to_refund: parseInt(days),
        notes,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Transfer failed')
    }

    setMessage({
      type: 'success',
      text: `Transfer successful! Transfer ID: ${result.data.transfer_id}`,
    })
  } catch (error) {
    setMessage({
      type: 'error',
      text: (error as Error).message,
    })
  } finally {
    setLoading(false)
  }
}
```

### 3. **Database Schema**

#### Accounts Table
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  account_number VARCHAR(20) UNIQUE,
  balance DECIMAL(15,2),
  account_type VARCHAR(50),
  is_demo_account BOOLEAN,
  created_at TIMESTAMP
);
```

#### Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  user_id UUID REFERENCES users(id),
  transaction_type VARCHAR(20),  -- 'debit' or 'credit'
  amount DECIMAL(15,2),
  description TEXT,
  to_account_number VARCHAR(20),
  status VARCHAR(20),  -- 'completed', 'pending', 'failed'
  created_at TIMESTAMP
);
```

#### Receipts Table
```sql
CREATE TABLE receipts (
  id UUID PRIMARY KEY,
  receipt_number VARCHAR(100),
  transfer_id UUID,
  from_account_id UUID,
  to_account_number VARCHAR(20),
  amount DECIMAL(15,2),
  currency VARCHAR(3),
  status VARCHAR(20),
  balance_after DECIMAL(15,2),
  narration TEXT,
  created_at TIMESTAMP
);
```

## Testing the Transfer API

### Using cURL

```bash
# 1. Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"linhuang011@gmail.com","password":"Lin1122"}'

# 2. Send transfer (using token)
curl -X POST http://localhost:8000/api/pay-transfer/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "from_account_number": "1001001",
    "to_account_number": "2002002",
    "to_bank_code": "INTERNAL",
    "amount": 500,
    "currency": "USD",
    "country_code": "US",
    "pin": "1234",
    "narration": "Payment for services"
  }'
```

### Using Postman

1. **Set up environment variables:**
   - `base_url`: `http://localhost:8000`
   - `token`: (from login response)

2. **Create POST request to** `{{base_url}}/api/pay-transfer/send`

3. **Headers:**
   - `Content-Type`: `application/json`
   - `Authorization`: `Bearer {{token}}`

4. **Body:**
```json
{
  "from_account_number": "1001001",
  "to_account_number": "2002002",
  "to_bank_code": "INTERNAL",
  "amount": 500,
  "currency": "USD",
  "country_code": "US",
  "pin": "1234"
}
```

## Response Structure

### Success Response (HTTP 200)
```json
{
  "success": true,
  "transaction_id": "550e8400-e29b-41d4-a716-446655440000",
  "receipt": {
    "receipt_id": "...",
    "receipt_number": "RCP-2024-001",
    "amount": 500,
    "currency": "USD",
    "from_account": "1001001",
    "to_account": "2002002",
    "status": "completed",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "Transfer completed successfully"
}
```

### Error Response (HTTP 400/401/404)
```json
{
  "success": false,
  "error": "Insufficient balance",
  "details": {
    "available": 100,
    "requested": 500
  }
}
```

## Troubleshooting

### Common Issues

1. **"Source account not found"**
   - Account doesn't exist for user
   - Check account_number is correct
   - Verify user owns the account

2. **"Insufficient balance"**
   - Account doesn't have enough funds
   - Check current balance before transfer
   - Reduce transfer amount

3. **"PIN validation failed"**
   - PIN is incorrect or locked
   - Wait 15 minutes for lockout to clear
   - Verify PIN with user

4. **"Transfer pending"** (for external transfers)
   - Normal for transfers to external banks
   - Receiver won't see funds until status changes to "completed"
   - Usually takes 1-3 business days

## Key Features

✅ **Atomic Transactions** - All-or-nothing: either full transfer succeeds or nothing changes
✅ **Receipt Generation** - Every transfer gets a receipt with tracking number
✅ **Webhook Notifications** - Both parties notified via webhooks
✅ **SMS Alerts** - SMS confirmation sent to registered phone
✅ **Audit Logging** - All transfers logged for compliance
✅ **Rate Limiting** - 10 transfers per minute per user
✅ **Security** - PIN verification required, RLS policies enforce data access
✅ **Idempotency** - Duplicate requests handled safely
