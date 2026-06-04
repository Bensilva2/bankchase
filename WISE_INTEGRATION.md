# Wise API Integration Guide

Complete Wise Platform API integration for BankChase. This document covers the implementation, configuration, and next steps.

## Overview

BankChase now integrates with the Wise Platform API to enable real international money transfers with live exchange rates, fee calculations, and real-time transfer status updates via webhooks.

## What's Been Implemented

### 1. Core Infrastructure

- **Wise API Client** (`lib/wise/client.ts`)
  - OAuth 2.0 token management with automatic refresh
  - Rate limiting with exponential backoff retry logic
  - Idempotency support to prevent duplicate transfers
  - All core endpoints: quotes, recipients, transfers, balances

- **Error Handling** (`lib/wise/errors.ts`)
  - Comprehensive Wise error code mapping
  - User-friendly error messages
  - Retryable error detection

- **Webhook System** (`lib/wise/webhooks.ts`)
  - Signature verification for webhook authenticity
  - Event type parsing and handling
  - Transfer status change tracking

### 2. Database Schema

Created comprehensive Supabase tables in `scripts/setup-wise-schema.sql`:

- **wise_transfers** - Main transfer tracking
- **wise_quotes** - Cached exchange rate quotes
- **wise_recipients** - Saved recipient accounts
- **wise_webhooks** - Webhook event logs
- **wise_api_logs** - API call auditing

All tables include Row Level Security (RLS) policies for data isolation.

### 3. API Endpoints

#### Transfer Management
- `POST /api/wise/transfers` - Create new transfer
- `GET /api/wise/transfers` - List user transfers
- `POST /api/wise/transfers/[id]/fund` - Fund a transfer
- `GET /api/wise/transfers/[id]/fund` - Get transfer status

#### Quotes & Pricing
- `POST /api/wise/quotes` - Get live quote with fees & exchange rates
- `GET /api/wise/quotes` - Retrieve saved quote details

#### Recipients
- `POST /api/wise/recipients` - Create new recipient
- `GET /api/wise/recipients` - List saved recipients

#### Webhooks
- `POST /api/wise/webhooks` - Webhook receiver (signature verified)
- `GET /api/wise/webhooks` - Health check

### 4. React Components

#### `WiseTransferForm` (`components/wise-transfer-form.tsx`)
- Live quote fetching as user enters amount
- Real-time exchange rate display
- Fee calculation breakdown
- Recipient information form
- Idempotency-safe fund transfer

#### `WiseTransferHistory` (`components/wise-transfer-history.tsx`)
- Paginated transfer list with auto-refresh
- Status badges with icons
- Receipt amount display
- Error state handling

## Configuration

### Environment Variables Required

```env
# Wise API Credentials (from Developer Hub)
WISE_CLIENT_ID=your_client_id
WISE_CLIENT_SECRET=your_client_secret
WISE_API_ENVIRONMENT=sandbox  # or "production"
WISE_WEBHOOK_SECRET=your_webhook_secret

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Setup

Run the schema migration to create all tables:

```bash
psql $POSTGRES_URL < scripts/setup-wise-schema.sql
```

### Webhook Configuration

1. Go to Wise Developer Hub
2. Create webhook subscription for your app
3. Set webhook URL: `https://yourdomain.com/api/wise/webhooks`
4. Copy webhook secret and add to `.env`
5. Subscribe to events: `transfers#state-change`

## Key Features

### Idempotency
- Transfers use `customerTransactionId` to prevent duplicates
- Safe to retry on network failures
- Wise guarantees single-debit on duplicate attempts

### Rate Limiting
- Automatic exponential backoff (1s → 24h max)
- Respects Wise `retry-after` headers
- 100 requests/second, 1000 requests/minute per client

### Real-Time Updates
- Webhooks track all transfer status changes
- Database immediately reflects state updates
- UI auto-refreshes every 5 seconds
- Terminal states: completed, rejected, bounced

### Security
- HMAC-SHA256 webhook signature verification
- Per-user data isolation via RLS policies
- OAuth 2.0 token management
- No sensitive data in logs

## Testing

### Sandbox Testing

1. Access Wise Sandbox: `https://wise-sandbox.com`
2. Register test user
3. Use 2FA code: `111111`
4. Your test accounts have sample funds

