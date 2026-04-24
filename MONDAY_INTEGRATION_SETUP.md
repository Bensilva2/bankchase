# Monday.com Integration Setup Guide

This guide walks you through setting up the Monday.com integration for your Chase banking application.

## Overview

The integration automatically creates and manages user records in Monday.com when users sign up, link banks, and make transactions. It includes:

- **Onboarding API** (`/api/monday/onboarding`): Creates new user records when they sign up
- **Status Updates** (`/api/monday/update-status`): Tracks user progress through onboarding
- **Balance Updates** (`/api/monday/update-balance`): Records account balance changes
- **Bank Linking** (`/api/monday/update-bank`): Tracks connected bank accounts
- **Supabase Webhook** (`/api/webhooks/supabase`): Automatically triggers onboarding for new Supabase users

## Prerequisites

1. Monday.com account with admin access
2. Monday.com API key
3. Monday.com board ID for user tracking
4. Supabase project (for webhook setup)

## Step 1: Monday.com Board Setup

### Create a New Board

1. Log in to Monday.com
2. Click **"+ Add Board"**
3. Choose **"Start from scratch"** or use a template
4. Name it **"Chase User Onboarding"**

### Add Columns to Your Board

Add the following columns to track user data:

| Column Name | Type | Purpose |
|---|---|---|
| **Email** | Email | User's email address |
| **Full Name** | Text | User's full name |
| **User ID** | Text | Unique user identifier |
| **Status** | Status/Select | Tracks onboarding progress |
| **Balance** | Number | Current account balance |
| **Connected Bank** | Text | Name of connected bank |
| **Onboarding Step** | Status/Select | Current step in onboarding |

### Create Status Options

For the **Status** column, create these status options:
- ✅ Signed Up (default)
- 👤 Profile Complete
- 🏦 Bank Connected
- 💰 First Deposit
- 🎉 Active User

For the **Onboarding Step** column, create:
- Welcome
- Profile Info
- Bank Connection
- Verification
- Complete

### Get Your Board ID

1. Open your board
2. In the URL, find the board ID (e.g., `https://monday.com/boards/123456789`)
3. Save this ID - you'll need it

## Step 2: Generate Monday.com API Key

1. Go to **Settings** → **API** in Monday.com
2. Click **"Create API Token"**
3. Give it a name like **"Chase Banking App"**
4. Select scopes:
   - ✓ items:read
   - ✓ items:write
   - ✓ columns:read
