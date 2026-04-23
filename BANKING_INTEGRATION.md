# Chase Bank Mobile App - Real-Time Banking Integration Guide

## Overview
The Chase Bank mobile app is now fully integrated with real-time banking APIs that connect all features to live data and operations. All endpoints use user authentication via `x-user-id` header and return real-time responses.

## API Endpoints

### Accounts API (`/api/accounts`)
**Real-time account management and balance synchronization**

- **GET** - Fetch all user accounts with real-time balances
  - Returns: accounts array, total balance, sync timestamp
  - Syncs every 30 seconds
  - Security: Requires x-user-id header

- **POST** - Create new account or link external account
  - Body: `{ name, type, accountNumber, routingNumber }`
  - Returns: newly created account with ID
  - Masks account numbers for security (stores last 4 digits only)

### Transactions API (`/api/transactions`)
**Real-time transaction history and analytics**

- **GET** - Fetch transactions with optional filters
  - Query params: `accountId` (optional), `days` (default 30)
  - Returns: transactions array, spending by category, count
  - Syncs every 60 seconds
  - Includes spending analysis by category

- **POST** - Record new transaction
  - Body: `{ accountId, type, description, amount, merchant, category }`
  - Validates sufficient funds
  - Updates account balance automatically
  - Creates notification alerts

### Transfers API (`/api/transfers`)
**Wire transfers, Zelle, ACH, and internal transfers**

- **POST** - Create transfer
  - Supports: `wire`, `zelle`, `ach`, `internal`, `bill_pay`
  - Wire: Requires routing number, takes 1-2 business days
  - Zelle: Requires email/phone, instant delivery
  - Internal: Between own accounts, instant
  - Bill Pay: Scheduled or immediate payments
  - Creates corresponding transactions and updates balances

- **GET** - Get transfer history
  - Returns: all transfers with status and recipients
  - Includes scheduled transfers

### Bill Pay API (`/api/bill-pay`)
**Utilities, credit cards, loans, subscriptions**

- **GET** - Fetch all bills and payees
  - Returns: bills array with categories
  - Calculates bills due this month
  - Includes total amount due

- **POST** - Create or update bill
  - Categories: `utility`, `credit_card`, `loan`, `subscription`, `insurance`, `other`
  - Frequency: `once`, `monthly`, `quarterly`, `yearly`
  - Schedules automatic payments or one-time payments

- **DELETE** - Remove bill
  - Query param: `billId`

### Zelle API (`/api/zelle`)
**Peer-to-peer transfers via email or phone**

- **GET** - Fetch Zelle contacts and transfer history
  - Query param: `type` (contacts | history)
  - Returns: saved contacts with names and contact info
  - Also returns transfer history

- **POST** - Send Zelle transfer or add contact
  - Actions: `send` (transfer) or `add_contact` (save contact)
  - Limits: $0.01 - $5,000 per transfer
  - Instant delivery to recipients
  - Optional contact saving for future transfers

- **DELETE** - Remove Zelle contact
  - Query param: `contactId`

### Credit API (`/api/credit`)
**Credit score, credit cards, credit journey**

- **GET** - Fetch credit score and card information
  - Returns: credit score (out of 850), status, trend
  - Card details: limits, balances, APR
  - Credit utilization percentage
  - Updates monthly

- **POST** - Add or update credit card
  - Fields: card name, type, limit, balance, due date, APR
  - Tracks card status and utilization

- **GET** `/credit/journey` - Get credit journey and tips
  - Returns: score improvements, recommendations
  - Actionable tips for credit building
  - Impact level for each recommendation

### Notifications API (`/api/notifications`)
**Push, email, SMS notification management**

- **GET** - Fetch user notifications
  - Query params: `unreadOnly` (true/false), `category` (optional)
  - Returns: notifications array with read status
  - Unread count for badge display
  - Syncs every 10 seconds

- **PATCH** - Mark notification as read
  - Body: `{ notificationId }` or `{ markAllAsRead: true }`
  - Updates read status instantly

- **DELETE** - Delete notification
  - Query param: `notificationId`

- **POST** `/notifications/preferences` - Update notification settings
  - Controls: email, SMS, push, transaction alerts, security alerts
  - Promotional and offer notifications

### Settings API (`/api/settings`)
**User preferences, security, accessibility**

- **GET** - Fetch all user settings
  - Returns: display settings (theme, text size, contrast, motion)
  - Notification preferences
  - Security settings (2FA, biometric, session timeout)

- **PATCH** - Update settings
  - Fields: theme, textSize, highContrast, reduceMotion, language
  - Security: twoFactorEnabled, biometricEnabled, sessionTimeout, autoLogout

- **POST** `/settings/session-timeout` - Update auto-logout timeout
  - Minimum 60 seconds
  - Updates session management rules

## Real-Time Data Synchronization

### Banking Integration Service (`/lib/banking-integration.ts`)
Central hub for all banking operations with automatic sync:

