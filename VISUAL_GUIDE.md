# 📊 Chase Bank App - Visual Architecture & Flows

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   LOGIN PAGE                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Username: CHUN HUNG                               │ │
│  │  Password: Demo@123                                │ │
│  │  [Sign in Button]                                  │ │
│  └────────────────────────────────────────────────────┘ │
└────────────────┬────────────────────────────────────────┘
                 │
         ┌───────▼────────┐
         │  TRY MAIN AUTH  │ /api/auth
         └───────┬────────┘
                 │
        ┌────────┴────────┐
        │                 │
    ✅ SUCCESS        ❌ FAIL (503)
        │                 │
        │          ┌──────▼──────┐
        │          │ TRY DEMO     │ /api/auth/demo
        │          └──────┬───────┘
        │                 │
        │            ✅ SUCCESS
        │                 │
        └────────┬────────┘
                 │
         ┌───────▼──────────┐
         │  STORE SESSION   │
         │  in localStorage │
         └───────┬──────────┘
                 │
         ┌───────▼──────────┐
         │   DASHBOARD      │
         │  (Show Accounts) │
         └──────────────────┘
```

---

## User Journey

### Step 1: Login
```
User Enters Credentials
         │
         ▼
    Verification
         │
         ├─ Username matches? ✅
         ├─ Email matches? ✅
         ├─ Password correct? ✅
         │
         ▼
   Session Created
         │
    Store in localStorage
         │
         ▼
   Dashboard Loads
```

### Step 2: Dashboard
```
Dashboard Loads
      │
      ├─ Load accounts from localStorage
      ├─ Load transactions
      ├─ Calculate balances
      ├─ Show quick actions
      │
      ▼
Show User Their Information
      │
      ├─ Account list ✅
      ├─ Total balance ✅
      ├─ Recent transactions ✅
      ├─ Quick action menu ✅
      │
      ▼
Ready for Banking
```

### Step 3: Create Account
```
Click "Open New Account"
         │
         ▼
Fill Account Details
    ├─ Account Name
    ├─ Initial Deposit
    │
    ▼
Submit to API
    /api/accounts/create
         │
         ▼
Account Generated
    ├─ Account Number (12 digits) ✅
    ├─ Routing Number: 021000021 ✅
    ├─ Balance Set ✅
    │
    ▼
Stored in localStorage
         │
    ├─ JSON serialized
    ├─ Persisted
    ├─ Available immediately
    │
    ▼
Dashboard Updated
    ├─ New account appears ✅
    ├─ Balance visible ✅
    ├─ Ready to use ✅
```

---

## Data Storage Structure

### Browser LocalStorage

```
localStorage = {
  
  // Login Status
  chase_logged_in: "true",
  chase_is_demo: "false",
  
  // User Information
  chase_user_id: "user-123",
  chase_user_name: "CHUN HUNG",
  chase_user_email: "chunhung@example.com",
  chase_user_role: "user",
  
  // Session
  chase_session: {
    userId: "user-123",
    name: "CHUN HUNG",
    email: "chunhung@example.com",
    role: "user",
    isDemo: false,
    loginTime: "2024-03-01T12:00:00Z"
  },
  
  // User Accounts Array
  chase_user_accounts: [
    {
      accountId: "acct-001",
      accountNumber: "123456789012",
      maskedAccountNumber: "****6789",
      accountType: "checking",
      accountName: "My Checking",
      balance: 5000,
      availableBalance: 5000,
      routingNumber: "021000021",
      status: "active",
      createdAt: "2024-03-01T10:00:00Z"
    },
    {
      accountId: "acct-002",
      accountNumber: "987654321098",
      maskedAccountNumber: "****1098",
      accountType: "savings",
      accountName: "My Savings",
      balance: 1500,
      availableBalance: 1500,
      routingNumber: "021000021",
      status: "active",
      createdAt: "2024-03-01T11:00:00Z"
    }
  ],
  
  // Session Management
  chase_session_token: "session_1709299200",
  chase_last_login: "2024-03-01T12:00:00Z"
}
```

---

## API Endpoints

### Authentication APIs

```
POST /api/auth
├─ Body:
│  ├─ action: "login"
│  ├─ email: "username or email"
│  ├─ password: "password"
│
├─ Response Success:
│  ├─ userId: "user-123"
│  ├─ userName: "CHUN HUNG"
│  ├─ userEmail: "chunhung@example.com"
│  ├─ userRole: "user"
│  ├─ accounts: [...]
│  ├─ sessionToken: "session_xxx"
│
└─ Response Fail:
   ├─ error: "Invalid credentials"
   └─ status: 401

─────────────────────────────────────