5. Copy your token immediately (you won't see it again)

## Step 3: Configure Environment Variables

Your environment variables are already set in Vercel:
- `MONDAY_API_KEY` ✓
- `MONDAY_BOARD_ID` ✓

No additional configuration needed!

## Step 4: Set Up Supabase Webhook (Optional but Recommended)

The Supabase webhook automatically triggers Monday integration when users sign up.

### Configure in Supabase

1. Go to your Supabase project
2. Navigate to **Database** → **Webhooks**
3. Click **Create a new webhook**
4. Configure:
   - **Name**: "Chase Monday Integration"
   - **Table**: `auth.users`
   - **Events**: Check "Insert" (for new signups)
   - **URL**: `https://your-domain.com/api/webhooks/supabase`
   - **HTTP Method**: POST

5. Generate a webhook secret and add it to environment variables as `SUPABASE_WEBHOOK_SECRET`

## API Endpoints Reference

### 1. Create Onboarding Record

**POST** `/api/monday/onboarding`

Creates a new item in Monday when a user signs up.

```json
{
  "userId": "user_123",
  "email": "user@example.com",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "itemId": 123456,
  "message": "Onboarding item created successfully"
}
```

### 2. Update User Status

**POST** `/api/monday/update-status`

Updates the status in Monday (Signed Up → Profile Complete → Bank Connected, etc.)

```json
{
  "itemId": 123456,
  "status": "Profile Complete",
  "statusIndex": 1
}
```

### 3. Update Account Balance

**POST** `/api/monday/update-balance`

Records balance changes. Automatically updates status to "First Deposit" if balance > 0.

```json
{
  "userId": "user_123",
  "balance": 5000,
  "itemId": 123456
}
```

### 4. Update Bank Connection

**POST** `/api/monday/update-bank`

Records when a user connects a bank account.

```json
{
  "userId": "user_123",
  "bankName": "Chase",
  "accountLast4": "1234",
  "itemId": 123456
}
```

## Integration Flow

### User Sign-Up Flow

```
1. User creates account in Chase app
   ↓
2. Sign-up data saved to localStorage
   ↓
3. /api/monday/onboarding called
   ↓
4. Monday.com item created with "Signed Up" status
   ↓
5. Monday itemId stored in user's session
   ↓
6. Welcome screen displayed
```

### Bank Connection Flow

```
1. User connects bank account
   ↓
2. Bank details validated
   ↓
3. /api/monday/update-bank called
   ↓
4. Monday.com updated with bank info
   ↓
5. Status changed to "Bank Connected"
   ↓
6. User sees confirmation
```

### Transaction/Balance Update Flow

```
1. User makes transaction or receives deposit
   ↓
2. Balance updated in app
   ↓
3. /api/monday/update-balance called
   ↓
4. Monday.com balance updated
   ↓
5. If balance > 0, status changed to "First Deposit"
   ↓
6. Analytics tracked
```

## Monday Integration in Code

### Sign-Up Component

The sign-up form automatically calls the Monday integration:

```typescript
// In components/login-page.tsx
const mondayResponse = await fetch("/api/monday/onboarding", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: newUser.username,
    email: signupData.email,
    fullName: `${signupData.firstName} ${signupData.lastName}`,
  }),
})
```

### Update Monday Balance

Use the helper function from `lib/monday-service.ts`:

```typescript
import { updateMondayBalance } from "@/lib/monday-service"

// When user's balance changes
await updateMondayBalance(userId, newBalance)
```

### Update Monday Bank

Use the helper function:

```typescript
import { updateMondayBank } from "@/lib/monday-service"

// When user links a bank
await updateMondayBank(userId, "Chase", "1234")
```

## Testing the Integration

### Test Sign-Up Flow

1. Open the app in preview
2. Click "Create an account"
3. Complete the 3-step sign-up process
4. Check your Monday board - a new item should appear with:
   - User's email
   - Status: "Signed Up"
   - User ID: their username

### Test Balance Updates

1. After sign-up, make a transaction
2. Call the balance update endpoint:

```bash
curl -X POST http://localhost:3000/api/monday/update-balance \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "testuser",
    "balance": 5000,
    "itemId": 123456
  }'
```

### Test Bank Connection

1. Navigate to account linking
2. Link a bank account
3. Check Monday board - status should change to "Bank Connected"

## Troubleshooting

### "Monday integration not configured" Error

**Solution**: Check that environment variables are set:
- `MONDAY_API_KEY` is valid
- `MONDAY_BOARD_ID` is correct

### Monday API Errors

**Error**: `"Field 'status' does not exist on type 'Item'"`
- **Cause**: Column ID is incorrect
- **Solution**: Use the actual column ID from your board (usually "status" or "status_1")

**Error**: `"Invalid query"`
- **Cause**: Malformed GraphQL or escaping issue
- **Solution**: Check that all string values are properly escaped

### Webhook Not Triggering

**Solution**: 
1. Verify webhook URL is publicly accessible
2. Check that `SUPABASE_WEBHOOK_SECRET` is configured
3. Check Supabase logs for webhook delivery status
4. Ensure webhook is set to "Insert" event

## Production Checklist

- [ ] Monday API key stored in Vercel environment variables
- [ ] Board ID verified and tested
- [ ] Supabase webhook configured (if using)
- [ ] Test sign-up completes successfully
- [ ] Test balance updates sync to Monday
- [ ] Test bank linking updates Monday
- [ ] Monitor Monday board for new user records
- [ ] Set up Monday automations (email notifications, etc.)
- [ ] Document column mappings for your team

## Monday Automations

Once set up, you can create Monday automations:

1. **Email notification on sign-up**: When Status = "Signed Up", send email
2. **Slack notification**: When Status = "Bank Connected", post to Slack
3. **Auto-workflow**: Mark items as "Active User" after 7 days of activity
4. **CRM sync**: Automatically sync to your CRM when Status = "First Deposit"

## Support

For issues with the Monday.com integration:
1. Check the API endpoints in `/app/api/monday/`
2. Review Monday API docs: https://developer.monday.com/
3. Check your Monday board configuration matches the guide above

For app-related issues:
1. Check `/lib/monday-service.ts` for client-side integration
2. Review browser console for errors
3. Check network tab to see API responses
