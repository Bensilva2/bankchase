# BankChase Banking Platform - Quick Start Guide

## 5-Minute Setup

### Step 1: Database Migration
Run this in your Supabase SQL editor:

```sql
-- Copy entire contents of scripts/002-create-ledger.sql and paste here
-- This creates all necessary tables and indexes for transactions
```

### Step 2: Environment Variables
Add to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Step 3: Test the Flow

**Create Transfer:**
```bash
curl -X POST http://localhost:3000/api/transfers/process \
  -H "Content-Type: application/json" \
  -H "idempotency-key: test-$(date +%s)" \
  -d '{
    "fromAccountId": "test-account-id",
    "toAccountNumber": "DE89370400440532013000",
    "toBankCode": "DEUTDE8AXXX",
    "amount": 100,
    "currency": "EUR"
  }'
```

**Check Status:**
```bash
curl http://localhost:3000/api/transfers/status?transactionId=<ID>
```

**Simulate Webhook:**
```bash
curl -X POST http://localhost:3000/api/webhooks/payment-provider \
  -H "Content-Type: application/json" \
  -H "x-provider-name: swift" \
  -d '{
    "event_id": "evt-'$(date +%s)'",
    "transaction_id": "<ID>",
    "status": "delivered"
  }'
```

---

## Component Usage

### Add Transaction Monitor to Dashboard

```tsx
import TransactionMonitor from '@/components/transaction-monitor'

export default function Dashboard() {
  const [transactionId, setTransactionId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {transactionId && (
        <TransactionMonitor
          transactionId={transactionId}
          onStatusChange={(status) => console.log('Transfer:', status)}
          autoClose={true}
        />
      )}
    </div>
  )
}
```

### Add Metrics Widget

```tsx
import TransactionMetrics from '@/components/transaction-metrics'

export default function Dashboard() {
  return (
    <div>
      <TransactionMetrics />
    </div>
  )
}
```

### Display Transfer Status

```tsx
import TransferStatusCard from '@/components/transfer-status-card'

const transfer = {
  id: 'txn-123',
  amount: 100,
  currency: 'EUR',
  status: 'completed',
  receiverAccount: 'DE89370400440532013000',
  receiverBank: 'Deutsche Bank',
  initiatedAt: new Date().toISOString(),
  completedAt: new Date().toISOString()
}

export default function TransferView() {
  return (
    <TransferStatusCard
      transfer={transfer}
      onCancel={async (id) => console.log('Cancel:', id)}
      onRetry={async (id) => console.log('Retry:', id)}
    />
  )
}
```

---

## Common Tasks

### Change SMS Provider to Infobip

1. Update environment:
```env
SMS_PROVIDER=infobip
INFOBIP_API_KEY=your_key
INFOBIP_BASE_URL=https://api.infobip.com
INFOBIP_PHONE_NUMBER=BankChase
```

2. No code changes needed - service abstraction handles it!

### Test Idempotency

Same idempotency key = same transaction:

```bash
KEY="idempotency-key-test-$(date +%s)"

# First call
curl -X POST http://localhost:3000/api/transfers/process \
  -H "idempotency-key: $KEY" \
  -d '{...}' > /tmp/first.json

# Second call with same key - should get identical transactionId
curl -X POST http://localhost:3000/api/transfers/process \
  -H "idempotency-key: $KEY" \
  -d '{...}' > /tmp/second.json
```

---

## Troubleshooting

### Transfer stuck at "processing"
- Check payment provider status page
- Verify webhook is being received
- Check webhook signature in error logs

### SMS not sending
- Verify environment variables are set
- Check Twilio/Infobip API limits
- Confirm phone number format: `+1` prefix required

### Database migration fails
- Ensure Supabase service role key is correct
- Check you have superuser permissions
- Verify PostgreSQL version is 13+

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/transfer-processor.ts` | Transfer logic |
| `lib/sms-alerts.ts` | SMS notifications |
| `lib/webhook-verifier.ts` | Webhook security |
| `components/transaction-monitor.tsx` | Real-time UI |
| `scripts/002-create-ledger.sql` | Database schema |
| `BANKING_UPDATE_IMPLEMENTATION.md` | Full docs |
| `IMPLEMENTATION_SUMMARY.md` | Technical overview |

---

**Full Documentation**: See `BANKING_UPDATE_IMPLEMENTATION.md` for detailed information.
