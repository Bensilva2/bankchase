import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { createTransaction, getAccountById } from '@/lib/supabase-queries'

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { fromAccountId, toAccountNumber, toBankCode, amount, narration } = await request.json()

    // Validate required fields
    if (!fromAccountId || !toAccountNumber || !toBankCode || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
    }

    // Get account to check balance
    const account = await getAccountById(fromAccountId)

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    if (account.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (account.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Create transaction
    const transaction = await createTransaction(
      fromAccountId,
      toAccountNumber,
      toBankCode,
      amount,
      narration
    )

    return NextResponse.json(
      {
        success: true,
        transaction: {
          id: transaction.id,
          fromAccountId: transaction.from_account_id,
          toAccountNumber: transaction.to_account_number,
          amount: transaction.amount,
          status: transaction.status,
          referenceId: transaction.reference_id,
          createdAt: transaction.created_at,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[v0] Error creating transfer:', error.message)
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 })
  }
}