```typescript
// Initialize banking integration
const integration = new BankingIntegrationService(userId)
await integration.initialize(userId)

// Automatic sync every 30 seconds
integration.startRealTimeSync()

// Methods available
await integration.fetchAccounts()
await integration.fetchTransactions(days)
await integration.fetchNotifications()
await integration.sendWire(...)
await integration.sendZelle(...)
await integration.addBill(...)
await integration.createTransfer(...)
```

### useBanking Hook (`/hooks/use-banking.ts`)
React hook for component integration with SWR caching:

```typescript
const {
  // Data
  accounts,
  transactions,
  notifications,
  bills,
  credit,
  settings,
  
  // Metadata
  totalBalance,
  unreadNotifications,
  billsDueThisMonth,
  totalDueThisMonth,
  
  // Operations
  sendWire,
  sendZelle,
  addBill,
  createTransfer,
  markAsRead,
  updateSettings,
  
  // State
  loading,
  isInitialized,
  refresh
} = useBanking(userId)
```

## Real-Time Features

### Auto-Refresh Intervals
- **Accounts**: 30 seconds
- **Transactions**: 60 seconds
- **Notifications**: 10 seconds
- **Bills**: 2 minutes
- **Credit Score**: 24 hours
- **Settings**: On-demand

### Event Broadcasting
Banking integration broadcasts custom events for cross-component updates:

```typescript
window.addEventListener('banking-sync', (event) => {
  const { accounts, transactions, notifications } = event.detail
  // Update UI with latest data
})
```

### Secure Operations
- All API endpoints require `x-user-id` header authentication
- Account numbers masked (only last 4 digits stored)
- Passwords hashed with bcrypt
- Session management with auto-logout
- 2FA and biometric authentication supported
- HTTPS only in production

## Database Tables

Required Supabase tables:
- `accounts` - User accounts with balances
- `transactions` - Transaction history
- `transfers` - Transfer records
- `bill_payments` - Bill payment schedule
- `zelle_contacts` - Saved Zelle recipients
- `zelle_transfers` - Zelle transfer history
- `credit_cards` - Credit card information
- `credit_scores` - Credit score history
- `notifications` - User notifications
- `notification_preferences` - Notification settings
- `user_settings` - Display and accessibility settings
- `security_settings` - Security and session settings
- `wire_transfers` - Wire transfer records
- `users` - User accounts and auth

## Usage Examples

### Send Wire Transfer
```typescript
const { sendWire } = useBanking()

await sendWire(
  'account-id-123',
  1500,
  'John Doe',
  'Chase Bank',
  '021000021',
  '1234567890'
)
```

### Send Zelle Transfer
```typescript
const { sendZelle } = useBanking()

await sendZelle(
  'account-id-123',
  500,
  'jane@example.com',
  'Jane Smith'
)
```

### Add Bill
```typescript
const { addBill } = useBanking()

await addBill({
  accountId: 'account-id-123',
  payee: 'Electric Company',
  amount: 150,
  category: 'utility',
  dueDate: '2026-03-15',
  frequency: 'monthly'
})
```

### Get Real-Time Notifications
```typescript
const { notifications, unreadNotifications, markAsRead } = useBanking()

// Mark as read
await markAsRead(notification.id)
```

## Security Features

✓ Password hashing (bcrypt)
✓ Two-factor authentication (TOTP)
✓ Biometric authentication
✓ Session management with auto-logout
✓ Account number masking
✓ User authentication via headers
✓ Notification preferences
✓ Activity logging
✓ Device management
✓ Transaction alerts

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Error message describing what went wrong",
  "status": 400 // HTTP status code
}
```

Common error codes:
- 400: Bad request (validation failed)
- 401: Unauthorized (missing x-user-id)
- 404: Not found (resource doesn't exist)
- 500: Server error

## Production Deployment

### Environment Variables Required
- `DATABASE_URL` - Supabase connection
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase API key
- `NEXT_PUBLIC_SUPABASE_URL` - Public Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public API key

### Performance Optimizations
- SWR caching with 30-60 second intervals
- Lazy loading for heavy components
- Real-time sync every 30 seconds
- Automatic connection pooling
- Database indexing on frequent queries

### Monitoring
- Transaction alerts in real-time
- Failed request logging
- Session timeout tracking
- Security event logging
- Notification delivery status

## Conclusion

The Chase Bank mobile app now features production-ready real-time banking integration with all core operations:
- ✓ Account management with live balances
- ✓ Transactions with spending analysis
- ✓ Wire transfers (domestic & international)
- ✓ Zelle transfers (instant P2P)
- ✓ Bill pay (recurring and one-time)
- ✓ Credit monitoring
- ✓ Real-time notifications
- ✓ Security and accessibility settings
- ✓ Automatic synchronization
- ✓ Secure authentication

All features work seamlessly together with 30-second real-time sync intervals and production-grade error handling.
