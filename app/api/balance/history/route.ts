import { NextRequest, NextResponse } from 'next/server'
import { getTransactionHistory } from '@/lib/balance-service'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get('accountId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId query parameter is required' },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    const transactions = await getTransactionHistory(accountId, limit, offset)

    return NextResponse.json(
      {
        accountId,
        count: transactions.length,
        limit,
        offset,
        transactions,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Transaction history error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve transaction history' },
      { status: 500 }
    )
  }
}
