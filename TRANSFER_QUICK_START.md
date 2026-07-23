# Transfer API - Quick Start

## Demo Credentials
- **Email**: linhuang011@gmail.com
- **Password**: Lin1122
- **PIN**: 1234
- **Demo Account**: 1001001 (checking, $10,000 balance)
- **Receiver Account**: 2002002 (for testing)

## Step 1: Start Services
```bash
# Terminal 1: Start Next.js frontend
npm run dev

# Terminal 2: Start Python backend
cd backend && source .venv/bin/activate && python -m uvicorn main:app --reload --port 8000
```

## Step 2: Test Login
```bash
# Get auth token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"linhuang011@gmail.com","password":"Lin1122"}'
```

Response:
```json
{
  "success": true,
  "token": "...",
  "user": {...}
}
```

## Step 3: Test Transfer
```bash
# Send $500 transfer
curl -X POST http://localhost:8000/api/pay-transfer/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "from_account_number": "1001001",
    "to_account_number": "2002002",
    "to_bank_code": "INTERNAL",
    "amount": 500,
    "currency": "USD",
    "country_code": "US",
    "pin": "1234",
    "narration": "Test transfer"
  }'
```

Response:
```json
{
  "success": true,
  "transaction_id": "...",
  "receipt": {...},
  "message": "Transfer completed successfully"
}
```

## Step 4: Verify Transfer
Check that:
- ✅ Sender's balance decreased by $500
- ✅ Receiver's balance increased by $500
- ✅ Debit transaction created on sender's account
- ✅ Credit transaction created on receiver's account
- ✅ Receipt generated with receipt number
- ✅ Webhooks triggered (check logs)
- ✅ SMS alert sent (if configured)

## Transfer API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/pay-transfer/banks` | Get list of supported banks |
| POST | `/api/pay-transfer/send` | Send money transfer |

## Error Codes

| Error | Meaning | Solution |
|-------|---------|----------|
| 401 | Unauthorized | Login first and provide token |
| 404 | Account not found | Verify account_number is correct |
| 400 | Insufficient balance | Check account balance first |
| 400 | PIN validation failed | Verify PIN (3 attempts max) |
| 429 | Rate limited | Wait before sending more transfers |

## Frontend Integration

### Using Transfer Service
```typescript
import { executeTransferWorkflow } from '@/lib/transfer-integration'

const result = await executeTransferWorkflow({
  userId: 'user-id',
  fromAccountId: 'account-id',
  toAccountNumber: '2002002',
  toBankCode: 'INTERNAL',
  amount: 500,
  currency: 'USD',
  phoneNumber: '+1234567890',
  narration: 'Payment'
})

if (result.success) {
  console.log('Transfer ID:', result.transactionId)
} else {
  console.error('Transfer failed:', result.error)
}
```

## Troubleshooting Checklist

- [ ] Backend service running on port 8000
- [ ] Frontend service running on port 3000
- [ ] Valid auth token in Authorization header
- [ ] PIN is correct (1234 for demo)
- [ ] Sender account has sufficient balance
- [ ] Receiver account exists or will be created
- [ ] Bank code is valid (use "INTERNAL" for demo)
- [ ] Amount is positive number
- [ ] No more than 10 transfers per minute
