# Demo Money Transfer System

Complete implementation of a virtual/demo fund transfer system for banking applications. Perfect for testing, onboarding, and demonstrations.

## Features

### Admin Features

1. **Single Transfer**
   - Send demo money to a specific account number
   - Can target registered users or external accounts
   - Instant credit for registered users
   - Pending status for external accounts
   - Optional 7 or 14 day auto-refund for external accounts

2. **Bulk Transfer**
   - Send the same demo amount to all registered users in the organization
   - Instant crediting for all users
   - Useful for onboarding scenarios

3. **Transfer History**
   - View all transfers with filtering (pending, completed, refunded)
   - Track transfer IDs, amounts, status, and auto-refund timelines
   - Real-time refresh capability

4. **Auto-Refund System**
   - Scheduled background job for processing expired transfers
   - Automatically refunds pending transfers after 7 or 14 days
   - Safely deducts from receiver balance if funds remain

### User Features

- View demo money balance instantly after admin transfer
- See pending demo funds with refund countdown
- Spend demo money like real funds (in your banking app logic)
- See transfer status and history

## Database Schema

### Accounts Table
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  account_number TEXT UNIQUE NOT NULL,
  user_id UUID (nullable for external accounts),
  org_id TEXT,
  balance FLOAT,
  is_demo_account BOOLEAN,
  account_type TEXT ('demo' or 'real'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Demo Transfers Table
```sql
CREATE TABLE demo_transfers (
  id UUID PRIMARY KEY,
  transfer_id TEXT UNIQUE,
  admin_user_id UUID (admin who initiated),
  from_account_id UUID (admin's demo account),
  to_account_number TEXT,
  amount FLOAT,
  status TEXT ('pending', 'completed', 'refunded'),
  transfer_type TEXT ('internal' or 'external'),
  created_at TIMESTAMP,
  expires_at TIMESTAMP (for external accounts),
  refunded_at TIMESTAMP,
  notes TEXT,
  org_id TEXT
);
```

## API Endpoints

### POST `/api/admin/demo-transfer`
Send demo money to a specific account.

**Request:**
```json
{
  "to_account_number": "1234567890",
  "amount": 500.00,
  "days_to_refund": 7,
  "notes": "Welcome bonus"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Demo transfer successful",
    "transfer_id": "abc123...",
    "status": "completed",
    "to_account": "1234567890",
    "amount": 500.00,
    "will_refund_in": null
  }
}
```

### POST `/api/admin/demo-transfer/bulk`
Send demo money to all users in the organization.

**Request:**
```json
{
  "amount": 250.00,
  "days_to_refund": 7
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Successfully sent 250 demo money to 42 users",
    "total_users": 42,
    "total_amount_sent": 10500.00,
    "transfer_ids": ["id1", "id2", ...]
  }
}
```

### GET `/api/admin/demo-transfer/history`
Retrieve transfer history with optional filters.

**Query Parameters:**
- `limit` - Number of transfers to return (default: 50)
- `status` - Filter by status: 'pending', 'completed', 'refunded'
- `type` - Filter by type: 'internal', 'external'

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "transfer_id": "id1",
      "to_account_number": "1234567890",
      "amount": 500.00,
      "status": "completed",
      "transfer_type": "internal",
      "created_at": "2026-04-28T10:30:00Z",
      "expires_at": null,
      "refunded_at": null
    }
  ],
  "count": 1
}
```

### POST `/api/admin/demo-transfer/process-refunds`
Process expired demo transfers (call from scheduled job).

**Requirements:**
- Header: `Authorization: Bearer {CRON_SECRET}`
- Environment variable: `CRON_SECRET`

**Response:**
```json
{
  "success": true,
  "message": "Refund processing completed"
}
```

## Setup Instructions

### 1. Database Migration
The schemas have been created by running the migration scripts:
```bash
# Already executed:
# - scripts/006_create_accounts_table.sql
# - scripts/007_create_demo_transfers_table.sql
```

### 2. Admin Dashboard Access
Navigate to `/admin/demo-money` to access the demo money transfer interface (requires admin role).

### 3. Scheduled Refund Job (Required)

Set up a daily cron job to process auto-refunds. Using Vercel Cron Jobs:

**vercel.json:**
```json
{
  "crons": [{
    "path": "/api/admin/demo-transfer/process-refunds",
    "schedule": "0 2 * * *"
  }]
}
```

**Set environment variable:**
```
CRON_SECRET=your-secure-random-token
```

Or use an external service like:
- AWS CloudWatch
- GitHub Actions
- Google Cloud Scheduler
- Vercel Functions

### 4. Environment Variables

```env
# Required for refund processing
CRON_SECRET=your-secret-token-here

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Usage Examples

