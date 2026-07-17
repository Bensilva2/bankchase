import { NextRequest, NextResponse } from 'next/server'
import { createPlatformCharge } from '@/lib/stripe-connect-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { connectedAccountId, amountInCents, platformCommissionPercent, currency, description } =
      body

    if (!connectedAccountId || !amountInCents || platformCommissionPercent === undefined) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: connectedAccountId, amountInCents, platformCommissionPercent',
        },
        { status: 400 }
      )
    }

    const charge = await createPlatformCharge(
      connectedAccountId,
      amountInCents,
      platformCommissionPercent,
      currency || 'usd',
      description || 'Platform charge'
    )

    console.log('[v0] Platform charge created:', charge.chargeId)

    return NextResponse.json(charge, { status: 201 })
  } catch (error) {
    console.error('[v0] Platform charge error:', error)
    return NextResponse.json(
      { error: 'Failed to create platform charge' },
      { status: 500 }
    )
  }
}