POST /api/auth/demo
├─ Body: Same as /api/auth
├─ Response: Same as /api/auth
└─ Note: Demo credentials work here
    ├─ CHUN HUNG / Demo@123 ✅
    ├─ john@example.com / Demo@123 ✅
```

### Account APIs

```
POST /api/accounts/create
├─ Body:
│  ├─ userId: "user-123"
│  ├─ accountType: "checking"
│  ├─ accountName: "My Account"
│  ├─ initialDeposit: 1000
│
├─ Response:
│  ├─ success: true
│  ├─ account:
│  │  ├─ accountId: "acct-xxx"
│  │  ├─ accountNumber: "123456789012"
│  │  ├─ maskedAccountNumber: "****6789"
│  │  ├─ balance: 1000
│  │  └─ routingNumber: "021000021"
│  └─ summary: {...}
│
└─ Storage: Saved to localStorage

─────────────────────────────────────

GET /api/dashboard
├─ Headers:
│  └─ x-user-id: "user-123"
│
└─ Response:
   ├─ accounts: {...}
   ├─ transactions: [...]
   ├─ bills: {...}
   ├─ credit: {...}
   └─ spending: {...}
```

---

## Component Hierarchy

```
App (page.tsx)
│
├─ LoginPage
│  ├─ SignIn Form
│  ├─ SignUp Modal
│  ├─ Forgot Password Modal
│  └─ Error Messages
│
└─ Dashboard (when logged in)
   │
   ├─ DashboardHeader
   │  ├─ User Info
   │  └─ Logout Button
   │
   ├─ QuickActions
   │  ├─ Send Money
   │  ├─ Pay Bills
   │  ├─ Deposit Checks
   │  ├─ Transfer
   │  └─ Add Account
   │
   ├─ AccountsSection
   │  ├─ Account List
   │  ├─ Total Balance
   │  └─ Recent Transactions
   │
   ├─ CreditJourneyCard
   │  └─ Credit Score
   │
   ├─ BottomNavigation
   │  ├─ Accounts
   │  ├─ Pay/Transfer
   │  ├─ Plan/Track
   │  ├─ Offers
   │  └─ More
   │
   └─ Modal Drawers
      ├─ SendMoneyDrawer
      ├─ DepositChecksDrawer
      ├─ PayBillsDrawer
      ├─ TransferDrawer
      ├─ WireDrawer
      ├─ AddAccountDrawer
      └─ More...
```

---

## Feature Flow Diagram

### Send Money Flow
```
Click "Send Money"
    │
    ▼
Open SendMoney Drawer
    │
    ├─ Select From Account
    ├─ Enter Amount
    ├─ Enter To Account/External
    ├─ Add Note
    │
    ▼
Review Details
    │
    ├─ Display summary
    ├─ Show fees (if any)
    ├─ Confirm transaction
    │
    ▼
Submit Transaction
    │
    ├─ Update balance (Demo mode)
    ├─ Create transaction record
    ├─ Generate reference number
    ├─ Store in localStorage
    │
    ▼
Show Receipt
    │
    ├─ Transaction confirmed
    ├─ Display receipt
    ├─ Save to history
    │
    ▼
Return to Dashboard
```

### Create Account Flow
```
Click "Add Account" or "Open New Account"
    │
    ▼
Open Account Creation Form
    │
    ├─ Account Name (text input)
    ├─ Account Type (dropdown)
    ├─ Initial Deposit (number input)
    │
    ▼
Validate Inputs
    │
    ├─ Name not empty? ✅
    ├─ Deposit is number? ✅
    ├─ Deposit >= 0? ✅
    │
    ▼
Generate Account
    │
    ├─ Random 12-digit number
    ├─ Chase routing: 021000021
    ├─ Set balance to deposit
    ├─ Current date as created_at
    │
    ▼
Store Account
    │
    ├─ Get existing accounts from localStorage
    ├─ Add new account to array
    ├─ Store back to localStorage
    │
    ▼
Update Dashboard
    │
    ├─ Account appears in list
    ├─ Balance visible
    ├─ Show success toast
    │
    ▼
Account Ready to Use
```

---

## Session Flow

### Login Session
```
┌─────────────────────────────────┐
│  User Logs In                   │
│  CHUN HUNG / Demo@123           │
└────────────┬────────────────────┘
             │
    ┌────────▼────────┐
    │ API Validates   │
    │ Credentials     │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ Create Session  │
    │ Generate Token  │
    └────────┬────────┘
             │
    ┌────────▼────────────────┐
    │ Store in localStorage:  │
    │ - User ID               │
    │ - Name                  │
    │ - Email                 │
    │ - Accounts              │
    │ - Session Token         │
    └────────┬────────────────┘
             │
    ┌────────▼────────┐
    │ User Logged In  │
    │ Dashboard Shows │
    └─────────────────┘
```

### Session Persistence
```
Page Refresh
    │
    ▼
