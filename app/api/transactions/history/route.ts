import { NextRequest, NextResponse } from 'next/server'

// In-memory transaction store
const transactionsStore = new Map<string, any[]>()

// Generate demo transactions
function generateDemoTransactions(userId: string, accountId?: number): any[] {
  if (!transactionsStore.has(userId)) {
    transactionsStore.set(userId, [
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
      {
        id: 3,
        account_id: 2,
        type: 'debit',
        amount: 450.00,
        description: 'Online Shopping',
        to_account: '****5678',
        status: 'completed',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 4,
        account_id: 1,
        type: 'debit',
        amount: 75.25,
        description: 'Gas Station',
        to_account: '****2341',
        status: 'completed',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 5,
        account_id: 2,
        type: 'credit',
        amount: 1200.00,
        description: 'Interest Payment',
        to_account: '****7890',
        status: 'completed',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ])
  }

  const allTransactions = transactionsStore.get(userId) || []
  
  if (accountId) {
    return allTransactions.filter(t => t.account_id === accountId)
  }
  
  return allTransactions
}

export async function GET(request: NextRequest) {
  try {
    const userId = 'demo-user'

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const accountId = searchParams.get('account_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Get transactions for user
    let transactions = generateDemoTransactions(userId, accountId ? parseInt(accountId) : undefined)

    // Apply pagination
    const paginatedTransactions = transactions.slice(offset, offset + limit)

    return NextResponse.json({
      transactions: paginatedTransactions,
      total_count: transactions.length,
      limit,
    })
  } catch (error) {
    console.error('[v0] Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
