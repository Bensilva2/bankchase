# Chase Bank App - Real-Time Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐     ┌──────────────────────┐      │
│  │   Page Component     │     │   Banking Context    │      │
│  │                      │     │                      │      │
│  │ - Dashboard Header   │────→│ - Account State      │      │
│  │ - Accounts Section   │     │ - Transaction State  │      │
│  │ - Navigation         │     │ - Notification State │      │
│  └──────────────────────┘     │ - Settings State     │      │
│           ↓                    └──────────────────────┘      │
│                                        ↓                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           UI Components (Drawers/Views)              │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ • Wire Drawer          → /api/transfers (wire)       │  │
│  │ • Send Money Drawer    → /api/transfers (zelle)      │  │
│  │ • Pay Bills Drawer     → /api/bill-pay               │  │
│  │ • Transfer Drawer      → /api/transfers (internal)   │  │
│  │ • Transactions Drawer  → /api/transactions           │  │
│  │ • Settings Drawer      → /api/settings               │  │
│  └──────────────────────────────────────────────────────┘  │
│           ↓                                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Real-Time Synchronization Layer              │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ • RealTimeSync (30-60 second intervals)              │  │
│  │ • BroadcastChannel (cross-tab sync)                  │  │
│  │ • localStorage fallback                              │  │
│  │ • CustomEvent broadcasting                           │  │
│  └──────────────────────────────────────────────────────┘  │
│           ↓                                                   │
└─────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────┐
│              API LAYER (Next.js Route Handlers)              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  /api/accounts   │  │ /api/transactions│                │
│  │ - GET: Fetch all │  │ - GET: Last 30d  │                │
│  │ - POST: Create   │  │ - Analysis data  │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ /api/transfers   │  │  /api/bill-pay   │                │
│  │ - wire           │  │ - GET: Bills     │                │
│  │ - zelle          │  │ - POST: Schedule │                │
│  │ - internal       │  │ - GET: Due dates │                │
│  │ - bill_pay       │  └──────────────────┘                │
│  └──────────────────┘                                        │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │/api/notifications│  │  /api/settings   │                │
│  │ - GET: All       │  │ - GET: Prefs     │                │
│  │ - POST: Create   │  │ - PUT: Update    │                │
│  │ - PUT: Read      │  └──────────────────┘                │
│  └──────────────────┘                                        │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │   /api/credit    │  │  /api/dashboard  │                │
│  │ - GET: Score     │  │ - GET: Aggregated│                │
│  │ - GET: Cards     │  │       Data       │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
           ↓
           ↓
┌─────────────────────────────────────────────────────────────┐
│         DATABASE LAYER (Supabase PostgreSQL)                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Core Banking Tables                         │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ • accounts (checking, savings, credit cards)         │  │
│  │ • transactions (all movements)                       │  │
│  │ • wire_transfers (wire transfer records)             │  │
│  │ • zelle_transfers (P2P transfers)                    │  │
│  │ • bill_payments (bill payment records)               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Notification & Settings Tables              │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ • notifications (all alerts)                         │  │
│  │ • user_settings (preferences)                        │  │
│  │ • notification_preferences (alert settings)          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Security & Activity Tables                  │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ • activity_log (user actions)                        │  │
│  │ • login_history (access logs)                        │  │
│  │ • linked_devices (device tracking)                   │  │
│  │ • two_factor_auth (2FA records)                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Financial Tables                            │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ • credit_cards (card management)                     │  │
│  │ • credit_scores (credit tracking)                    │  │
│  │ • savings_goals (goals tracking)                     │  │
│  │ • scheduled_payments (recurring payments)            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Wire Transfer Flow
```
User Form Input
      ↓
Validation
(amount, recipient, routing number)
      ↓
API Call: POST /api/transfers
{
  action: 'wire',
  fromAccountId: 'acc_123',
  amount: 5000,
  recipientName: 'John Doe',
  recipientBank: 'ABC Bank',
  recipientRoutingNumber: '123456789',
  recipientAccountNumber: '9876543210'
}
      ↓
Supabase: Create wire_transfers record
      ↓
Supabase: Create transactions record (debit)
      ↓
Update account balance
      ↓
API Response:
{
  message: 'Wire transfer initiated',
  wireTransferId: 'wire_abc123',
  status: 'processing',
  estimatedDelivery: '2025-02-22'
}
      ↓
Frontend: Update UI with confirmation
      ↓
Add notification
      ↓
Log activity
      ↓
Real-time sync broadcasts update
      ↓
All components refresh
      ↓
User sees confirmation with receipt
```

