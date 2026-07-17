# BankChase - Complete Payment Platform Overview

## System Architecture

BankChase is a comprehensive banking and payment platform built with Next.js 16, Stripe Connect, and Supabase. The system integrates payment processing, account management, balance tracking, and multi-vendor marketplace functionality.

---

## Core Components

### 1. Payment Processing
- **Stripe Checkout Integration**: Full embedded checkout with card payments (Link, Apple Pay, Google Pay ready)
- **Payment Methods**: Card-only for safety, extensible for other payment types
- **Checkout API**: `/api/payments/checkout` - Creates and manages checkout sessions
- **Products Catalog**: 4 banking services (Instant Transfer, International Transfer, Premium Banking, Bill Pay)

### 2. Stripe Connect Platform
- **Account Management**:
  - `/api/stripe-connect/accounts/create` - Create connected accounts
  - `/api/stripe-connect/accounts/onboarding` - Generate onboarding links
  - `/api/stripe-connect/accounts/balance` - Retrieve account balances

- **Marketplace**:
  - `/api/stripe-connect/products/create` - Seller product management
  - `/api/stripe-connect/charges/create` - Platform charges with fee splitting

- **Transfers & Payouts**:
  - `/api/stripe-connect/transfers/bank` - Bank transfers
  - `/api/stripe-connect/transfers/between-accounts` - Inter-account transfers
  - `/api/stripe-connect/payouts/create` - Create payouts
  - `/api/stripe-connect/payouts/list` - List payout history
  - `/api/stripe-connect/transfers/list` - View transfer history

### 3. Balance Management System
- **Real-Time Tracking**: Available, pending, reserved, and total balances
- **Transaction Ledger**: Complete audit trail with before/after balances
- **Transfer Integration**: Automatic deduction from source, addition to destination
- **Balance APIs**:
  - `/api/balance/get` - Query account balance
  - `/api/balance/transfer` - Execute inter-account transfers
  - `/api/balance/history` - Transaction history with pagination

### 4. Webhook Processing
- **Stripe Events**: `charge.succeeded`, `charge.failed`, `payout.paid`, `account.updated`
- **Auto-Balance Updates**: All events automatically update account balances
- **Alert System**: Large transfers and failed charges trigger alerts
- **Webhook Endpoint**: `/api/webhooks/stripe-connect`

### 5. Payment Method Domains
- **Domain Registration**: Link, Apple Pay, Google Pay support
- **Setup Endpoint**: `/api/public/setup` - Register domains
- **Domains**: `localhost:3000`, `bankchase.vercel.app`, `bankchase.com`
- **Status**: ✅ Active and verified

---

## Key Features

### Multi-Vendor Marketplace
- Connected sellers can create products and collect payments
- Platform controls commission rates per seller
- Real-time balance tracking for each account
- Automatic payout processing

### Real-Time Balance System
- Available balance: Funds ready to use
- Pending balance: Funds processing
- Reserved balance: Funds held for transfers
- Total balance: Sum of all balances

### Transaction Tracking
- Complete audit trail of all transactions
- Type tracking: charge, transfer, payout, refund
- Status monitoring: pending, completed, failed
- Related ID tracking for correlating events

### Security & Compliance
- Webhook signature verification (Stripe)
- Server-side price validation
- No client-side price manipulation
- Data encryption and PCI compliance via Stripe
- Row-level security with Supabase auth

---

## API Endpoints

### Public Endpoints
```
GET  /api/public/setup                    - Get registered payment domains
POST /api/public/setup                    - Setup payment method domains
```

### Payment Endpoints
```
POST /api/payments/checkout               - Create checkout session
GET  /api/checkout/success                - Checkout success page
GET  /api/checkout/cancel                 - Checkout cancellation page
```

### Balance Endpoints
```
GET  /api/balance/get                     - Get account balance
POST /api/balance/transfer                - Transfer between accounts
GET  /api/balance/history                 - Transaction history
```

