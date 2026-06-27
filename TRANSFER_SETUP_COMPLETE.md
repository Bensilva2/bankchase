# Transfer System - Complete Setup & Testing Guide

## Prerequisites

Before testing transfers, ensure:

1. **Backend Dependencies Installed**
   ```bash
   cd /vercel/share/v0-project/backend
   source .venv/bin/activate
   pip list | grep -E "fastapi|asyncpg|pydantic"
   ```

2. **Database Tables Exist**
   - accounts
   - transactions
   - receipts
   - banks
   - users

3. **Demo User Created**
   - Email: linhuang011@gmail.com
   - Password: Lin1122
   - PIN: 1234

## Complete Setup Walkthrough

### Phase 1: Environment Setup (5 minutes)

**1.1 Create Virtual Environment**
```bash
cd /vercel/share/v0-project/backend
python3 -m venv .venv
source .venv/bin/activate
```

**1.2 Install Dependencies**
```bash
pip install fastapi uvicorn asyncpg pydantic python-dotenv slowapi qstash
```

**1.3 Create .env File**
```bash
cat > /vercel/share/v0-project/backend/.env << EOF
DATABASE_URL=postgresql://user:password@localhost:5432/bankchase_db
QSTASH_TOKEN=your_token_here
QSTASH_LOCAL_MODE=true
DEBUG=true
EOF
```

### Phase 2: Database Setup (5 minutes)

**2.1 Create Tables (if not exist)**
```sql
-- Run migrations
psql -U postgres -d bankchase_db -f /vercel/share/v0-project/migrations/001-ledger-schema.sql
```

**2.2 Verify Tables**
```bash
psql -U postgres -d bankchase_db -c "\dt"
```

Should show:
- accounts
- transactions
- receipts
- banks
- users

**2.3 Create Demo User**
```sql
INSERT INTO users (id, email, password_hash, first_name, last_name)
VALUES (
  'user-123',
  'linhuang011@gmail.com',
  '$2b$12$...',  -- bcrypt hash of 'Lin1122'
  'Lin',
  'Huang'
);

INSERT INTO user_pins (user_id, pin_hash)
VALUES ('user-123', '$2b$12$...');  -- bcrypt hash of '1234'
```

**2.4 Create Demo Accounts**
```sql
INSERT INTO accounts (id, user_id, account_number, balance, account_type)
VALUES 
  ('acc-1', 'user-123', '1001001', 10000.00, 'checking'),
  ('acc-2', NULL, '2002002', 0.00, 'checking');
```

### Phase 3: Service Startup (2 minutes)

**3.1 Terminal 1: Start Backend**
```bash
cd /vercel/share/v0-project/backend
source .venv/bin/activate
python -m uvicorn main:app --reload --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

**3.2 Terminal 2: Start Frontend**
```bash
cd /vercel/share/v0-project
npm run dev
```

Expected output:
```
  ▲ Next.js 16.x
  - Local:        http://localhost:3000
  - Environments: .env.local | .env.development.local
```

**3.3 Terminal 3: Start QStash (Optional)**
```bash
npm run qstash:dev
```

### Phase 4: End-to-End Testing (10 minutes)

#### Test 4.1: Health Check
```bash
curl -s http://localhost:8000/health | jq .
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

#### Test 4.2: Get Banks
```bash
curl -s http://localhost:8000/api/pay-transfer/banks?country_code=US | jq .
```

Expected response:
```json
{
  "country": "US",
  "banks": [
    {
      "code": "CHASE",
      "name": "JPMorgan Chase",
      "short_name": "Chase",
      "routing_number": "021000021"
    }
  ]
}
```

#### Test 4.3: Login (Get Token)
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"linhuang011@gmail.com","password":"Lin1122"}' | jq -r .token)

echo "Token: $TOKEN"
```

#### Test 4.4: Check Account Balance
```bash
curl -s -X GET "http://localhost:8000/api/accounts?account_number=1001001" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

Expected: Balance = 10000

#### Test 4.5: Send Transfer
```bash
curl -X POST http://localhost:8000/api/pay-transfer/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "from_account_number": "1001001",
    "to_account_number": "2002002",
    "to_bank_code": "INTERNAL",
    "amount": 500,
    "currency": "USD",
    "country_code": "US",
    "pin": "1234",
    "narration": "Test transfer"
  }' | jq .
```

Expected response:
```json
{
  "success": true,
  "transaction_id": "tx-xyz",
  "receipt": {
    "receipt_id": "rcp-123",
    "receipt_number": "RCP-2024-001",
    "amount": 500
  }
}
```