### Send Welcome Bonus to New User
```typescript
const response = await fetch('/api/admin/demo-transfer', {
  method: 'POST',
  body: JSON.stringify({
    to_account_number: 'USER-12345678',
    amount: 500,
    days_to_refund: 14,
    notes: 'Welcome onboarding bonus'
  })
});
```

### Send Demo Money to All Users Before Demo Day
```typescript
const response = await fetch('/api/admin/demo-transfer/bulk', {
  method: 'POST',
  body: JSON.stringify({
    amount: 1000,
    days_to_refund: 7
  })
});
```

### Check Transfer History
```typescript
const response = await fetch('/api/admin/demo-transfer/history?status=pending&limit=20');
const { data } = await response.json();
```

## Transfer Flow Diagram

### Internal User (Registered)
```
Admin sends transfer
        ↓
Create transfer record (status: completed)
        ↓
Update admin balance (-)
        ↓
Update user account balance (+)
        ↓
[IMMEDIATE] User sees balance credited
```

### External Account (Non-Registered)
```
Admin sends transfer
        ↓
Create account if not exists
        ↓
Create transfer record (status: pending, expires_at: +7/14 days)
        ↓
Update admin balance (-)
        ↓
Update account balance (+) as "Pending Demo Credit"
        ↓
[WAITING] Receiver sees pending funds
        ↓
[Day 7/14] Auto-refund job runs
        ↓
Mark transfer as refunded
        ↓
Refund to admin account (+)
        ↓
Deduct from receiver account (-)
```

## Security Considerations

1. **Admin-Only Operations**: All transfer endpoints check for admin role
2. **Balance Validation**: Ensures admin has sufficient demo balance
3. **RLS Policies**: Database policies ensure proper access control
4. **Audit Trail**: All transfers logged with timestamps and user info
5. **Idempotent**: Transfer IDs are unique to prevent duplicates
6. **Cron Protection**: Refund endpoint requires `CRON_SECRET` header

## Troubleshooting

### Transfers Not Showing in History
- Verify user is authenticated
- Check admin role permissions
- Ensure org_id matches user's organization

### Auto-Refund Not Running
- Verify `CRON_SECRET` is set in environment
- Check cron job logs/execution history
- Manually trigger: `POST /api/admin/demo-transfer/process-refunds`

### Balance Not Updating
- Check database RLS policies are permissive
- Verify account exists before transfer
- Check transaction logs for errors

## Components

- **DemoTransferForm** - Single transfer UI
- **BulkDemoTransfer** - Bulk transfer UI
- **DemoTransferHistory** - Transfer history with filtering
- **Admin Page** - Links to demo money feature

## Files Structure

```
lib/
  demo-transfer-service.ts        # Core service logic
  
app/api/admin/demo-transfer/
  route.ts                         # Single transfer endpoint
  bulk/route.ts                    # Bulk transfer endpoint
  history/route.ts                 # History endpoint
  process-refunds/route.ts         # Auto-refund processor
  
app/admin/demo-money/
  page.tsx                         # Admin demo money page
  
components/
  demo-transfer-form.tsx           # Single transfer form
  bulk-demo-transfer.tsx           # Bulk transfer form
  demo-transfer-history.tsx        # History view
  
scripts/
  006_create_accounts_table.sql    # Accounts schema
  007_create_demo_transfers_table.sql # Transfers schema
```

## Next Steps

1. **User Dashboard**: Add user-facing UI to display account balance and transfers
2. **Webhooks**: Integrate with external banking APIs for real transfers
3. **Multi-Currency**: Extend to support different currencies
4. **Analytics**: Add reporting on demo fund usage
5. **Limits**: Set spending limits or transfer caps per user
