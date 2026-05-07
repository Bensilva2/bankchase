# Stripe Integration Guide

Complete Stripe payment integration for Chase banking app with checkout, subscriptions, and webhooks.

## Setup Instructions

### 1. Stripe Account Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from https://dashboard.stripe.com/apikeys
3. Copy your keys to environment variables (already set in Vercel):
   - `STRIPE_SECRET_KEY` - Server-side secret key
   - `STRIPE_PUBLISHABLE_KEY` - Client-side public key
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Exposed to client

### 2. Configure Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add an endpoint"
3. Enter endpoint URL: `https://your-domain.com/api/stripe/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 3. Create Products & Prices

Visit https://dashboard.stripe.com/products to create:

**Example: Premium Plan**
- Product Name: "Premium Membership"
- Price: $9.99/month
- Copy Price ID (e.g., `price_1234567890`)

## API Endpoints

### POST /api/stripe/checkout
Create a one-time checkout session.

```typescript
const { sessionId, url } = await fetch('/api/stripe/checkout', {
  method: 'POST',
  body: JSON.stringify({
    items: [
      {
        name: 'Premium Plan',
        description: '1 month of premium features',
        price: 9.99,
        quantity: 1,
      }
    ],
    customerEmail: 'user@example.com',
    successUrl: 'https://your-domain.com/success',
    cancelUrl: 'https://your-domain.com/cancel',
  })
}).then(r => r.json())

// Redirect to checkout
window.location.href = url
```

### POST /api/stripe/subscription
Create a recurring subscription.

```typescript
const subscription = await fetch('/api/stripe/subscription', {
  method: 'POST',
  body: JSON.stringify({
    customerId: 'cus_123456',
    priceId: 'price_1234567890',
    trialDays: 7, // Optional
  })
}).then(r => r.json())
```

### GET /api/stripe/subscription?customerId=cus_123456
Fetch customer subscriptions.

```typescript
const subscriptions = await fetch(
  '/api/stripe/subscription?customerId=cus_123456'
).then(r => r.json())
```

### POST /api/stripe/customer
Create or get a Stripe customer.

```typescript
const customer = await fetch('/api/stripe/customer', {
  method: 'POST',
  body: JSON.stringify({
    email: 'user@example.com',
    name: 'John Doe',
  })
}).then(r => r.json())
```

### GET /api/stripe/customer?id=cus_123456
Get customer by ID or email.

```typescript
// By ID
const customer = await fetch('/api/stripe/customer?id=cus_123456')

// By email
const customer = await fetch('/api/stripe/customer?email=user@example.com')
```

### POST /api/stripe/webhook
Stripe webhook for handling payment events.

Automatically processes:
- Payment succeeded → Creates payment record
- Payment failed → Logs failed attempt
- Subscription created → Records subscription
- Subscription canceled → Marks as canceled

## Using the React Hook

### useStripe()

```typescript
import { useStripe } from '@/hooks/useStripe'
import { useAuth } from '@/lib/auth-context'

export function PaymentComponent() {
  const { startCheckout, loading, error } = useStripe()
  const { user } = useAuth()

  const handlePayment = async () => {
    try {
      await startCheckout([
        {
          name: 'Premium Plan',
          price: 9.99,
          quantity: 1,
        }
      ], {
        customerEmail: user?.email,
        successUrl: '/dashboard/success',
        cancelUrl: '/dashboard',
      })
    } catch (err) {
      console.error('Payment failed:', err)
    }
  }

  return (
    <button onClick={handlePayment} disabled={loading}>
      {loading ? 'Processing...' : 'Buy Premium'}
    </button>
  )
}
```

## Using Payment Components

### PaymentButton

Simple one-time payment button:

```typescript
import { PaymentButton } from '@/components/payment-button'

<PaymentButton
  items={[
    {
      name: 'Premium Plan',
      price: 9.99,
      quantity: 1,
    }
  ]}
  customerEmail="user@example.com"
  onSuccess={() => console.log('Payment successful!')}
  onError={(error) => console.error(error)}
>
  Buy Premium
</PaymentButton>
```

### SubscriptionButton

Subscription management button:

```typescript
import { SubscriptionButton } from '@/components/subscription-button'

<SubscriptionButton
  priceId="price_1234567890"
  planName="Premium"
  price={9.99}
  trialDays={7}
  onSuccess={(subscription) => console.log('Subscribed!', subscription)}
/>
```

## Utility Functions

### createCheckoutSession()
```typescript
import { createCheckoutSession } from '@/lib/stripe-utils'

const { sessionId, url } = await createCheckoutSession([
  { name: 'Product', price: 99.99 }
])
```

### createOrGetCustomer()
```typescript
import { createOrGetCustomer } from '@/lib/stripe-utils'

const customer = await createOrGetCustomer('user@example.com', 'John Doe')
```

### createSubscription()
```typescript
import { createSubscription } from '@/lib/stripe-utils'

const subscription = await createSubscription(
  'cus_123456',
  'price_1234567890',
  7 // trial days
)
```

### getSubscriptions()
```typescript
import { getSubscriptions } from '@/lib/stripe-utils'

const subscriptions = await getSubscriptions('cus_123456')
```

## Database Schema

The webhook automatically creates these tables if they don't exist:

### payments table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stripe_payment_id TEXT UNIQUE,
  amount DECIMAL(10, 2),
  status TEXT, -- succeeded, failed, pending
  error TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
)
```

### subscriptions table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT, -- active, past_due, canceled, unpaid
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  canceled_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
)
```

## Testing with Stripe Test Cards

Use these cards in test mode:

| Card Number | CVC | Date |
|---|---|---|
| 4242 4242 4242 4242 | Any 3 digits | Any future date |
| 5555 5555 5555 4444 | Any 3 digits | Any future date |
| 378282246310005 | Any 4 digits | Any future date |

For failing payments, use: `4000 0000 0000 0002`

## Common Patterns

### One-Time Purchase
```typescript
const items = [{ name: 'Product', price: 29.99 }]
await startCheckout(items, { customerEmail: user.email })
```

### Monthly Subscription
1. Create price in Stripe dashboard (set recurring)
2. Use SubscriptionButton with priceId
3. Customer billed automatically each month

### Trial Subscription
```typescript
const subscription = await startSubscription(
  customerId,
  priceId,
  14 // 14-day free trial
)
```

### Manage Billing Portal
Link customers to their Stripe billing portal:
```typescript
// Go to: https://billing.stripe.com/b/login/aW9jb...
// Customers can update payment methods, view invoices, cancel subscriptions
```

## Troubleshooting

**Webhook not working?**
- Check webhook signing secret is correct
- Verify endpoint URL is accessible
- Check Stripe dashboard for failed deliveries

**Payment button not visible?**
- Ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set
- Check browser console for errors
- Verify Stripe.js is loaded

**Checkout redirects to error page?**
- Check that customer email is valid
- Verify product/price IDs exist in Stripe
- Check console logs for API errors

**Subscription not created?**
- Ensure customer is created first
- Check priceId exists and is active
- Verify customer can be charged

## Support

For Stripe API documentation, visit: https://stripe.com/docs/api
For support, contact Stripe support via your dashboard.
