# Demo Money Transfer System

A comprehensive admin feature for MyBank that allows administrators to send virtual/demo money to users for testing and sandbox environments. Includes automatic refund expiry for external accounts.

## Overview

The demo transfer system enables:

1. **Single Transfers** - Send demo money to a specific account
2. **Bulk Transfers** - Send demo money to all registered users at once
3. **Auto-Refund** - Pending external transfers automatically refund after 7-14 days
4. **Transfer Tracking** - Complete audit trail of all demo transfers

## Key Features

### Admin Features

- ✅ Send demo money to registered users (instant credit)
- ✅ Send demo money to external accounts (pending with auto-refund)
- ✅ Bulk send to all users in one action
- ✅ View complete transfer history with filters
- ✅ Track pending refunds and refunded amounts
- ✅ Set custom refund expiry (7 or 14 days)

### User Features

- ✅ Receive instant demo money if registered
- ✅ See pending demo money with countdown to refund
- ✅ View all transactions including demo transfers
- ✅ Track demo balance separately from real accounts

## Database Schema

### demo_accounts Table

Stores virtual accounts for demo money system:

```sql
demo_accounts {
  id: UUID (Primary Key)
  account_number: TEXT (Unique)
  user_id: UUID (Nullable - Null means external account)
  balance: DECIMAL(15,2)
  is_demo_account: BOOLEAN (Always TRUE)
  account_type: TEXT (demo, real, etc.)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

### demo_transfers Table

Tracks all demo money transfers:

```sql
demo_transfers {
  id: UUID (Primary Key)
  transfer_reference: TEXT (Unique - e.g., DEMO-ABC12345)
  admin_user_id: UUID (FK → users)
  from_account_id: UUID (FK → demo_accounts)
  to_account_number: TEXT
  to_user_id: UUID (Nullable - if recipient is registered)
  amount: DECIMAL(15,2)
  status: TEXT (pending | completed | refunded)
  transfer_type: TEXT (internal | external)
  created_at: TIMESTAMP
  expires_at: TIMESTAMP (NULL for internal transfers)
  refunded_at: TIMESTAMP (NULL until refund)
  notes: TEXT
  updated_at: TIMESTAMP
}
```

## API Endpoints

### 1. Send Single Demo Transfer

**POST** `/api/admin/demo-transfer`

Send demo money to a single account. If recipient is registered, credit is instant (status: completed). If external, money is pending (status: pending) with auto-refund date.

**Request:**
```json
{
  "toAccountNumber": "1234567890",
  "amount": 50000,
  "daysToRefund": 7,
  "adminUserId": "uuid-of-admin"
}
```

**Response:**
```json
{
  "success": true,
  "transferId": "uuid",
  "transferReference": "DEMO-ABC12345",
  "status": "completed|pending",
  "toAccount": "1234567890",
  "amount": 50000,
  "willRefundIn": "7 days|null"
}
```

**Transfer Type Logic:**
- If `to_account_number` belongs to registered user → **Internal** (instant credit, status: completed)
- If account doesn't exist or is external → **External** (pending credit, status: pending, expires_at: +7/14 days)

### 2. Send Bulk Demo Transfer

**POST** `/api/admin/demo-transfer/bulk`

Send the same amount of demo money to ALL registered users. All transfers are instant (internal).

**Request:**
```json
{
  "amount": 10000,
  "daysToRefund": 7,
  "adminUserId": "uuid-of-admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully sent 10000 demo money to 150 users",
  "totalUsers": 150,
  "totalAmountSent": 1500000,
  "transfersCreated": 150
}
```

### 3. Process Expired Refunds

**POST** `/api/admin/demo-transfer/process-refunds`

Automatically process refunds for expired pending transfers. Called by scheduled job (Vercel Cron).

**Headers:**
```
Authorization: Bearer {CRON_SECRET}
```

**Response:**
```json
{
  "success": true,
  "message": "Processed 45 expired demo transfers",
  "refundedCount": 45,
  "totalExpired": 45
}
```

**Logic:**
1. Find all transfers with `status = 'pending'` and `expires_at <= NOW()`
2. Refund amount back to admin's demo account
3. Deduct amount from receiver's account (up to available balance)
4. Mark transfer as `status = 'refunded'` and set `refunded_at`

### 4. Get Transfer History

**GET** `/api/admin/demo-transfer/history`

Fetch admin's transfer history with optional filters.

**Query Parameters:**
- `adminUserId` (required) - Admin user ID
- `status` (optional) - pending, completed, or refunded
- `limit` (optional) - Default 50
- `offset` (optional) - Default 0

**Response:**
```json
{
  "success": true,
  "transfers": [
    {
      "id": "uuid",
      "transfer_reference": "DEMO-ABC12345",
      "to_account_number": "1234567890",
      "amount": 50000,
      "status": "completed",
      "transfer_type": "internal",
      "created_at": "2026-05-16T10:00:00Z",
      "expires_at": null,
      "fromAccountBalance": 900000,
      "toAccountBalance": 50000,
      "isInternal": true
    }
  ],
  "total": 245,
  "limit": 50,
  "offset": 0
}
```

## Service Layer

### demo-transfer-service.ts

TypeScript service for client-side demo transfer operations:

```typescript
// Send single transfer
await sendDemoTransfer({
  toAccountNumber: '1234567890',
  amount: 50000,
  daysToRefund: 7,
  adminUserId: 'admin-uuid'
});