### Testing the API

```bash
# Create quote
curl -X POST http://localhost:3000/api/wise/quotes \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": 123,
    "sourceCurrency": "USD",
    "targetCurrency": "EUR",
    "sourceAmount": 1000
  }'

# Create transfer
curl -X POST http://localhost:3000/api/wise/transfers \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": 123,
    "userId": "user-uuid",
    "quoteUuid": "quote-id",
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
  }'
```

### Test Webhook Delivery

Use ngrok or similar to expose localhost:

```bash
ngrok http 3000
# Set webhook URL to: https://your-ngrok-url.ngrok.io/api/wise/webhooks
```

## Integration Models

This implementation supports:
- **Enterprise Model** - Full control over quotes, recipients, transfers
- **Correspondent Model** - For bank partners
- **Embedded Model** - For embedded fintech solutions

Check `getWiseClient()` scope if you need different permissions.

## Error Handling

Common error codes and resolution:

| Code | Message | Resolution |
|------|---------|-----------|
| `INSUFFICIENT_BALANCE` | Not enough funds | Top up balance or reduce amount |
| `ROUTE_NOT_AVAILABLE` | Corridor not supported | Try different currency pair |
| `KYC_REQUIRED` | Account not verified | Complete KYC verification |
| `TRANSFER_EXPIRED` | Quote expired (30 min) | Create new quote |
| `RECIPIENT_BANK_DETAILS_INVALID` | Bad account info | Verify recipient details |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait (header: retry-after) |

## Performance Considerations

1. **Quote Caching** - Quotes are valid for 30 minutes, consider caching
2. **Webhook Retries** - Wise retries exponentially; don't deduplicate, use idempotency keys
3. **Rate Limiting** - 100 req/sec per client; queue requests if hitting limits
4. **Database Indexing** - All key columns indexed for fast lookups

## Monitoring & Logging

- API calls logged to `wise_api_logs` table
- Webhook events logged to `wise_webhooks` table
- Check logs for rate limit status
- Set up alerts for transfer rejections

## Next Steps

### Production Deployment

1. Get Wise production credentials
2. Switch `WISE_API_ENVIRONMENT` to "production"
3. Run full integration test with real amounts
4. Complete KYC verification for profiles
5. Set up monitoring/alerting

### Additional Features to Build

- [ ] Recipient list management UI
- [ ] Transfer schedule/repeat transfers
- [ ] Multi-currency balance management
- [ ] Card ordering
- [ ] Bulk transfers
- [ ] Custom branding/white-label
- [ ] Webhook retry dashboard

### Security Hardening

- [ ] Add rate limiting middleware
- [ ] Implement request signing (JOSE)
- [ ] Enable mTLS for additional security
- [ ] Add fraud detection
- [ ] Implement 2FA for large transfers

## Troubleshooting

### Webhook Not Received

1. Check webhook URL is HTTPS with valid certificate
2. Verify signature secret is correct
3. Check database has `wise_webhooks` table
4. Look at logs for processing errors
5. Test with `GET /api/wise/webhooks` (should return 200)

### Quote Fetch Fails

1. Verify profileId is correct
2. Check Wise API environment setting
3. Ensure OAuth token can refresh
4. Check rate limits (look for 429 response)

### Transfer Creation Fails

1. Verify quote hasn't expired (30 min max)
2. Ensure target account ID exists
3. Check recipient details are correct
4. Verify sufficient balance
5. Check for KYC requirements

## API Reference

Full Wise Platform API docs: https://docs.wise.com/api-reference/

Key endpoints used:
- `POST /oauth/token` - Get access token
- `POST /v3/quotes` - Create quote
- `POST /v1/recipient_accounts` - Create recipient
- `POST /v3/transfers` - Create transfer
- `POST /v3/transfers/{id}/fund` - Fund transfer
- `POST /api/wise/webhooks` - Receive webhooks

## Support

For issues:
1. Check error codes in `lib/wise/errors.ts`
2. Review Wise docs: https://docs.wise.com
3. Check webhook signature: `lib/wise/webhooks.ts`
4. Test with Wise sandbox first
5. Contact Wise support with transaction IDs
