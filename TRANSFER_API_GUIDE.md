# Money Transfer API Documentation

Complete guide to using the BankChase money transfer system.

## Overview

The transfer API provides real-time money movement with the following features:
- Instant transfer processing
- Real-time status tracking
- Fee calculation
- Transaction history
- Error handling and validation
- Demo mode for testing

## API Endpoints

### 1. Send Transfer (Authenticated)

**Endpoint:** `POST /api/transfers/process`

Send a money transfer with authentication.

```bash
curl -X POST http://localhost:3000/api/transfers/process \
  -H "Content-Type: application/json" \
  -H "idempotency-key: unique-key-1234" \
  -d '{
    "fromAccountId": "account-123",
    "toAccountNumber": "1234567890",
    "toBankCode": "DEMO",
    "amount": 100,
    "currency": "USD",
    "narration": "Payment for services"
  }'
```

**Response (202 Accepted):**
```json
{
  "status": "processing",
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Transfer initiated. Processing in background...",
  "details": {
    "message": "Transfer initiated successfully",
    "initiatedAt": "2026-07-14T12:00:00.000Z"
  },
  "_links": {
    "status": "/api/transfers/status/550e8400-e29b-41d4-a716-446655440000",
    "poll_interval_ms": 5000
  }
}
```

**Request Parameters:**
- `fromAccountId` (required): UUID of sender's account
- `toAccountNumber` (required): Receiver's account number
- `toBankCode` (required): BIC/SWIFT code or routing number
- `amount` (required): Transfer amount (numeric)
- `currency` (optional): ISO currency code (default: USD)
- `narration` (optional): Transfer description

**Error Responses:**
- `400 Bad Request`: Validation failed (insufficient balance, invalid account)
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: Server error

### 2. Send Demo Transfer (No Auth)

**Endpoint:** `POST /api/transfers/demo`

Send a demo transfer for testing (no authentication required).

```bash
curl -X POST http://localhost:3000/api/transfers/demo \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "toAccountNumber": "1234567890",
    "toBankCode": "DEMO",
    "narration": "Demo transfer"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "status": "completed",
  "transaction": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "amount": 100,
    "currency": "USD",
    "reference": "REF-1721234400000",
    "timestamp": "2026-07-14T12:00:00.000Z"
  },
  "_links": {
    "status": "/api/transfers/status/550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### 3. Get Transfer Status

**Endpoint:** `GET /api/transfers/status?transactionId=UUID`

Check the status of a transfer.

```bash
curl http://localhost:3000/api/transfers/status?transactionId=550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "transaction": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "processing",
    "amount": 100,
    "currency": "USD",
    "receiver": {
      "accountNumber": "1234567890",
      "bankCode": "DEMO"
    },
    "timestamps": {
      "initiated": "2026-07-14T12:00:00.000Z",
      "processing": "2026-07-14T12:00:05.000Z",
      "completed": null
    },
    "referenceId": "REF-1721234400000",
    "failureReason": null,
    "elapsedSeconds": 5
  },
  "progress": {
    "percent": 50,
    "message": "Processing through payment network...",
    "stage": "processing"
  },
  "_meta": {
    "timestamp": "2026-07-14T12:00:05.000Z",
    "pollIntervalMs": 5000
  }
}
```

### 4. Batch Status Check

**Endpoint:** `POST /api/transfers/status`

Check status of multiple transfers in one request.

```bash
curl -X POST http://localhost:3000/api/transfers/status \
  -H "Content-Type: application/json" \
  -d '{
    "transactionIds": [
      "550e8400-e29b-41d4-a716-446655440000",
      "550e8400-e29b-41d4-a716-446655440001"
    ]
  }'
