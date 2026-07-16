import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe-client'
import { getProduct, validateProductPrice } from '@/lib/stripe-products'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { productId, mode = 'payment', returnUrl } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      )
    }

    const product = getProduct(productId)
    if (!product) {
      return NextResponse.json(
        { error: `Product "${productId}" not found` },
        { status: 404 }
      )
    }

    // Validate mode
    if (!['payment', 'subscription'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "payment" or "subscription"' },
        { status: 400 }
      )
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      redirect_on_completion: 'never',
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
      ...(returnUrl && {
        success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: returnUrl,
      }),
    })

    if (!session.client_secret) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
      status: session.payment_status,
    })
  } catch (error) {
    console.error('[v0] Checkout API error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create checkout session',
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      )
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    return NextResponse.json({
      sessionId: session.id,
      paymentStatus: session.payment_status,
      customerId: session.customer,
      paymentIntentId: session.payment_intent,
      amountTotal: session.amount_total,
      metadata: session.metadata,
      complete: session.payment_status === 'paid',
    })
  } catch (error) {
    console.error('[v0] Checkout status error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to get session',
      },
      { status: 500 }
    )
  }
}
