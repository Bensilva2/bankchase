# Plaid Integration Guide

This document provides a comprehensive guide to the Plaid integration implemented in MyBank.

## Overview

MyBank integrates with Plaid to enable:
1. **Account Linking** - Connect real bank accounts securely
2. **Transaction Sync** - Import transaction history and real-time data
3. **Link Analytics** - Monitor user conversion and error rates
4. **Item Debugging** - Diagnose connection issues and health problems

## Prerequisites

- Production Plaid account with Dashboard MCP access
- API credentials:
  - `PLAID_CLIENT_ID`
  - `PLAID_SECRET`
  - `PLAID_ENV` (sandbox or production)
  - `PLAID_DASHBOARD_TOKEN` (for analytics/debugging)

## Database Schema

### Tables Created

#### `plaid_accounts`
Stores linked bank accounts with balance information.

```sql
- id (UUID): Primary key
- user_id (UUID): Reference to user
- item_id (VARCHAR): Plaid item ID (unique)
- access_token (TEXT): Encrypted Plaid access token
- institution_id (VARCHAR): Bank/institution ID
- institution_name (VARCHAR): Bank name
- account_id (VARCHAR): Account identifier
- account_name (VARCHAR): Account display name
- account_type (VARCHAR): investment, credit, depository, loan, other
- account_mask (VARCHAR): Last 4 digits
- balance_current (DECIMAL): Current balance
- balance_available (DECIMAL): Available balance
- balance_limit (DECIMAL): Credit limit (if applicable)
- currency_code (VARCHAR): ISO 4217 code
- status (VARCHAR): active, inactive, error
- last_sync_at (TIMESTAMP): Last successful sync
```

#### `plaid_transactions`
Stores transaction history from linked accounts.

```sql
- id (UUID): Primary key
- user_id (UUID): Reference to user
- plaid_account_id (UUID): Reference to plaid_accounts
- transaction_id (VARCHAR): Unique transaction ID
- pending_transaction_id (VARCHAR): For pending transactions
- amount (DECIMAL): Transaction amount
- iso_currency_code (VARCHAR): Currency code
- categories (TEXT[]): Transaction categories
- date (DATE): Transaction date
- merchant_name (VARCHAR): Merchant name
- personal_finance_category_primary (VARCHAR): PFC category
- personal_finance_category_detailed (VARCHAR): PFC detail
- direction (VARCHAR): IN or OUT
```

#### `plaid_link_sessions`
Tracks Plaid Link flow sessions for analytics.

```sql
- id (UUID): Primary key
- user_id (UUID): Reference to user
- session_id (VARCHAR): Unique session ID
- link_token (VARCHAR): Plaid link token
- status (VARCHAR): initiated, completed, error, exited
- institution_id (VARCHAR): Institution selected
- institution_name (VARCHAR): Institution name
- error_code (VARCHAR): Error code if failed
- error_message (TEXT): Error details
- item_id (VARCHAR): Resulting item ID
- public_token (VARCHAR): Token to exchange
- linked_at (TIMESTAMP): When linking completed
- created_at (TIMESTAMP): Session start time
```

#### `plaid_item_status`
Tracks item health and webhook information for debugging.

```sql
- id (UUID): Primary key
- user_id (UUID): Reference to user
- item_id (VARCHAR): Plaid item ID
- webhook_code (VARCHAR): Last webhook code
- webhook_type (VARCHAR): Webhook type
- error_code (VARCHAR): Current error code
- error_message (TEXT): Error details
- last_successful_webhook (TIMESTAMP): Last good webhook
- item_login_required (BOOLEAN): Re-auth needed
- consent_expiration_time (TIMESTAMP): Consent expiry
```

#### `plaid_api_metrics`
Tracks API usage and performance metrics.

```sql
- id (UUID): Primary key
- metric_type (VARCHAR): Metric category
- endpoint (VARCHAR): API endpoint called
- request_count (INTEGER): Total requests
- error_count (INTEGER): Failed requests
- avg_response_time_ms (INTEGER): Average response time
- date (DATE): Metric date
- environment (VARCHAR): sandbox or production
```

## API Endpoints

### Account Linking

#### Create Link Token
```http
POST /api/plaid/create-link-token
Authorization: Bearer {token}

Response:
{
  "linkToken": "link_...",
  "expiration": "2025-05-20T12:00:00Z"
}
```

