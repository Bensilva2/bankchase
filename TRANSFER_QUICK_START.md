# Money Transfer API - Quick Start Guide

## 🚀 Get Started in 2 Minutes

### 1. Use in Your Component

```typescript
import { useTransfer } from '@/hooks/use-transfer'

export function MyPage() {
  const transfer = useTransfer()

  const handleSend = async () => {
    const success = await transfer.sendDemo({
      amount: 100,
      toAccountNumber: '1234567890'
    })
    
    if (success) {
      console.log('Transfer ID:', transfer.transactionId)
    }
  }

  return (
    <div>
      <button onClick={handleSend} disabled={transfer.loading}>
        {transfer.loading ? 'Processing...' : 'Send $100'}
      </button>
      {transfer.error && <p>Error: {transfer.error}</p>}
      {transfer.progress && <p>Progress: {transfer.progress.percent}%</p>}
    </div>
  )
}
```

### 2. Use the Pre-built Form

```typescript
import { TransferFormWorking } from '@/components/transfer-form-working'

export function Page() {
  return <TransferFormWorking />
}
```

### 3. Direct API Call

```bash
curl -X POST http://localhost:3000/api/transfers/mock \
  -H 'Content-Type: application/json' \
  -d '{"amount": 100, "toAccountNumber": "1234567890"}'
```

## 📊 Hook API Reference

```typescript
const transfer = useTransfer()

// State
transfer.loading       // boolean - true while processing
transfer.error         // string | null - error message
transfer.transactionId // string | null - transaction ID
transfer.status        // string - 'pending' | 'processing' | 'completed' | 'failed'
transfer.progress      // { percent, message } - progress info
transfer.transactions  // array - transaction history

// Methods
await transfer.sendDemo(request)              // Send demo transfer
await transfer.sendTransfer(request)          // Send authenticated transfer
await transfer.checkStatus(transactionId)     // Check status
await transfer.pollTransfer(transactionId)    // Poll until complete
await transfer.loadHistory()                  // Load transactions
transfer.reset()                              // Reset state
transfer.calculateFees(amount, bankCode)      // Calculate fees
```

## 📝 Request Format

```typescript
{
  amount: number                // Required (must be > 0)
  toAccountNumber?: string      // Default: '1234567890'
  toBankCode?: string           // Default: 'MOCK' or 'DEMO'
  currency?: string             // Default: 'USD'
  fromAccountId?: string        // Default: 'demo-account-1'
  narration?: string            // Optional description
}
```

## 📈 Response Format

```typescript
{
  success: boolean
  transactionId: string         // UUID for tracking
  status: string                // 'pending' | 'processing' | 'completed' | 'failed'
  error?: string                // Error message if failed
  details?: {
    message: string
    initiatedAt: string
  }
}
```

## 🧪 Test Scenarios

### Send $100 Transfer
```typescript
const result = await transfer.sendDemo({ amount: 100 })
```

### Send Large Amount
```typescript
const result = await transfer.sendDemo({ amount: 5000 })
```

### International Transfer
```typescript
const result = await transfer.sendDemo({
  amount: 100,
  toBankCode: 'SWIFT123',  // International code
  currency: 'EUR'
})
```

### Custom Recipient
```typescript
const result = await transfer.sendDemo({
  amount: 250,
  toAccountNumber: '9876543210',
  toBankCode: 'CUSTBANK'
})
```

## 💰 Fee Calculation

```typescript
const fees = transfer.calculateFees(100, 'MOCK', 'USD')
// Returns: { baseFee: 0, percentageFee: 0.10, totalFee: 0.10, total: 100.10 }

const intlFees = transfer.calculateFees(100, 'SWIFT', 'EUR')
// Returns: { baseFee: 2.50, percentageFee: 0.50, totalFee: 3.00, total: 103.00 }
```

## 📊 Status Progression

```
pending → processing → completed
                   ↓
                  failed
```

## ✅ Common Use Cases

### 1. Simple Transfer Button
```typescript
const handleTransfer = async () => {
  const success = await transfer.sendDemo({ amount: 100 })
  if (success) alert('Transfer sent!')
}
```

### 2. Progress Tracking
```typescript
const handleTransfer = async () => {
  const success = await transfer.sendDemo({ amount: 100 })
  if (success && transfer.progress) {
    console.log(`${transfer.progress.percent}% - ${transfer.progress.message}`)
  }
}
```

### 3. Error Handling
```typescript
const handleTransfer = async () => {
  const success = await transfer.sendDemo({ amount: 100 })
  if (!success && transfer.error) {
    console.error('Transfer failed:', transfer.error)
  }
}
```

### 4. Transaction History
```typescript
const MyHistory = () => {
  const transfer = useTransfer()
  
  useEffect(() => {
    transfer.loadHistory()
  }, [])
  
  return (
    <div>
      {transfer.transactions.map(tx => (
        <div key={tx.id}>
          ${tx.amount} to {tx.to_account_number} - {tx.status}
        </div>
      ))}
    </div>
  )
}
```

## 🐛 Troubleshooting

### Transfer Not Working?
1. Check browser console for errors
2. Verify network request in DevTools
3. Try the mock endpoint: `/api/transfers/mock`

### Always Getting Error?
1. Check request format matches documentation
2. Ensure amount is > 0
3. Verify network connectivity

### Need More Help?
1. See `TRANSFER_API_GUIDE.md` for detailed docs
2. Check `TRANSFER_API_IMPLEMENTATION.md` for architecture
3. Review component examples in `components/`

## 📚 Full Documentation

- **API Reference**: See `TRANSFER_API_GUIDE.md`
- **Implementation Details**: See `TRANSFER_API_IMPLEMENTATION.md`
- **Component Example**: See `components/transfer-form-working.tsx`
- **Hook Source**: See `hooks/use-transfer.ts`
- **Service Source**: See `lib/transfer-service.ts`

## 🚀 Ready to Use

The transfer API is fully implemented and ready to use immediately!

Just import and start transferring money:

```typescript
import { useTransfer } from '@/hooks/use-transfer'

const transfer = useTransfer()
const success = await transfer.sendDemo({ amount: 100 })
```

That's it! 🎉
