import { NextRequest, NextResponse } from 'next/server'
import { createMarketplaceProduct } from '@/lib/stripe-connect-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { connectedAccountId, name, description, priceInCents, currency } = body

    if (!connectedAccountId || !name || !priceInCents) {
      return NextResponse.json(
        { error: 'Missing required fields: connectedAccountId, name, priceInCents' },
        { status: 400 }
      )
    }

    const product = await createMarketplaceProduct(
      connectedAccountId,
      name,
      description || '',
      priceInCents,
      currency || 'usd'
    )

    console.log('[v0] Product created:', product.stripeProductId)

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('[v0] Product creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
