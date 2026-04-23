import { NextRequest, NextResponse } from 'next/server'

interface TransactionQuery {
  accountNumber?: string
  limit?: number
  offset?: number
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const accountNumber = searchParams.get('accountNumber')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get all transactions from storage
    const allTransactions = JSON.parse(
      typeof localStorage !== 'undefined' 
        ? localStorage.getItem('chase_transactions') || '[]'
        : '[]'
    )

    // Filter by account if specified
    let filtered = allTransactions
    if (accountNumber) {
      filtered = allTransactions.filter((txn: any) =>
        txn.fromAccountNumber === accountNumber ||
        txn.toAccountNumber === accountNumber
      )
    }

    // Sort by most recent first
    const sorted = filtered.sort((a: any, b: any) => b.timestamp - a.timestamp)

    // Paginate
    const paginated = sorted.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      transactions: paginated,
      total: sorted.length,
      limit,
      offset,
      hasMore: offset + limit < sorted.length
    })
  } catch (error) {
    console.error('[v0] Transaction list error:', error instanceof Error ? error.message : String(error))

    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accountNumber } = body

    if (!accountNumber) {
      return NextResponse.json(
        { error: 'Account number is required' },
        { status: 400 }
      )
    }

    // Get all transactions
    const allTransactions = JSON.parse(
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('chase_transactions') || '[]'
        : '[]'
    )

    // Filter transactions for this account
    const accountTransactions = allTransactions.filter((txn: any) =>
      txn.fromAccountNumber === accountNumber ||
      txn.toAccountNumber === accountNumber
    )

    // Sort by most recent
    const sorted = accountTransactions.sort((a: any, b: any) => b.timestamp - a.timestamp)

    return NextResponse.json({
      success: true,
      transactions: sorted.slice(0, 50),
      total: sorted.length
    })
  } catch (error) {
    console.error('[v0] Transaction fetch error:', error instanceof Error ? error.message : String(error))

    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