// Send bulk transfer
await sendBulkDemoTransfer({
  amount: 10000,
  daysToRefund: 7,
  adminUserId: 'admin-uuid'
});

// Get transfer history
const { transfers, total } = await getDemoTransferHistory(
  adminUserId,
  { status: 'pending', limit: 20 }
);

// Format transfer for UI
const displayTransfer = formatTransferForDisplay(transfer);
// Returns: { ...transfer, statusLabel, typeLabel, daysUntilRefund, refundNote }
```

## Components

### AdminDemoTransfer

Tab-based component for admin dashboard:

```tsx
<AdminDemoTransfer adminUserId="admin-uuid" />
```

**Features:**
- **Single Transfer Tab** - Form to send to single account
- **Bulk Transfer Tab** - Send to all registered users
- **History Tab** - View transfer history with status badges

## Scheduled Job Setup

### Option 1: Vercel Cron (Recommended)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/admin/demo-transfer/process-refunds",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Set `CRON_SECRET` environment variable:
```
CRON_SECRET=your-secure-random-string
```

### Option 2: External Scheduler

Use a service like:
- EasyCron
- Zapier
- AWS EventBridge
- Google Cloud Scheduler

**Curl Example:**
```bash
curl -X POST http://localhost:3000/api/admin/demo-transfer/process-refunds \
  -H "Authorization: Bearer your-cron-secret"
```

## Usage Examples

### Admin Scenario 1: Welcome Bonus

Send new users ₦5,000 welcome bonus:

```typescript
const result = await sendDemoTransfer({
  toAccountNumber: 'USER-NEW-12345',
  amount: 5000,
  daysToRefund: 14,
  adminUserId: currentAdmin.id
});

console.log(`Welcome bonus sent: ${result.transferReference}`);
```

### Admin Scenario 2: Load Testing

Send ₦10,000 to all users for testing:

```typescript
const result = await sendBulkDemoTransfer({
  amount: 10000,
  adminUserId: currentAdmin.id
});

console.log(`Sent to ${result.totalUsers} users`);
```

### Admin Scenario 3: External Account Test

Send money to non-registered account (pending):

```typescript
const result = await sendDemoTransfer({
  toAccountNumber: '9876543210', // External account
  amount: 25000,
  daysToRefund: 7, // Refund after 7 days
  adminUserId: currentAdmin.id
});

// Result: status = 'pending'
// After 7 days: auto-refund processes, status = 'refunded'
```

## Transfer Status Lifecycle

### Internal Transfer (Registered User)

```
User sends demo money to registered user
         ↓
Demo account created (if needed)
         ↓
Transfer record created with status = 'completed'
         ↓
Receiver's balance updated instantly
         ↓
Done ✓
```

### External Transfer (Non-Registered Account)

```
Admin sends demo money to external account
         ↓
External account created with is_demo_account = true
         ↓
Transfer record created with status = 'pending'
         ↓
Money added to account (pending balance)
         ↓
User receives notification: "Pending demo credit (refunds in 7 days)"
         ↓
[If user signs up] ✓ Account activated, balance kept
[If 7 days pass] → Auto-refund job runs → status = 'refunded'
```

## Security & Best Practices

✓ **RLS Policies** - Users can only see their own transfers
✓ **Admin-Only Operations** - Only admins can send demo money
✓ **Audit Trail** - All transfers logged with timestamps
✓ **Transfer Reference** - Unique IDs for tracking
✓ **Balance Checks** - Prevent admin overdrafts
✓ **Cron Authentication** - Secure refund job with Bearer token
✓ **Timestamp Tracking** - created_at, expires_at, refunded_at

## Troubleshooting

### Issue: "Insufficient demo balance"

**Solution:** Admin's demo account needs refund. Check:
```sql
SELECT * FROM demo_accounts 
WHERE user_id = 'admin-uuid' AND is_demo_account = true;
```

### Issue: "Account not found"

**Solution:** System will auto-create external accounts, but verify:
```sql
SELECT * FROM demo_accounts 
WHERE account_number = 'target-account';
```

### Issue: Refunds not processing

**Solution:** Check cron job is running. Manually trigger:
```bash
curl -X POST http://localhost:3000/api/admin/demo-transfer/process-refunds \
  -H "Authorization: Bearer {CRON_SECRET}"
```

## Future Enhancements

- [ ] Recurring demo transfers
- [ ] Transfer limits per admin
- [ ] Approval workflow for large transfers
- [ ] Demo money expiry policy
- [ ] Integration with analytics dashboard
- [ ] CSV export of transfer history
- [ ] Webhook notifications on transfer/refund
- [ ] Demo balance thresholds & warnings

## References

- **Database Schema:** `scripts/004-create-demo-transfers.sql`
- **API Routes:** `app/api/admin/demo-transfer/`
- **Service:** `lib/demo-transfer-service.ts`
- **Component:** `components/admin-demo-transfer.tsx`
- **Main README:** `README.md`
