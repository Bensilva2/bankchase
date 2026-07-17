'use server'

import { stripe } from '@/lib/stripe-client'
import { getProduct } from '@/lib/stripe-products'

export async function createCheckoutSession(
  productId: string,
  mode: 'payment' | 'subscription' = 'payment'
) {
  const product = getProduct(productId)
  if (!product) {
    throw new Error(`Product with id "${productId}" not found`)
  }

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded' as any,
    redirect_on_completion: 'never' as any,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
          ...(mode === 'subscription' && {
            recurring: {
              interval: 'month',
              interval_count: 1,
            },
          }),
        },
        quantity: 1,
      },
    ],
    mode: mode,
    payment_method_types: ['card'],
    metadata: {
      productId: product.id,
      productType: product.type,
    },
  })

  if (!session.client_secret) {
    throw new Error('Failed to create checkout session')
  }

  return session.client_secret
}

export async function getCheckoutSessionStatus(clientSecret: string) {
  // Extract session ID from client secret
  const sessionId = clientSecret.split('_').slice(0, -1).join('_')

  const session = await stripe.checkout.sessions.retrieve(sessionId)

  return {
    status: session.payment_status,
    complete: session.payment_status === 'paid',
    customerId: session.customer,
    paymentIntentId: session.payment_intent,
  }
}
