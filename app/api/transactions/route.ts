/**
 * Transactions API Route - Real-time transaction management
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/transactions - Fetch user transactions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = request.headers.get('x-user-id')
    const accountId = request.nextUrl.searchParams.get('accountId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)

    if (accountId) {
      query = query.eq('account_id', accountId)
    }

    const { data: transactions, error } = await query
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('[v0] Transactions fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

// POST /api/transactions - Create new transaction
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = request.headers.get('x-user-id')
    const {
      accountId,
      description,
      amount,
      type,
      category,
      recipientId,
      recipientBank,
      recipientAccount,
      recipientName,
    } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify account belongs to user
    const { data: account } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', userId)
      .single()

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Create transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert([
        {
          account_id: accountId,
          user_id: userId,
          description,
          amount,
          type,
          category,
          status: 'completed',
          recipient_id: recipientId,
          recipient_bank: recipientBank,
          recipient_account: recipientAccount,
          recipient_name: recipientName,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Update account balance
    const newBalance =
      type === 'credit'
        ? account.balance + amount
        : account.balance - amount

    await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', accountId)

    return NextResponse.json({
      message: 'Transaction created successfully',
      transaction: transaction[0],
    })
  } catch (error) {
    console.error('[v0] Transaction creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