### Zelle Transfer Flow
```
User Selects Recipient
      ↓
Enter Amount
      ↓
Validation (balance, limit, recipient)
      ↓
API Call: POST /api/transfers
{
  action: 'zelle',
  fromAccountId: 'acc_123',
  amount: 500,
  recipientEmail: 'jane@email.com',
  recipientName: 'Jane Smith'
}
      ↓
Supabase: Create zelle_transfers record
      ↓
Supabase: Create transactions record (debit)
      ↓
Update account balance IMMEDIATELY
      ↓
API Response:
{
  message: 'Transfer sent',
  zelleTransferId: 'zelle_xyz',
  status: 'sent'
}
      ↓
Frontend: Show success
      ↓
Real-time sync triggers
      ↓
Dashboard updates instantly
      ↓
User sees new balance
      ↓
Transaction appears in history
```

### Bill Payment Flow
```
User Selects Payee
      ↓
Enter Amount & Date
      ↓
Choose Frequency (once, weekly, monthly)
      ↓
Validation
      ↓
API Call: POST /api/bill-pay
{
  fromAccountId: 'acc_123',
  amount: 150,
  payee: 'Verizon',
  dueDate: '2025-02-28',
  scheduledDate: '2025-02-28',
  frequency: 'monthly'
}
      ↓
Supabase: Create bill_payments record
      ↓
Supabase: Create scheduled_payments record (if recurring)
      ↓
Supabase: Create transactions record (debit)
      ↓
Update account balance (if immediate)
      ↓
API Response:
{
  message: 'Bill payment initiated',
  billPaymentId: 'bill_123',
  status: 'processing'
}
      ↓
Add to scheduled payments list
      ↓
Real-time sync update
      ↓
User sees in bills list
      ↓
Future scheduled payments auto-execute
```

## Real-Time Sync Cycle

```
┌─────────────────────────────────────────┐
│  30 Second Cycle Begins                 │
├─────────────────────────────────────────┤
│                                         │
│  1. RealTimeSync checks timer          │
│     (every 30 seconds)                 │
│           ↓                            │
│  2. Call /api/accounts                 │
│     (fetch current balances)           │
│           ↓                            │
│  3. Call /api/transactions             │
│     (last 30 days)                     │
│           ↓                            │
│  4. Call /api/notifications            │
│     (unread alerts)                    │
│           ↓                            │
│  5. Broadcast CustomEvent              │
│     (banking-sync with new data)       │
│           ↓                            │
│  6. SWR listens & triggers refetch     │
│           ↓                            │
│  7. React components re-render         │
│     with fresh data                    │
│           ↓                            │
│  8. UI updates (balances, trans, etc)  │
│           ↓                            │
│  9. Cycle ends - wait 30 seconds       │
│                                         │
└─────────────────────────────────────────┘
```

## Component Hierarchy

```
Page.tsx
├── DashboardHeader
│   ├── Notifications
│   ├── Messages
│   └── Profile
├── ViewTransition
│   ├── AccountsSection (Accounts View)
│   │   ├── AccountCards
│   │   └── RecentTransactions
│   ├── PayTransferView (Pay & Transfer View)
│   │   ├── WireTransferOptions
│   │   ├── ZelleOptions
│   │   └── BillPayOptions
│   ├── PlanTrackView
│   ├── OffersView
│   ├── SavingsGoalsView
│   ├── SpendingAnalysisView
│   └── MoreView
│       ├── Settings
│       ├── Activity
│       └── Security
├── Drawers (Modal Components)
│   ├── WireDrawer → /api/transfers (wire)
│   ├── SendMoneyDrawer → /api/transfers (zelle)
│   ├── PayBillsDrawer → /api/bill-pay
│   ├── TransferDrawer → /api/transfers (internal)
│   ├── TransactionsDrawer → /api/transactions
│   ├── SettingsDrawer → /api/settings
│   └── NotificationsDrawer → /api/notifications
└── BottomNavigation
    └── View Selection
```

