import { NextRequest, NextResponse } from 'next/server'
import { getAccountTransfers } from '@/lib/stripe-connect-service'

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

    const transfers = await getAccountTransfers(stripeAccountId, limit)

    console.log('[v0] Transfers retrieved for account:', stripeAccountId)

    return NextResponse.json(transfers, { status: 200 })
  } catch (error) {
    console.error('[v0] Transfers retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve transfers' },
      { status: 500 }
    )
  }
}
