# Monday.com Integration - Developer Guide

Quick reference for using the Monday.com integration in your Chase bank app.

## Environment Variables

Add these to your Vercel project under **Settings → Vars**:

```
MONDAY_API_KEY=<your-api-key>
MONDAY_BOARD_ID=<your-board-id>
NEXT_PUBLIC_APP_URL=https://your-domain.com
SUPABASE_WEBHOOK_SECRET=<your-webhook-secret>
```

## Using Monday Service Functions

The `lib/monday-service.ts` file provides utility functions for interacting with Monday:

### Storing User's Monday Item ID

```typescript
import { storeMondayItemId } from '@/lib/monday-service'

// When user signs up, save their Monday board item ID
storeMondayItemId('user123', 'user@example.com', 'item_456789')
```

### Retrieving User's Monday Item ID

```typescript
import { getMondayItemId } from '@/lib/monday-service'

const itemId = getMondayItemId('user123')
// Returns: 'item_456789' or null
```

### Updating User Status

```typescript
import { updateMondayStatus } from '@/lib/monday-service'

// Call this when user completes profile, connects bank, etc.
await updateMondayStatus(itemId, 'Profile Complete')
await updateMondayStatus(itemId, 'Bank Connected')
await updateMondayStatus(itemId, 'First Deposit')
await updateMondayStatus(itemId, 'Active User')
```

### Updating User Balance

```typescript
import { updateMondayBalance } from '@/lib/monday-service'

// Call this when user receives funds or makes transfers
await updateMondayBalance('user123', 5000) // $5000.00
```

### Updating Bank Connection

```typescript
import { updateMondayBank } from '@/lib/monday-service'

// Call this when user links a bank account via Plaid
await updateMondayBank('user123', 'Chase', '1234') // Shows "Chase (****1234)"
```

## API Endpoints

### POST `/api/monday/onboarding`
**Triggers:** When user signs up
**Auto-called:** Yes (during signup flow)

Creates a new item in the Monday onboarding board.

Request:
```json
{
  "userId": "user123",
  "email": "user@example.com",
  "fullName": "John Doe"
}
```

Response:
```json
{
  "success": true,
  "itemId": "123456789",
  "message": "Onboarding item created successfully"
}
```

### POST `/api/monday/update-balance`
**Triggers:** When user balance changes
**Auto-called:** No - you must call this

Updates the balance column and auto-transitions status if balance > 0.

Request:
```json
{
  "userId": "user123",
  "balance": 5000,
  "itemId": "123456789"
}
```

### POST `/api/monday/update-bank`
**Triggers:** When user links a bank account
**Auto-called:** No - you must call this

Updates connected bank info and status.

Request:
```json
{
  "userId": "user123",
  "bankName": "Chase",
  "accountLast4": "1234",
  "itemId": "123456789"
}
```

### POST `/api/monday/update-status`
**Triggers:** When you want to manually update status
**Auto-called:** No - you must call this

Updates the status and onboarding step columns.

Request:
```json
{
  "itemId": "123456789",
  "status": "Profile Complete",
  "statusIndex": 1
}
```

### POST `/api/webhooks/supabase`
**Triggers:** When user signs up (Supabase webhook)
**Auto-called:** Yes (triggered by Supabase)

Validates webhook signature and calls Monday onboarding API.

## Workflow Examples

### Example 1: Handle Signup
```typescript
// Already handled in login-page.tsx
// When user completes signup form:
// 1. User account created in localStorage
// 2. Monday onboarding item created automatically
// 3. itemId stored in localStorage via storeMondayItemId()
```

### Example 2: Update After Profile Completion
```typescript
// In your profile editing component:
import { updateMondayStatus, getMondayItemId } from '@/lib/monday-service'

async function handleProfileSave(userId: string) {
  // Save profile to your database...
  
  const itemId = getMondayItemId(userId)
  if (itemId) {
    await updateMondayStatus(itemId, 'Profile Complete')
  }
}
```

### Example 3: Update After Bank Connection
```typescript
// In your Plaid integration:
import { updateMondayBank, getMondayItemId } from '@/lib/monday-service'

async function handlePlaidSuccess(userId: string, bankName: string, accountId: string) {
  // Save bank connection to your database...
  
  const itemId = getMondayItemId(userId)
  if (itemId) {
    await updateMondayBank(userId, bankName, accountId.slice(-4))
  }
}
```

### Example 4: Update After First Deposit
```typescript
// When processing incoming funds:
import { updateMondayBalance, getMondayItemId } from '@/lib/monday-service'

async function handleDepositReceived(userId: string, amount: number, newBalance: number) {
  // Update balance in your database...
  
  const itemId = getMondayItemId(userId)
  if (itemId) {
    await updateMondayBalance(userId, newBalance)
    // Status automatically changes to "First Deposit" if balance > 0
  }
}
```

## Debugging

### Check Monday Items Stored
```typescript
import { getAllMondayItems } from '@/lib/monday-service'

const items = getAllMondayItems()
console.log('Monday items:', items)
```

### Clear Monday Items (Testing)
```typescript
import { clearMondayItems } from '@/lib/monday-service'

// Clears both in-memory store and localStorage
clearMondayItems()
```

### Monitor API Calls
All API endpoints log to the console with `[v0]` prefix. Check browser console for:
- `[v0] Monday onboarding item created and stored: item_123456`
- `[v0] Failed to create Monday onboarding: ...`
- `[v0] No Monday item ID found for user ...`

### Monday API Errors
If you see errors from Monday API, check:
1. ✅ `MONDAY_API_KEY` is valid and has correct permissions
2. ✅ `MONDAY_BOARD_ID` matches your actual board ID
3. ✅ Column IDs in mutations match your board columns (`user_id`, `email`, `status`, etc.)
4. ✅ Status dropdown index numbers are correct (0=Signed Up, 1=Profile Complete, etc.)

## Best Practices

1. **Always use the utility functions** - Don't call the API endpoints directly from components
2. **Store itemId early** - Call `storeMondayItemId()` when user signs up
3. **Handle failures gracefully** - Monday integration failures shouldn't block app functionality
4. **Use status updates to drive automations** - Monday automations trigger on status changes
5. **Keep column names consistent** - Match the column IDs in `MONDAY_INTEGRATION_SETUP.md`
6. **Test with manual Monday updates** - Update status in Monday to verify automations work

## Troubleshooting Checklist

- [ ] Environment variables set in Vercel
- [ ] Monday API key created and has board permissions
- [ ] Monday board created with correct column types
- [ ] Column IDs in API mutations match your board
- [ ] Status dropdown has required values
- [ ] Browser console shows no `[v0]` errors
- [ ] New user signup creates item in Monday
- [ ] Monday automations are activated

## Next Steps

1. Set up your Monday board using `MONDAY_INTEGRATION_SETUP.md`
2. Add environment variables to Vercel
3. Sign up a test user and verify item appears in Monday
4. Configure Monday automations for each status change
5. Integrate `updateMondayBalance()` and `updateMondayBank()` into relevant parts of your app
6. Test all automations trigger correctly