```

**Response:**
```json
{
  "total": 2,
  "found": 2,
  "notFound": 0,
  "transactions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "completed",
      "amount": 100,
      "currency": "USD",
      "receiverAccount": "1234567890",
      "updatedAt": "2026-07-14T12:00:30.000Z"
    }
  ]
}
```

### 5. Cancel Transfer

**Endpoint:** `DELETE /api/transfers/status?transactionId=UUID`

Cancel a pending transfer (only works for pending status).

```bash
curl -X DELETE http://localhost:3000/api/transfers/status?transactionId=550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "success": true,
  "message": "Transfer cancelled successfully",
  "transaction": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "failed"
  }
}
```

### 6. Demo Transfer History

**Endpoint:** `GET /api/transfers/demo/history`

Get history of demo transfers.

```bash
curl http://localhost:3000/api/transfers/demo/history
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "transactions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "completed",
      "amount": 100,
      "currency": "USD",
      "from_account_id": "demo-account-1",
      "to_account_number": "1234567890",
      "to_bank_code": "DEMO",
      "initiated_at": "2026-07-14T12:00:00.000Z",
      "completed_at": "2026-07-14T12:00:30.000Z"
    }
  ]
}
```

## React Integration

### Using the useTransfer Hook

```typescript
import { useTransfer } from '@/hooks/use-transfer'

export function MyTransferComponent() {
  const transfer = useTransfer()
  const [amount, setAmount] = useState('100')

  const handleTransfer = async () => {
    const success = await transfer.sendDemo({
      amount: parseFloat(amount),
      toAccountNumber: '1234567890',
      toBankCode: 'DEMO'
    })

    if (success) {
      console.log('Transfer created:', transfer.transactionId)
      console.log('Status:', transfer.status)
      console.log('Progress:', transfer.progress)
    }
  }

  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleTransfer} disabled={transfer.loading}>
        {transfer.loading ? 'Processing...' : 'Send Transfer'}
      </button>
      
      {transfer.error && <div>Error: {transfer.error}</div>}
      
      {transfer.progress && (
        <div>
          <div>{transfer.progress.percent}% - {transfer.progress.message}</div>
        </div>
      )}
    </div>
  )
}
```

### Hook API

```typescript
const transfer = useTransfer()

// State
transfer.loading        // Boolean
transfer.error          // String | null
transfer.transactionId  // String | null
transfer.status         // 'pending' | 'processing' | 'completed' | 'failed'
transfer.progress       // { percent: number, message: string } | null
transfer.transactions   // Array of TransactionStatus

// Methods
await transfer.sendTransfer(request)      // Send authenticated transfer
await transfer.sendDemo(request)          // Send demo transfer
await transfer.checkStatus(transactionId) // Check status
await transfer.pollTransfer(transactionId) // Poll until completion
await transfer.loadHistory()              // Load transaction history
transfer.reset()                          // Reset state
transfer.calculateFees(amount, bankCode)  // Calculate fees
```

## Transfer Service

### Direct Service Usage

```typescript
import {
  sendDemoTransfer,
  getTransferStatus,
  pollTransferStatus,
  getTransferHistory,
  calculateTransferFees
} from '@/lib/transfer-service'

// Send a demo transfer
const result = await sendDemoTransfer({
  amount: 100,
  toAccountNumber: '1234567890',
  toBankCode: 'DEMO'
})

if (result.success) {
  console.log('Transfer ID:', result.transactionId)
  
  // Check status
  const status = await getTransferStatus(result.transactionId!)
  console.log('Status:', status.transaction?.status)
  
  // Poll until completion
  const polled = await pollTransferStatus(result.transactionId!)
  console.log('Completed:', polled.completed)
}

// Calculate fees
const fees = calculateTransferFees(100, 'DEMO', 'USD')
console.log('Total:', fees.total) // 100.10 (with fee)
```

## Transfer Status Flow

```
pending
   ↓
processing
   ↓