#### Test 4.6: Verify Balances Changed
```bash
# Check sender balance (should be 9500)
curl -s "http://localhost:8000/api/accounts?account_number=1001001" \
  -H "Authorization: Bearer $TOKEN" | jq .balance

# Check receiver balance (should be 500)
curl -s "http://localhost:8000/api/accounts?account_number=2002002" | jq .balance
```

#### Test 4.7: Get Transaction History
```bash
curl -s -X GET "http://localhost:8000/api/transactions?account_id=acc-1" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

Expected: Should show debit transaction for 500

#### Test 4.8: Get Receipt
```bash
curl -s -X GET "http://localhost:8000/api/receipts?receipt_number=RCP-2024-001" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

## Common Issues & Solutions

### Issue 1: "Connection refused" on port 8000
**Cause**: Backend not running
**Solution**: 
```bash
cd backend && source .venv/bin/activate && python -m uvicorn main:app --reload --port 8000
```

### Issue 2: "Unauthorized" (401)
**Cause**: Missing or invalid token
**Solution**:
```bash
# Get new token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login ...)
# Add to request header
-H "Authorization: Bearer $TOKEN"
```

### Issue 3: "Source account not found" (404)
**Cause**: Account doesn't exist or doesn't belong to user
**Solution**:
```bash
# Verify account exists
psql -c "SELECT * FROM accounts WHERE account_number='1001001';"
# Verify user owns it
psql -c "SELECT * FROM accounts WHERE account_number='1001001' AND user_id='user-123';"
```

### Issue 4: "Insufficient balance" (400)
**Cause**: Not enough money in account
**Solution**:
```bash
# Check balance
curl -s "http://localhost:8000/api/accounts?account_number=1001001" | jq .balance
# Transfer less or add more funds
```

### Issue 5: "PIN validation failed" (400)
**Cause**: Wrong PIN or account locked
**Solution**:
```bash
# Use correct PIN: 1234
# Wait 15 minutes if locked
psql -c "SELECT * FROM user_pins WHERE user_id='user-123';"
```

### Issue 6: "Rate limited" (429)
**Cause**: Too many requests (>10/minute)
**Solution**: Wait 1 minute before trying again

## Verification Checklist

After each transfer, verify:

```bash
# 1. Transaction created (debit)
curl -s "http://localhost:8000/api/transactions?type=debit" | jq .data[0]

# 2. Transaction created (credit)
curl -s "http://localhost:8000/api/transactions?type=credit" | jq .data[0]

# 3. Balances updated
curl -s "http://localhost:8000/api/accounts" | jq '.[] | {account_number, balance}'

# 4. Receipt generated
curl -s "http://localhost:8000/api/receipts" | jq '.data[0]'

# 5. Webhook triggered
curl -s "http://localhost:8000/api/webhook-logs" | jq '.data[-1]'

# 6. SMS queued
curl -s "http://localhost:8000/api/sms-logs" | jq '.data[-1]'
```

## Advanced Testing

### Load Testing (5 transfers)
```bash
for i in {1..5}; do
  echo "Transfer $i"
  curl -X POST http://localhost:8000/api/pay-transfer/send \
    -H "Authorization: Bearer $TOKEN" \
    -d "{...amount: 100...}"
  sleep 1
done
```

### Concurrent Transfers (Idempotency Test)
```bash
# Send same transfer twice simultaneously
curl -X POST http://localhost:8000/api/pay-transfer/send {...} &
curl -X POST http://localhost:8000/api/pay-transfer/send {...} &
wait

# Should see only one transaction, not duplicate
curl -s "http://localhost:8000/api/transactions?type=debit" | jq length
```

### Error Scenarios
```bash
# Insufficient funds
curl ... -d '{...amount: 50000...}'

# Invalid account
curl ... -d '{...to_account_number: "9999999"...}'

# Invalid PIN
curl ... -d '{...pin: "9999"...}'

# Missing fields
curl ... -d '{...from_account_number: ...}'

# Negative amount
curl ... -d '{...amount: -500...}'
```

## Performance Metrics

Expected response times:
- Login: < 100ms
- Get banks: < 50ms
- Send transfer: 200-500ms (sync), 50-100ms (queued response)
- Get transactions: < 100ms
- Get receipt: < 50ms

## Next Steps

1. ✅ Set up environment
2. ✅ Create database tables
3. ✅ Create demo data
4. ✅ Start services
5. ✅ Test basic endpoints
6. ✅ Test complete transfer flow
7. ✅ Verify all data was updated correctly
8. ✅ Check webhooks and SMS alerts
9. ✅ Test error scenarios
10. ✅ Load test with multiple transfers

Once all tests pass, your transfer system is fully operational!
