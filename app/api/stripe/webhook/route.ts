import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase env vars not configured')
  }

  return createClient(url, key)
}

async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent
  console.log('[v0] Payment succeeded:', paymentIntent.id)

  try {
    const supabase = getSupabase()

    // Update payment in database
    if (paymentIntent.metadata?.userId) {
      await supabase
        .from('payments')
        .insert({
          user_id: paymentIntent.metadata.userId,
          stripe_payment_id: paymentIntent.id,
          amount: paymentIntent.amount_received / 100,
          status: 'succeeded',
          metadata: paymentIntent.metadata,
        })
    }
  } catch (error) {
    console.error('[v0] Error handling payment success:', error)
  }
}

async function handlePaymentIntentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent
  console.log('[v0] Payment failed:', paymentIntent.id)

  try {
    const supabase = getSupabase()

    // Log failed payment
    if (paymentIntent.metadata?.userId) {
      await supabase
        .from('payments')
        .insert({
          user_id: paymentIntent.metadata.userId,
          stripe_payment_id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          status: 'failed',
          error: paymentIntent.last_payment_error?.message,
          metadata: paymentIntent.metadata,
        })
    }
  } catch (error) {
    console.error('[v0] Error handling payment failure:', error)
  }
}

async function handleCustomerSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  console.log('[v0] Subscription created:', subscription.id)

  try {
    const supabase = getSupabase()

    await supabase
      .from('subscriptions')
      .insert({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        metadata: subscription.metadata,
      })
  } catch (error) {
    console.error('[v0] Error handling subscription creation:', error)
  }
}

async function handleCustomerSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  console.log('[v0] Subscription deleted:', subscription.id)

  try {
    const supabase = getSupabase()

    await supabase
      .from('subscriptions')
      .update({ status: 'canceled', canceled_at: new Date() })
      .eq('stripe_subscription_id', subscription.id)
  } catch (error) {
    console.error('[v0] Error handling subscription deletion:', error)
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature') || ''

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log('[v0] Webhook received:', event.type)

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event)
        break
      case 'customer.subscription.created':
        await handleCustomerSubscriptionCreated(event)
        break
      case 'customer.subscription.deleted':
        await handleCustomerSubscriptionDeleted(event)
        break
      default:
        console.log('[v0] Unhandled webhook type:', event.type)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Webhook error:', error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
