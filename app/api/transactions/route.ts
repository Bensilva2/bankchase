import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Return demo transactions
    const transactions = [
      {
        id: 1,
        account_id: 1,
        type: 'debit',
        amount: 125.50,
        description: 'Coffee Shop',
        to_account: '****7890',
        status: 'completed',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        account_id: 1,
        type: 'credit',
        amount: 2500.00,
        description: 'Salary Deposit',
        to_account: '****2341',
        status: 'completed',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]

    return NextResponse.json({ transactions: transactions.slice(0, limit) }, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Error fetching transactions:', error.message)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
