import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { priceId, customerId, trialDays = 0, metadata } = body

    if (!priceId || !customerId) {
      return NextResponse.json(
        { error: 'priceId and customerId are required' },
        { status: 400 }
      )
    }

    const subscriptionParams: any = {
      customer: customerId,
      items: [{ price: priceId }],
      metadata: metadata || {},
    }

    // Add trial period if specified
    if (trialDays > 0) {
      subscriptionParams.trial_period_days = trialDays
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams)

    return NextResponse.json(subscription, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Stripe subscription error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      )
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    })

    return NextResponse.json(subscriptions.data, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Stripe subscription list error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}
