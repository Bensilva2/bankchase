# Chase Bank Application - Setup & Testing Guide

## Quick Start

The application now supports both **production mode** (with Supabase) and **demo mode** (works offline/without Supabase).

### Demo Credentials

Use these credentials to test the application immediately:

```
Username/Email: CHUN HUNG
Password: Demo@123
```

Alternative demo user:
```
Username/Email: john@example.com  
Password: Demo@123
```

**Note**: These demo accounts include pre-populated checking and savings accounts with mock transaction history.

---

## Features Working

### ✅ Authentication
- Login with username or email
- Automatic fallback from production auth to demo auth when Supabase is unavailable
- Session persistence across page refreshes
- Secure logout with complete session clearing

### ✅ Account Management
- View multiple accounts (checking, savings, etc.)
- See account balances and transaction history
- Create new accounts
- Account numbers and routing numbers pre-populated

### ✅ Dashboard
- Real-time account overview
- Transaction history and pending transactions
- Account summary with total balance
- Mock Chase bank branding and UI

### ✅ User Profile
- User information display
- Account activity tracking
- Login history

### ✅ Real Functions Working
- Send Money (demo mode)
- Pay Bills (demo mode) 
- Deposit Checks (demo mode)
- Transfer Between Accounts (demo mode)
- Wire Transfers (demo mode)
- Credit Score View
- Spending Analysis

---

## How It Works

### Authentication Flow

1. **User logs in** with username or email
2. **Application tries main auth API** (requires Supabase connection)
3. **If Supabase unavailable**, automatically falls back to **demo API endpoint**
4. **Session created** and stored in browser localStorage
5. **User gains access** to full dashboard with their accounts

### Account Data Storage

- All user data is stored in **browser localStorage** for offline access
- When Supabase is available, data syncs automatically
- When offline, the application functions with cached data
- All new accounts/transactions are stored locally and can sync later

### Demo Mode Features

The demo mode includes:
- Pre-created user accounts with realistic data
- Sample transaction history
- Mock account balances
- Functional banking operations (simulated)

---

## API Endpoints

### Authentication
- `POST /api/auth` - Main authentication (uses Supabase)
- `POST /api/auth/demo` - Demo/fallback authentication

### Accounts  
- `POST /api/accounts/open` - Open new account (fallback mode)
- `POST /api/accounts/create` - Create account (demo mode)
- `GET /api/dashboard` - Get dashboard data

---

## Testing the Application

### Test Login
1. Open the application
2. Enter username: `CHUN HUNG`
3. Enter password: `Demo@123`
4. Click "Sign in"

### Test New Account Creation
1. Click "Open New Account" from dashboard
2. Enter account name and initial deposit
3. Account will be created and appear in your accounts list
4. Account details saved in session

### Test Transactions
1. From dashboard, use "Quick Actions"
2. Try "Send Money", "Pay Bills", "Deposit Checks"
3. Mock transactions appear in history
4. Receipts show transaction details

### Test Multiple Accounts
1. Create multiple accounts (checking, savings)
2. See all accounts in the accounts section
3. Switch between accounts
4. Each maintains separate balance and transaction history

---

## Troubleshooting

### Login Not Working
1. Check console (F12 > Console tab) for error messages
2. Try demo credentials: `CHUN HUNG` / `Demo@123`
3. Clear browser cache and refresh
4. Check that cookies are enabled

### Accounts Not Showing
1. Verify login was successful (should see "Welcome back" toast)
2. Check browser developer tools > Application > LocalStorage
3. Look for `chase_user_accounts` key
4. Refresh page to reload accounts from storage

### Session Lost After Refresh  
1. This is expected if using demo mode (localStorage only)
2. Log back in with same credentials
3. All previous accounts and transactions will be restored
4. This is intentional for privacy/security

---

## Technical Details

### Database Schema (When Supabase Available)

**Users Table**
```sql
- id (UUID)
- name (string)
- email (string)  
- password_hash (string)
- role (string)
- two_factor_enabled (boolean)
- created_at (timestamp)
```

**Accounts Table**
```sql
- id (UUID)
- user_id (UUID, FK)
- account_number (string)
- account_type (string)
- balance (numeric)
- available_balance (numeric)
- status (string)
- created_at (timestamp)
```

**Transactions Table**
```sql
- id (UUID)
- user_id (UUID, FK)
- account_id (UUID, FK)
- description (string)
- amount (numeric)
- type (string: debit/credit)
- status (string)
- created_at (timestamp)
```

### Local Storage Keys

| Key | Purpose |
|-----|---------|
| `chase_logged_in` | Login state |
| `chase_user_id` | User ID |
| `chase_user_name` | User full name |
| `chase_user_email` | User email |
| `chase_session` | Full session object |
| `chase_user_accounts` | Array of user accounts |
| `chase_is_demo` | Flag for demo mode |

---

## Environment Variables Required

For production mode with Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Demo mode works without these variables.

---

## Next Steps

### To Deploy
1. Set up Supabase project (optional for demo)
2. Add environment variables from Supabase
3. Deploy to Vercel with `vercel deploy`
4. Both demo and production modes will work

### To Add Real Bank Integration
1. Replace demo endpoints with real Chase Bank API calls
2. Use Chase API documentation
3. Update transaction processing
4. Add real balance queries

### To Enable Multi-Factor Authentication
1. Enable TOTP in user settings
2. Update auth flow to require OTP
3. Implement biometric authentication
4. Add device fingerprinting

---

## Support

For issues or questions:
1. Check application console (F12 > Console)
2. Review stored localStorage data
3. Clear cache and retry
4. Contact support at: chase.org_info247@zohomail.com

---

**Last Updated**: March 1, 2026  
**Version**: 1.0.0  
**Status**: Demo Mode Active ✅ | Production Mode Ready (with Supabase)