completed (or failed)
```

**Status Meanings:**
- `pending`: Transfer created, awaiting processing
- `processing`: Transfer is being processed through payment network
- `completed`: Transfer successfully completed
- `failed`: Transfer failed (see failure_reason)

## Fee Structure

**Domestic Transfers (USD to USD routing number):**
- Base fee: $0
- Processing fee: 0.1% of amount

**International Transfers:**
- Base fee: $2.50
- Processing fee: 0.5% of amount

**Example:**
```
Amount: $100
Bank Code: SWIFTCODE (international)
Base Fee: $2.50
Processing Fee: $0.50
Total Fee: $3.00
Total with Amount: $103.00
```

## Error Handling

### Common Errors

**400 Bad Request - Missing Fields**
```json
{
  "error": "Missing required fields",
  "required": ["fromAccountId", "toAccountNumber", "toBankCode", "amount"]
}
```

**400 Bad Request - Validation Failed**
```json
{
  "error": "Transfer validation failed",
  "details": [
    "Insufficient balance. Available: 50, Required: 100",
    "Source account not found"
  ]
}
```

**401 Unauthorized**
```json
{
  "error": "Unauthorized"
}
```

**409 Conflict - Duplicate**
```json
{
  "error": "Idempotent request detected",
  "message": "Duplicate request - using existing transaction"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "message": "Detailed error message"
}
```

## Best Practices

1. **Use Idempotency Keys**: Prevent duplicate transfers
   ```typescript
   const idempotencyKey = `${userId}-${Date.now()}`
   ```

2. **Handle 202 Responses**: Transfers are async
   ```typescript
   if (response.status === 202) {
     // Start polling for status
   }
   ```

3. **Poll for Completion**: Check status regularly
   ```typescript
   const polled = await pollTransferStatus(transactionId)
   ```

4. **Store Transaction IDs**: Keep references for records
   ```typescript
   localStorage.setItem('lastTransactionId', transactionId)
   ```

5. **Show Progress to Users**: Use progress percentage
   ```typescript
   console.log(`${progress.percent}% - ${progress.message}`)
   ```

## Testing

### Manual Testing with Demo Endpoint

```bash
# Send demo transfer
curl -X POST http://localhost:3000/api/transfers/demo \
  -H "Content-Type: application/json" \
  -d '{ "amount": 100 }'

# Check status
curl http://localhost:3000/api/transfers/status?transactionId=<ID>

# Get history
curl http://localhost:3000/api/transfers/demo/history
```

### Component Testing

Use the `TransferFormWorking` component in your app:

```typescript
import { TransferFormWorking } from '@/components/transfer-form-working'

export default function Page() {
  return <TransferFormWorking />
}
```

## Database Schema

### Transactions Table

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  from_account_id UUID NOT NULL,
  to_account_number VARCHAR NOT NULL,
  to_bank_code VARCHAR NOT NULL,
  amount DECIMAL(19,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending',
  idempotency_key VARCHAR UNIQUE,
  narration TEXT,
  reference_id VARCHAR,
  initiated_at TIMESTAMP,
  processing_at TIMESTAMP,
  completed_at TIMESTAMP,
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

## Troubleshooting

### Transfer Stuck in Processing

1. Check database connection
2. Verify Supabase credentials
3. Check server logs: `console.log('[v0]', ...)`

### 401 Unauthorized

1. Ensure user is authenticated
2. Check authentication cookies
3. Verify Supabase auth session

### Transaction Not Found

1. Verify transaction ID is correct
2. Ensure user has access (authorization check)
3. Transaction may have expired (> 30 days)

## Production Deployment

1. **Enable HTTPS**: All transfers over HTTPS only
2. **Rate Limiting**: Implement rate limits per user
3. **Monitoring**: Set up error alerts and dashboards
4. **Backups**: Regular database backups
5. **Compliance**: Ensure PCI DSS compliance
6. **Logging**: Enable audit logging for all transfers

## Support

For issues or questions:
1. Check the error response details
2. Review server console logs
3. Verify database connectivity
4. Check authentication status
