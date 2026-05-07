import { loadStripe } from '@stripe/js'

let stripePromise: ReturnType<typeof loadStripe>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')
  }
  return stripePromise
}

export interface CheckoutItem {
  name: string
  description?: string
  price: number
  quantity?: number
  image?: string
}

export const createCheckoutSession = async (
  items: CheckoutItem[],
  options?: {
    customerEmail?: string
    metadata?: Record<string, string>
    successUrl?: string
    cancelUrl?: string
  }
) => {
  const response = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items,
      customerEmail: options?.customerEmail,
      metadata: options?.metadata,
      successUrl: options?.successUrl,
      cancelUrl: options?.cancelUrl,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create checkout session')
  }

  const { sessionId, url } = await response.json()
  return { sessionId, url }
}

export const createOrGetCustomer = async (email: string, name?: string) => {
  const response = await fetch('/api/stripe/customer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create/get customer')
  }

  return await response.json()
}

export const getCustomer = async (idOrEmail: string) => {
  const isEmail = idOrEmail.includes('@')
  const response = await fetch(
    `/api/stripe/customer?${isEmail ? 'email' : 'id'}=${encodeURIComponent(idOrEmail)}`
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch customer')
  }

  return await response.json()
}

export const createSubscription = async (
  customerId: string,
  priceId: string,
  trialDays?: number
) => {
  const response = await fetch('/api/stripe/subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId, priceId, trialDays }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create subscription')
  }

  return await response.json()
}

export const getSubscriptions = async (customerId: string) => {
  const response = await fetch(`/api/stripe/subscription?customerId=${customerId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch subscriptions')
  }

  return await response.json()
}

export const redirectToCheckout = async (sessionId: string) => {
  const stripe = await getStripe()
  if (!stripe) throw new Error('Stripe not initialized')

  const { error } = await stripe.redirectToCheckout({ sessionId })
  if (error) throw error
}
