import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe-client'
import { createOrder, updateOrderStatus } from '@/lib/order-service'
import { createSubscription, updateSubscriptionStatus } from '@/lib/subscription-service'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response('Missing signature or webhook secret', {
      status: 400,
    })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[v0] Webhook signature verification failed:', message)
    return new Response(`Webhook Error: ${message}`, { status: 400 })
  }

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      console.log('[v0] Checkout session completed:', session.id)

      // Process successful payment
      if (session.payment_status === 'paid') {
        try {
          const { productId, productType } = session.metadata || {}
          const amount = session.amount_total || 0

          if (productType === 'subscription') {
            // Create subscription record
            if (
              session.customer &&
              session.subscription &&
              typeof session.subscription === 'string'
            ) {
              const subscriptionDetails = await stripe.subscriptions.retrieve(
                session.subscription
              )
              const periodStart = new Date(subscriptionDetails.current_period_start * 1000)
              const periodEnd = new Date(subscriptionDetails.current_period_end * 1000)

              await createSubscription(
                session.customer,
                session.subscription,
                productId || 'unknown',
                amount,
                'monthly',
                periodStart,
                periodEnd
              )
            }
          } else {
            // Create order record
            await createOrder(
              session.id,
              session.customer,
              session.payment_intent as string | null,
              productId || 'unknown',
              productType || 'transfer',
              amount
            )
          }

          console.log('[v0] Payment processed successfully:', {
            sessionId: session.id,
            customerId: session.customer,
            type: productType,
            amount,
          })
        } catch (err) {
          console.error('[v0] Error processing payment:', err)
          return new Response('Error processing payment', { status: 500 })
        }
      }
      break
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object
      console.log('[v0] Payment intent succeeded:', paymentIntent.id)
      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object
      console.error('[v0] Payment failed:', paymentIntent.id)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object
      console.log('[v0] Subscription updated:', subscription.id)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      console.log('[v0] Subscription deleted:', subscription.id)
      // TODO: Handle subscription cancellation
      break
    }

    default:
      console.log('[v0] Unhandled webhook event type:', event.type)
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
