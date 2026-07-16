import { stripe } from '@/lib/stripe-client'

export interface Subscription {
  id: string
  customerId: string
  stripeSubscriptionId: string
  productId: string
  status: 'active' | 'paused' | 'canceled' | 'pending'
  amount: number // in cents per billing period
  billingCycle: 'monthly' | 'yearly'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  canceledAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// In-memory storage for demo (replace with database in production)
const subscriptions = new Map<string, Subscription>()

export async function createSubscription(
  customerId: string,
  stripeSubscriptionId: string,
  productId: string,
  amount: number,
  billingCycle: 'monthly' | 'yearly' = 'monthly',
  currentPeriodStart: Date,
  currentPeriodEnd: Date
): Promise<Subscription> {
  const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const subscription: Subscription = {
    id: subscriptionId,
    customerId,
    stripeSubscriptionId,
    productId,
    status: 'active',
    amount,
    billingCycle,
    currentPeriodStart,
    currentPeriodEnd,
    canceledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  subscriptions.set(subscriptionId, subscription)
  console.log('[v0] Subscription created:', subscriptionId)

  return subscription
}

export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: 'active' | 'paused' | 'canceled' | 'pending'
): Promise<Subscription | null> {
  const subscription = subscriptions.get(subscriptionId)
  if (!subscription) return null

  subscription.status = status
  if (status === 'canceled') {
    subscription.canceledAt = new Date()
  }
  subscription.updatedAt = new Date()

  subscriptions.set(subscriptionId, subscription)
  console.log('[v0] Subscription updated:', subscriptionId, 'status:', status)

  return subscription
}

export async function getSubscriptionByStripeId(
  stripeSubscriptionId: string
): Promise<Subscription | null> {
  for (const sub of subscriptions.values()) {
    if (sub.stripeSubscriptionId === stripeSubscriptionId) {
      return sub
    }
  }
  return null
}

export async function getSubscription(
  subscriptionId: string
): Promise<Subscription | null> {
  return subscriptions.get(subscriptionId) || null
}

export async function listSubscriptions(
  customerId: string,
  status?: string
): Promise<Subscription[]> {
  let result = Array.from(subscriptions.values())
    .filter((sub) => sub.customerId === customerId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  if (status) {
    result = result.filter((sub) => sub.status === status)
  }

  return result
}

export async function cancelSubscription(
  subscriptionId: string
): Promise<Subscription | null> {
  const subscription = subscriptions.get(subscriptionId)
  if (!subscription) return null

  // Cancel on Stripe if using real Stripe
  try {
    if (subscription.stripeSubscriptionId.startsWith('sub_')) {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId)
    }
  } catch (err) {
    console.error('[v0] Error canceling Stripe subscription:', err)
  }

  return updateSubscriptionStatus(subscriptionId, 'canceled')
}

export async function pauseSubscription(
  subscriptionId: string
): Promise<Subscription | null> {
  return updateSubscriptionStatus(subscriptionId, 'paused')
}

export async function resumeSubscription(
  subscriptionId: string
): Promise<Subscription | null> {
  return updateSubscriptionStatus(subscriptionId, 'active')
}