#### Exchange Public Token
```http
POST /api/plaid/exchange-token
Authorization: Bearer {token}
Content-Type: application/json

{
  "publicToken": "public_...",
  "metadata": {
    "institutionName": "Chase"
  }
}

Response:
{
  "success": true,
  "itemId": "item_...",
  "accountCount": 3,
  "transactionCount": 150
}
```

### Account Management

#### Get Linked Accounts
```http
GET /api/plaid/accounts
Authorization: Bearer {token}

Response:
{
  "accounts": [
    {
      "id": "uuid",
      "account_name": "Checking Account",
      "account_mask": "4567",
      "account_type": "depository",
      "institution_name": "Chase",
      "balance_current": 5000.00,
      "balance_available": 4500.00,
      "currency_code": "USD",
      "status": "active"
    }
  ],
  "count": 1
}
```

### Analytics

#### Get Link Analytics
```http
GET /api/plaid/analytics?type={type}&days={days}
Authorization: Bearer {token}

Types:
- funnel: Conversion metrics
- usage: API usage metrics
- errors: Top errors

Response (funnel):
{
  "total": 50,
  "initiated": 50,
  "completed": 42,
  "errors": 5,
  "exited": 3,
  "completion_rate": "84.00",
  "error_rate": "10.00"
}

Response (usage):
{
  "period_days": 30,
  "total_requests": 1250,
  "total_errors": 18,
  "error_rate": "1.44",
  "avg_response_time_ms": 245,
  "daily_metrics": [...]
}

Response (errors):
[
  {
    "error_code": "INVALID_CREDENTIALS",
    "count": 5
  },
  {
    "error_code": "MFA_NOT_SUPPORTED",
    "count": 3
  }
]
```

### Debugging

#### Get Item Health
```http
GET /api/plaid/debug?itemId={itemId}&action={action}
Authorization: Bearer {token}

Actions:
- health: Item health status
- webhook-history: Recent webhooks
- error-trends: Error patterns over time

Response (health):
{
  "item_id": "item_...",
  "institution_id": "ins_...",
  "institution_name": "Chase",
  "status": "healthy|warning|error",
  "last_webhook_code": "WEBHOOK_VERIFIED",
  "webhook_failures_24h": 0,
  "recommendations": ["All systems operational"]
}
```

#### Debug Item (POST)
```http
POST /api/plaid/debug
Authorization: Bearer {token}
Content-Type: application/json

{
  "accessToken": "access_...",
  "action": "debug-item|simulate-webhook|force-sync",
  "webhookCode": "WEBHOOK_VERIFIED"
}

Response:
{
  "item_id": "item_...",
  "institution_id": "ins_...",
  "accounts_count": 3,
  "transactions_synced": 150,
  "requires_re_authentication": false,
  "known_issues": []
}
```

## Components

### PlaidLinkButton
React component to initiate Plaid Link flow.

```tsx
import { PlaidLinkButton } from '@/components/plaid-link-button';

function MyComponent() {
  return (
    <PlaidLinkButton 
      onSuccess={(metadata) => console.log('Account linked!', metadata)}
      onError={(error) => console.error('Link failed:', error)}
    />
  );
}
```

### PlaidAccountsManager
Component to display and manage linked accounts.

```tsx
import { PlaidAccountsManager } from '@/components/plaid-accounts-manager';

function Accounts() {
  return <PlaidAccountsManager />;
}
```

### PlaidAnalyticsDashboard
Component to view Link analytics and usage metrics.

```tsx
import { PlaidAnalyticsDashboard } from '@/components/plaid-analytics-dashboard';

function Analytics() {
  return <PlaidAnalyticsDashboard />;
}
```

## Services

### PlaidService
Core service for Plaid API interactions.

```typescript
import { PlaidService } from '@/lib/plaid-service';

// Create link token
const { linkToken } = await PlaidService.createLinkToken(userId);

// Exchange public token
const { accessToken, itemId } = await PlaidService.exchangePublicToken(publicToken);

// Get accounts
const { accounts } = await PlaidService.getAccounts(accessToken);

// Get transactions
const { transactions } = await PlaidService.getTransactions(
  accessToken,
  '2025-01-01',
  '2025-05-17'
);

// Save account to database
await PlaidService.saveAccount(userId, itemId, accessToken, institutionId, accountData);

// Save transactions to database
await PlaidService.saveTransactions(userId, accountId, transactions);
```

