'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { createCheckoutSession } from '@/app/actions/stripe-checkout'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
)

interface CheckoutProps {
  productId: string
  mode?: 'payment' | 'subscription'
  onSuccess?: (sessionId: string) => void
  onError?: (error: string) => void
}

export function StripeCheckout({
  productId,
  mode = 'payment',
  onSuccess,
  onError,
}: CheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const initializeCheckout = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const secret = await createCheckoutSession(productId, mode)
      setClientSecret(secret)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to initialize checkout'
      setError(message)
      onError?.(message)
    } finally {
      setLoading(false)
    }
  }, [productId, mode, onError])

  useEffect(() => {
    initializeCheckout()
  }, [initializeCheckout])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading checkout...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-red-500">Error: {error}</p>
        <button
          onClick={initializeCheckout}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Unable to load checkout</p>
      </div>
    )
  }

  return (
    <div id="checkout" className="w-full">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{
          clientSecret,
        }}
      >
        <EmbeddedCheckout onComplete={onSuccess} />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
