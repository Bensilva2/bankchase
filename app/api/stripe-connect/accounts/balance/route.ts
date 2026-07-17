import { NextRequest, NextResponse } from 'next/server'
import { getAccountBalance } from '@/lib/stripe-connect-service'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const stripeAccountId = searchParams.get('stripeAccountId')

    if (!stripeAccountId) {
      return NextResponse.json(
        { error: 'Missing required parameter: stripeAccountId' },
        { status: 400 }
      )
    }

    const balance = await getAccountBalance(stripeAccountId)

    console.log('[v0] Balance retrieved for account:', stripeAccountId)

    return NextResponse.json(balance, { status: 200 })
  } catch (error) {
    console.error('[v0] Balance retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve account balance' },
      { status: 500 }
    )
  }
}