Load page.tsx
    │
    ├─ Check localStorage.chase_logged_in
    │  │
    │  ├─ If "true":
    │  │  ├─ Load user data
    │  │  ├─ Load accounts
    │  │  ├─ Show dashboard
    │  │
    │  └─ If not found:
    │     └─ Show login page
    │
    ▼
User Stays Logged In ✅
(or logs in if needed)
```

### Logout Flow
```
Click Logout
    │
    ▼
Call logout handler
    │
    ├─ Remove chase_logged_in
    ├─ Remove chase_user_id
    ├─ Remove chase_user_name
    ├─ Remove chase_user_email
    ├─ Remove chase_session
    ├─ Remove chase_user_accounts
    ├─ Remove chase_session_token
    ├─ Clear all chase_* keys
    │
    ▼
Redirect to Login
    │
    ├─ Reset form fields
    ├─ Clear any cached data
    ├─ Show login page
    │
    ▼
Session Cleared ✅
```

---

## Error Handling Flow

### Login Error Handling
```
User Attempts Login
    │
    ▼
Try /api/auth (Production)
    │
    ├─ Success? → Go to Dashboard ✅
    │
    └─ Fail? → Check error type
       │
       ├─ 503 (Service Unavailable)?
       │  │
       │  └─ Try /api/auth/demo ✅
       │
       ├─ 401 (Invalid Credentials)?
       │  │
       │  └─ Show "Invalid credentials"
       │
       └─ 500 (Server Error)?
          │
          └─ Show "Try again later"
```

### Network Error Handling
```
API Request Fails
    │
    ├─ Network error detected?
    │  │
    │  ├─ ENOTFOUND (DNS failed)? ✅
    │  ├─ ECONNREFUSED? ✅
    │  ├─ fetch failed? ✅
    │  │
    │  └─ Fallback to Demo
    │
    └─ Other error?
       │
       └─ Show user-friendly message
```

---

## Demo Credentials Structure

```
Demo Credentials:
│
├─ CHUN HUNG
│  ├─ Email: chunhung@example.com
│  ├─ Password: Demo@123
│  ├─ ID: demo-user-001
│  │
│  └─ Accounts:
│     ├─ Checking Account
│     │  ├─ Number: 123456789012
│     │  ├─ Masked: ****6789
│     │  ├─ Balance: $5,000
│     │  └─ Routing: 021000021
│     │
│     └─ (Can create more)
│
└─ john@example.com
   ├─ Email: john@example.com
   ├─ Password: Demo@123
   ├─ ID: demo-user-002
   │
   └─ Accounts:
      ├─ Savings Account
      │  ├─ Number: 987654321098
      │  ├─ Masked: ****1098
      │  ├─ Balance: $10,000
      │  └─ Routing: 021000021
      │
      └─ (Can create more)
```

---

## File Organization

```
app/
├─ page.tsx                    (Main dashboard)
├─ layout.tsx                  (Root layout)
├─ api/
│  ├─ auth/
│  │  ├─ route.ts              (Production auth)
│  │  └─ demo/
│  │     └─ route.ts           (Demo auth fallback)
│  └─ accounts/
│     ├─ open/route.ts         (Open account)
│     └─ create/route.ts       (Create account)
│
components/
├─ login-page.tsx              (Login/signup UI)
├─ dashboard-header.tsx
├─ accounts-section.tsx
├─ quick-actions.tsx
└─ ... (other components)

lib/
├─ session-manager.ts          (Session utilities)
├─ banking-context.tsx         (State management)
├─ auth/
│  ├─ password-utils.ts        (Password hashing)
│  └─ otp-service.ts           (OTP generation)
├─ supabase/
│  ├─ server.ts                (Supabase client)
│  └─ error-handler.ts         (Error utilities)
└─ api-error-handler.ts        (API errors)
```

---

## Success Indicators

### ✅ Login Success
- [ ] Username field accepts input
- [ ] Password field accepts input
- [ ] Sign in button is clickable
- [ ] API responds (main or demo)
- [ ] Session stored in localStorage
- [ ] Dashboard displays with accounts
- [ ] User name shown in greeting

### ✅ Account Creation Success
- [ ] "Open New Account" button visible
- [ ] Modal/drawer opens
- [ ] Can enter account name
- [ ] Can enter deposit amount
- [ ] Submit button works
- [ ] Account appears in list immediately
- [ ] New balance shown
- [ ] Account number generated

### ✅ Dashboard Success
- [ ] All accounts visible
- [ ] Balances displayed correctly
- [ ] Total balance calculated
- [ ] Quick actions menu present
- [ ] Recent transactions shown
- [ ] Navigation works
- [ ] Page refreshes maintain session

---

**This visual guide helps understand the entire flow and architecture!** 🎨