## State Management

```
Banking Context (useBanking hook)
│
├── Accounts State
│   ├── accounts: Account[]
│   ├── totalBalance: number
│   └── accountsCount: number
│
├── Transactions State
│   ├── transactions: Transaction[]
│   ├── spendingByCategory: Record<string, number>
│   └── pendingCount: number
│
├── Notifications State
│   ├── notifications: Notification[]
│   ├── unreadCount: number
│   └── messages: Message[]
│
├── Settings State
│   ├── appSettings: Settings
│   ├── notificationPrefs: NotificationPrefs
│   └── securitySettings: SecuritySettings
│
└── Operations
    ├── transferFunds()
    ├── addTransaction()
    ├── addNotification()
    ├── addActivity()
    └── updateBalance()
```

## API Request/Response Pattern

```
REQUEST EXAMPLE (Wire Transfer):
──────────────────────────────
POST /api/transfers HTTP/1.1
Content-Type: application/json
x-user-id: user_abc123

{
  "action": "wire",
  "fromAccountId": "acc_123",
  "amount": 5000,
  "recipientName": "John Doe",
  "recipientBank": "ABC Bank",
  "recipientRoutingNumber": "123456789",
  "recipientAccountNumber": "9876543210"
}

RESPONSE (200 OK):
──────────────────
{
  "message": "Wire transfer initiated. Typically arrives within 1-2 business days",
  "wireTransferId": "wire_abc123",
  "status": "processing",
  "estimatedDelivery": "2025-02-22T10:30:00Z",
  "recipient": "John Doe"
}

ERROR RESPONSE (400 Bad Request):
──────────────────────────────────
{
  "error": "Recipient routing number invalid",
  "code": "INVALID_ROUTING"
}

ERROR RESPONSE (401 Unauthorized):
──────────────────────────────────
{
  "error": "User not authenticated",
  "code": "UNAUTHORIZED"
}
```

## Performance Metrics

```
Component Load Time
├── Page Initial Load: ~300-500ms
├── Dashboard Header: ~100ms
├── Accounts Section: ~150ms
├── Drawer Open: ~50-100ms
└── Modal Animation: ~300ms (smooth)

API Response Times
├── /api/accounts: ~200-300ms
├── /api/transactions: ~300-500ms
├── /api/transfers: ~400-600ms
├── /api/bill-pay: ~300-400ms
├── /api/notifications: ~100-200ms
└── /api/settings: ~100-200ms

Real-Time Sync
├── Accounts: Every 30 seconds
├── Transactions: Every 60 seconds
├── Notifications: Every 10 seconds
└── Bills: Every 2 minutes

Network Usage
├── Per sync cycle: ~50-100KB
├── Daily (24-hour estimate): ~7-14MB
└── Monthly: ~210-420MB
```

## Security Layers

```
┌──────────────────────────────┐
│  Frontend Validation         │
│  (Form inputs, amounts)      │
└──────────────────────────────┘
           ↓
┌──────────────────────────────┐
│  API Layer Validation        │
│  (User ID, routing numbers)  │
└──────────────────────────────┘
           ↓
┌──────────────────────────────┐
│  Database Row-Level Security │
│  (Supabase RLS policies)     │
└──────────────────────────────┘
           ↓
┌──────────────────────────────┐
│  Data Masking                │
│  (Account #, routing #)      │
└──────────────────────────────┘
           ↓
┌──────────────────────────────┐
│  Activity Logging            │
│  (All operations tracked)    │
└──────────────────────────────┘
```

---

This architecture ensures:
✅ Real-time data synchronization
✅ Proper separation of concerns
✅ Scalable component structure
✅ Efficient API usage
✅ Robust error handling
✅ Security at every layer