### PlaidAnalyticsService
Analytics and monitoring service.

```typescript
import { PlaidAnalyticsService } from '@/lib/plaid-analytics-service';

// Get conversion funnel
const funnel = await PlaidAnalyticsService.getConversionFunnel(userId);

// Get API usage metrics
const usage = await PlaidAnalyticsService.getUsageMetrics(30);

// Track metric
await PlaidAnalyticsService.trackMetric('link', '/endpoint', 250, false);

// Get top errors
const errors = await PlaidAnalyticsService.getTopErrors(userId, 10);
```

### PlaidDebugService
Debugging and diagnostics service.

```typescript
import { PlaidDebugService } from '@/lib/plaid-debug-service';

// Debug item
const debug = await PlaidDebugService.debugItem(accessToken);

// Get health report
const health = await PlaidDebugService.getItemHealthReport(itemId);

// Get error trends
const trends = await PlaidDebugService.getErrorTrends(userId, 30);

// Simulate webhook
await PlaidDebugService.simulateWebhook(accessToken, 'WEBHOOK_VERIFIED');

// Force transaction sync
await PlaidDebugService.forceTransactionSync(accessToken);
```

## Security Considerations

1. **Access Token Storage**: Encrypted in database using pgcrypto
2. **Row-Level Security**: Users can only view their own data
3. **API Authentication**: All endpoints require Bearer token
4. **Environment Variables**: Keep API keys in secure environment variables
5. **Token Rotation**: Access tokens should be refreshed periodically
6. **Webhook Verification**: Verify webhook signatures from Plaid
7. **PII Protection**: Transaction data is encrypted and access-controlled

## Webhook Setup

To receive real-time updates from Plaid:

1. Set webhook URL in Plaid Dashboard:
   ```
   https://yourdomain.com/api/plaid/webhooks
   ```

2. Implement webhook handler:
   ```typescript
   export async function POST(request: NextRequest) {
     const signature = request.headers.get('plaid-verification');
     const body = await request.text();
     
     // Verify signature
     // Process webhook event
     // Update database
   }
   ```

3. Subscribe to webhook codes:
   - `WEBHOOK_VERIFIED`: Item successfully verified
   - `WEBHOOK_UPDATE_ACKNOWLEDGED`: Account update
   - `TRANSACTIONS_UPDATED`: New transactions available
   - `ITEM_LOGIN_REQUIRED`: Re-authentication needed
   - `ERROR`: Item error occurred

## Troubleshooting

### Item Login Required
User's credentials have expired or institution requires re-authentication.

**Solution**: Prompt user to re-link account via `PlaidLinkButton`

### Webhook Not Received
Webhooks not arriving from Plaid.

**Solution**: 
1. Verify webhook URL is publicly accessible
2. Check firewall/security rules
3. Use `debugItem()` to check item status
4. Test webhook with `simulateWebhook()`

### Transactions Not Syncing
New transactions not appearing in database.

**Solution**:
1. Check item health with `getItemHealthReport()`
2. Force sync with `forceTransactionSync()`
3. Verify account is active in Plaid
4. Check transaction date range

### API Errors
Getting errors from Plaid API.

**Solution**:
1. Verify credentials in environment variables
2. Check API rate limits
3. Use `debugItem()` for detailed error info
4. Review Plaid docs for specific error codes

## Future Enhancements

- Webhook signature verification
- Transaction categorization and analysis
- Real-time balance alerts
- Scheduled transaction syncing
- Support for Plaid Investments API
- Support for Plaid Transfer API
- Advanced reporting and analytics
- Integration with Plaid Dashboard MCP for advanced monitoring
- Machine learning-based spending insights
- Budget tracking and alerts

## References

- [Plaid API Documentation](https://plaid.com/docs/api)
- [Plaid Link Documentation](https://plaid.com/docs/link)
- [Plaid Dashboard MCP](https://plaid.com/docs/api/dashboard-mcp)
- [Plaid Error Codes](https://plaid.com/docs/errors/overview)
