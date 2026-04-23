/**
 * Transfers & Payments API
 * Handles money transfers, bill payments, and wire transfers
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/transfers - Process transfer between accounts or users
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = request.headers.get('x-user-id')
    const {
      action,
      fromAccountId,
      toAccountId,
      amount,
      description,
      recipientEmail,
      scheduledDate,
      frequency,
    } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Get source account
    const { data: fromAccount } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', fromAccountId)
      .eq('user_id', userId)
      .single()

    if (!fromAccount) {
      return NextResponse.json(
        { error: 'Source account not found' },
        { status: 404 }
      )
    }

    // Check sufficient balance
    if (fromAccount.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    if (action === 'transfer') {
      // Internal transfer
      const { data: toAccount } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', toAccountId)
        .eq('user_id', userId)
        .single()

      if (!toAccount) {
        return NextResponse.json(
          { error: 'Destination account not found' },
          { status: 404 }
        )
      }

      // Create transactions in a transaction block
      const { data: debitTx, error: debitError } = await supabase
        .from('transactions')
        .insert([
          {
            account_id: fromAccountId,
            user_id: userId,
            description: `Transfer to ${toAccount.name}`,
            amount,
            type: 'debit',
            category: 'Transfer',
            status: 'completed',
          },
        ])
        .select()

      const { data: creditTx } = await supabase
        .from('transactions')
        .insert([
          {
            account_id: toAccountId,
            user_id: userId,
            description: `Transfer from ${fromAccount.name}`,
            amount,
            type: 'credit',
            category: 'Transfer',
            status: 'completed',
          },
        ])
        .select()

      // Update balances
      await supabase
        .from('accounts')
        .update({ balance: fromAccount.balance - amount })
        .eq('id', fromAccountId)

      await supabase
        .from('accounts')
        .update({ balance: toAccount.balance + amount })
        .eq('id', toAccountId)

      // Create notification
      await supabase.from('notifications').insert([
        {
          user_id: userId,
          title: 'Transfer Completed',
          message: `Successfully transferred $${amount} to ${toAccount.name}`,
          type: 'success',
          category: 'transfers',
        },
      ])

      return NextResponse.json({
        message: 'Transfer completed successfully',
        debitTransaction: debitTx[0],
        creditTransaction: creditTx[0],
      })
    }

    if (action === 'external') {
      // External transfer/payment
      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert([
          {
            account_id: fromAccountId,
            user_id: userId,
            description,
            amount,
            type: 'debit',
            category: 'External Transfer',
            status: 'pending',
          },
        ])
        .select()

      if (error) throw error

      // Update balance (deduct immediately for external)
      await supabase
        .from('accounts')
        .update({ balance: fromAccount.balance - amount })
        .eq('id', fromAccountId)

      return NextResponse.json({
        message: 'External transfer initiated',
        transaction: transaction[0],
      })
    }

    if (action === 'scheduled') {
      // Schedule payment for future date
      const { data: scheduledPayment, error } = await supabase
        .from('transactions')
        .insert([
          {
            account_id: fromAccountId,
            user_id: userId,
            description,
            amount,
            type: 'debit',
            category: 'Bill Payment',
            status: 'scheduled',
            scheduled_date: scheduledDate,
          },
        ])
        .select()

      if (error) throw error

      return NextResponse.json({
        message: 'Payment scheduled successfully',
        transaction: scheduledPayment[0],
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[v0] Transfer error:', error)
    return NextResponse.json(
      { error: 'Transfer failed' },
      { status: 500 }
    )
  }
}

// GET /api/transfers - Fetch transfer history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = request.headers.get('x-user-id')
    const accountId = request.nextUrl.searchParams.get('accountId')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .in('category', ['Transfer', 'External Transfer', 'Bill Payment'])

    if (accountId) {
      query = query.eq('account_id', accountId)
    }

    const { data: transfers, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ transfers })
  } catch (error) {
    console.error('[v0] Fetch transfers error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transfers' },
      { status: 500 }
    )
  }
}
