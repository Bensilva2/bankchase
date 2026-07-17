import { NextRequest, NextResponse } from 'next/server'
import { initiatePayout } from '@/lib/stripe-connect-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { connectedAccountId, amountInCents, currency } = body

    if (!connectedAccountId || !amountInCents) {
      return NextResponse.json(
        { error: 'Missing required fields: connectedAccountId, amountInCents' },
        { status: 400 }
      )
    }

    const payout = await initiatePayout(
      connectedAccountId,
      amountInCents,
      currency || 'usd'
    )

    console.log('[v0] Payout initiated:', payout.payoutId)

    return NextResponse.json(payout, { status: 201 })
  } catch (error) {
    console.error('[v0] Payout creation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate payout' },
      { status: 500 }
    )
  }
}
