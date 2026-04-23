/**
 * Transactions API Route - Real-time transaction management
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { TransactionAlertService } from '@/lib/transaction-alert-service'

// GET /api/transactions - Fetch user transactions with real-time sync
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const userId = request.headers.get('x-user-id')
    const accountId = request.nextUrl.searchParams.get('accountId')
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Calculate date range
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', fromDate.toISOString())

    if (accountId) {
      query = query.eq('account_id', accountId)
    }

    const { data: transactions, error } = await query
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Calculate spending by category
    const spendingByCategory: Record<string, number> = {}
    transactions?.forEach(tx => {
      if (tx.type === 'debit' || tx.type === 'withdrawal') {
        const category = tx.category || 'uncategorized'
        spendingByCategory[category] = (spendingByCategory[category] || 0) + tx.amount
      }
    })

    return NextResponse.json({
      transactions: transactions || [],
      count: transactions?.length || 0,
      period: `Last ${days} days`,
      spendingByCategory,
      lastSync: new Date().toISOString()
    })
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
    const supabase = createServiceClient()
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

    // Get user details for alerts
    const { data: user } = await supabase
      .from('users')
      .select('email, phone_number')
      .eq('id', userId)
      .single()

    // Send real-time transaction alerts
    if (transaction && transaction[0]) {
      const alertService = new TransactionAlertService(supabase)
      
      const alertPayload = {
        userId,
        transactionId: transaction[0].id,
        userEmail: user?.email || '',
        userPhone: user?.phone_number,
        description,
        amount,
        type,
        category,
        recipientName,
        timestamp: new Date().toISOString(),
        accountNumber: account.account_number?.slice(-4),
      }

      // Send alerts asynchronously (don't wait for completion)
      alertService.sendAlert(alertPayload).catch((error) => {
        console.error('[v0] Failed to send transaction alerts:', error)
      })
    }

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
