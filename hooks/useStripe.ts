import { useState } from 'react'
import {
  createCheckoutSession,
  createOrGetCustomer,
  getCustomer,
  createSubscription,
  getSubscriptions,
  redirectToCheckout,
  CheckoutItem,
} from '@/lib/stripe-utils'

export function useStripe() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCheckout = async (
    items: CheckoutItem[],
    options?: {
      customerEmail?: string
      metadata?: Record<string, string>
      successUrl?: string
      cancelUrl?: string
    }
  ) => {
    setLoading(true)
    setError(null)

    try {
      const { sessionId } = await createCheckoutSession(items, options)
      await redirectToCheckout(sessionId)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getOrCreateCustomer = async (email: string, name?: string) => {
    setLoading(true)
    setError(null)

    try {
      return await createOrGetCustomer(email, name)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create customer'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomer = async (idOrEmail: string) => {
    setLoading(true)
    setError(null)

    try {
      return await getCustomer(idOrEmail)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch customer'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const startSubscription = async (customerId: string, priceId: string, trialDays?: number) => {
    setLoading(true)
    setError(null)

    try {
      return await createSubscription(customerId, priceId, trialDays)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create subscription'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscriptions = async (customerId: string) => {
    setLoading(true)
    setError(null)

    try {
      return await getSubscriptions(customerId)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch subscriptions'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    startCheckout,
    getOrCreateCustomer,
    fetchCustomer,
    startSubscription,
    fetchSubscriptions,
  }
}
