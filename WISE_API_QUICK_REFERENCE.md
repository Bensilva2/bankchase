# Wise API Quick Reference

Quick lookup for all Wise-integrated endpoints in BankChase.

## Quotes Endpoints

### Get Live Quote
```
POST /api/wise/quotes
Content-Type: application/json

{
  "profileId": 123,
  "sourceCurrency": "USD",
  "targetCurrency": "EUR",
  "sourceAmount": 1000
}

Response:
{
  "id": "quote-uuid",
  "sourceCurrency": "USD",
  "targetCurrency": "EUR",
  "sourceAmount": 1000,
  "targetAmount": 925,
  "rate": 0.925,
  "fee": {
    "total": 5,
    "percentage": 0.5
  },
  "validUntil": "2024-06-04T16:00:00Z"
}
```

### Get Quote Details
```
GET /api/wise/quotes?quoteId=quote-uuid

Response: [same as above]
```

## Transfers Endpoints

### Create Transfer
```
POST /api/wise/transfers
Content-Type: application/json

{
  "profileId": 123,
  "userId": "user-id",
  "quoteUuid": "quote-uuid",
  "targetAccountId": 456,
  "sourceCurrency": "USD",
  "targetCurrency": "EUR",
  "sourceAmount": 1000,
  "targetAmount": 925,
  "exchangeRate": 0.925,
  "feeAmount": 5,
  "recipientAccountId": "789",
  "recipientName": "John Doe",
  "recipientAccountNumber": "DE89370400440532013000",
  "recipientBank": "Deutsche Bank"
}

Response:
{
  "id": "local-transfer-id",
  "wiseId": "wise-transfer-uuid",
  "status": "pending",
  "sourceCurrency": "USD",
  "targetCurrency": "EUR",
  "sourceAmount": 1000,
  "targetAmount": 925
}
```

### Fund Transfer
```
POST /api/wise/transfers/wise-transfer-uuid/fund
Content-Type: application/json

{
  "type": "BALANCE"
}

Response:
{
  "id": "wise-transfer-uuid",
  "status": "processing",
  "balanceTransactionId": "txn-id"
}
```

### Get Transfer Status
```
GET /api/wise/transfers/wise-transfer-uuid/fund

Response:
{
  "id": "wise-transfer-uuid",
  "status": "outgoing_payment_sent",
  "sourceCurrency": "USD",
  "targetCurrency": "EUR",
  "sourceAmount": 1000,
  "targetAmount": 925,
  "recipient": { ... },
  "details": { ... }
}
```

### List User Transfers
```
GET /api/wise/transfers?userId=user-id&limit=10&offset=0

Response:
{
  "transfers": [
    {
      "id": "local-id",
      "wiseId": "wise-uuid",
      "status": "completed",
      ...
    }
  ],
  "total": 5,
  "limit": 10,
  "offset": 0
}
```

## Recipients Endpoints

### Create Recipient
```
POST /api/wise/recipients
Content-Type: application/json

{
  "profileId": 123,
  "userId": "user-id",
  "accountHolderName": "John Doe",
  "currency": "EUR",
  "details": {
    "accountNumber": "DE89370400440532013000",
    "accountType": "IBAN",
    "bankCode": "DEUTDE"
  }
}

Response:
{
  "id": "local-recipient-id",
  "wiseId": "wise-recipient-uuid",
  "accountHolderName": "John Doe",
  "currency": "EUR",
  "bankDetails": { ... }
}
```

### List User Recipients
```
GET /api/wise/recipients?userId=user-id&currency=EUR

Response:
{
  "recipients": [
    {
      "id": "local-recipient-id",
      "wiseId": "wise-uuid",
      "accountHolderName": "John Doe",
      "currency": "EUR",
      ...
    }
  ]
}
```

## Webhooks Endpoint

### Receive Webhook
```
POST /api/wise/webhooks
x-signature: hmac-sha256-signature

{
  "id": "event-uuid",
  "type": "transfers#state-change",
  "timestamp": "2024-06-04T15:30:00Z",
  "occurredAt": "2024-06-04T15:29:55Z",
  "data": {
    "previousStatus": "incoming_payment_waiting",
    "currentStatus": "processing",
    "resource": {
      "id": "wise-transfer-uuid"
    }
  }
}

Response:
{
  "received": true
}
```

### Health Check
```
GET /api/wise/webhooks

Response:
{
  "status": "ok"
}
```

## Status Values

### Transfer States
- `pending` - Transfer created, awaiting funding
- `incoming_payment_waiting` - Waiting for payment from user
- `processing` - Processing with Wise
- `outgoing_payment_sent` - Money sent to recipient
- `completed` - Successfully delivered
- `bounced_back` - Payment rejected by bank
- `cancelled` - User cancelled
- `rejected` - Wise rejected

### Webhook Events
- `transfers#state-change` - Transfer status changed
- `transfers#created` - New transfer created
- `balances#credit` - Balance credited
- `balances#debit` - Balance debited

## Error Codes

### Common Errors

| Code | HTTP | Meaning |
|------|------|---------|
| `INSUFFICIENT_BALANCE` | 400 | Not enough funds |
| `ROUTE_NOT_AVAILABLE` | 400 | Currency pair not available |
| `KYC_REQUIRED` | 400 | Account needs verification |
| `TRANSFER_EXPIRED` | 400 | Quote expired (30 min) |
| `INVALID_REQUEST` | 400 | Malformed request |
| `UNAUTHORIZED` | 401 | Invalid credentials |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SERVICE_UNAVAILABLE` | 503 | Wise API down |

## Idempotency

All requests are idempotent using:
- `customerTransactionId` in request body (for transfers)
- `X-idempotence-uuid` header (for balance operations)

Same ID = same result, safe to retry.

## Rate Limits

- **Partner Accounts**: 100 req/sec, 1000 req/min
- **Personal Tokens**: 100-150 req/sec (platform dependent)
- **Retry-After**: Check response header for backoff time

## Testing Endpoints

### Sandbox Base URL
```
https://api.wise-sandbox.com
```

### Production Base URL
```
https://api.wise.com
```

Set via `WISE_API_ENVIRONMENT` env var.

## Authentication

All requests use OAuth 2.0 Bearer token:

```
Authorization: Bearer <access_token>
```

Tokens automatically refreshed by `WiseClient`.

## Usage Examples

### Complete Transfer Flow

```typescript
// 1. Get quote
const quote = await axios.post('/api/wise/quotes', {
  profileId: 123,
  sourceCurrency: 'USD',
  targetCurrency: 'EUR',
  sourceAmount: 1000
})

// 2. Create recipient
const recipient = await axios.post('/api/wise/recipients', {
  profileId: 123,
  userId: 'user-id',
  accountHolderName: 'John Doe',
  currency: 'EUR',
  details: { accountNumber: 'DE89...' }
})

// 3. Create transfer
const transfer = await axios.post('/api/wise/transfers', {
  profileId: 123,
  userId: 'user-id',
  quoteUuid: quote.data.id,
  targetAccountId: recipient.data.wiseId,
  ...quote.data,
  recipientName: 'John Doe'
})

// 4. Fund transfer
await axios.post(`/api/wise/transfers/${transfer.data.wiseId}/fund`, {
  type: 'BALANCE'
})

// 5. Webhook updates status automatically
```

## Debugging

Check logs:
- `wise_api_logs` - API calls
- `wise_webhooks` - Webhook events
- `wise_transfers` - Transfer states
- `wise_recipients` - Saved recipients

Use `GET /api/wise/transfers/{id}/fund` to check current status anytime.