### Stripe Connect Endpoints
```
POST /api/stripe-connect/accounts/create                   - Create account
POST /api/stripe-connect/accounts/onboarding              - Onboarding link
GET  /api/stripe-connect/accounts/balance                 - Account balance
POST /api/stripe-connect/products/create                  - Create product
POST /api/stripe-connect/charges/create                   - Charge with fee
POST /api/stripe-connect/transfers/bank                   - Bank transfer
POST /api/stripe-connect/transfers/between-accounts       - Inter-account transfer
POST /api/stripe-connect/payouts/create                   - Create payout
GET  /api/stripe-connect/payouts/list                     - List payouts
GET  /api/stripe-connect/transfers/list                   - List transfers
```

### Webhook Endpoints
```
POST /api/webhooks/stripe                 - Stripe payment webhooks
POST /api/webhooks/stripe-connect         - Stripe Connect webhooks
```

---

## UI Pages

### User Pages
- `/` - Login page (Chase branded)
- `/payments` - Banking services marketplace
- `/checkout` - Embedded Stripe checkout
- `/checkout/success` - Payment success
- `/checkout/cancel` - Payment cancellation
- `/send-money` - Send money interface
- `/pay-transfer` - Transfer management
- `/privacy-security` - Privacy & security settings

### Dashboard Pages
- `/dashboard/stripe-connect` - Platform dashboard
- `/dashboard/balance` - Real-time balance dashboard

### Admin Pages
- `/admin/setup` - Admin setup page

---

## Database Schema

### Connected Accounts
- `id`: Account identifier
- `stripe_account_id`: Stripe Connect ID
- `business_name`: Account business name
- `email`: Account email
- `status`: Account verification status
- `commission_rate`: Platform commission percentage
- `balance_available`: Available balance
- `balance_pending`: Pending balance
- `created_at`: Account creation timestamp

### Transactions
- `id`: Transaction ID
- `account_id`: Related account
- `type`: Transaction type (charge, transfer, payout, refund)
- `amount`: Transaction amount
- `balance_before`: Balance before transaction
- `balance_after`: Balance after transaction
- `status`: Transaction status
- `description`: Transaction description
- `related_id`: Related Stripe ID
- `created_at`: Transaction timestamp

### Products
- `id`: Product ID
- `account_id`: Seller account
- `name`: Product name
- `description`: Product description
- `price_cents`: Price in cents
- `status`: Product status
- `created_at`: Creation timestamp

---

## Environment Variables

```
STRIPE_SECRET_KEY                 - Stripe API secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY - Stripe publishable key
STRIPE_WEBHOOK_SECRET             - Webhook signature secret
SUPABASE_URL                      - Supabase project URL
SUPABASE_KEY                      - Supabase API key
```

---

## Getting Started

### 1. Setup Payment Method Domains
```bash
curl -X POST http://localhost:3000/api/public/setup
```

### 2. Access Payments Page
```
http://localhost:3000/payments
```

### 3. Create Test Payment
- Click "Pay Now" on any service
- Use Stripe test card: 4242 4242 4242 4242
- Expiry: 12/26 (future date)
- CVC: 123

### 4. View Dashboards
- Balance Dashboard: `/dashboard/balance`
- Stripe Connect: `/dashboard/stripe-connect`

---

## Testing

### Test Cards
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Fraud: `4100 0000 0000 0019`

### Test Email
- Any email (e.g., `test@example.com`)

---

## Production Deployment

1. **Replace Test Keys** with live Stripe keys in environment
2. **Update Domains** in payment method setup
3. **Configure Webhooks** in Stripe dashboard
4. **Enable 2FA** for admin accounts
5. **Setup RLS** policies in Supabase
6. **Enable HTTPS** on all domains

---

## Support & Documentation

- Stripe Docs: https://stripe.com/docs
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- API Docs: See individual endpoint documentation

---

**Status**: ✅ All systems operational and fully functional
**Last Updated**: 2026-07-17
