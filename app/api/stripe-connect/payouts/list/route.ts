import { NextRequest, NextResponse } from 'next/server'
import { getAccountPayouts } from '@/lib/stripe-connect-service'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const stripeAccountId = searchParams.get('stripeAccountId')
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    if (!stripeAccountId) {
      return NextResponse.json(
        { error: 'Missing required parameter: stripeAccountId' },
        { status: 400 }
      )
    }

    const payouts = await getAccountPayouts(stripeAccountId, limit)

    console.log('[v0] Payouts retrieved for account:', stripeAccountId)

    return NextResponse.json(payouts, { status: 200 })
  } catch (error) {
    console.error('[v0] Payouts retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve payouts' },
      { status: 500 }
    )
  }
}
