/**
 * Transfers & Payments API
 * Handles wire transfers, Zelle, bill pay, ACH, and internal transfers
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/transfers - Process transfer (wire, Zelle, ACH, internal, bill pay)
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const userId = request.headers.get('x-user-id')
    const {
      action, // 'wire' | 'zelle' | 'ach' | 'internal' | 'bill_pay'
      fromAccountId,
      toAccountId,
      amount,
      description,
      recipientEmail,
      recipientPhone,
      recipientName,
      recipientBank,
      recipientRoutingNumber,
      recipientAccountNumber,
      scheduledDate,
      frequency,
      billPayee,
      billDueDate,
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

    if (action === 'internal') {
      // Internal transfer between own accounts
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

      // Create transactions
      await supabase.from('transactions').insert([
        {
          account_id: fromAccountId,
          user_id: userId,
          description: `Transfer to ${toAccount.name}`,
          amount,
          type: 'debit',
          category: 'transfer',
          status: 'completed',
        },
        {
          account_id: toAccountId,
          user_id: userId,
          description: `Transfer from ${fromAccount.name}`,
          amount,
          type: 'credit',
          category: 'transfer',
          status: 'completed',
        }
      ])

      // Update balances
      await supabase
        .from('accounts')
        .update({ balance: fromAccount.balance - amount })
        .eq('id', fromAccountId)

      await supabase
        .from('accounts')
        .update({ balance: toAccount.balance + amount })
        .eq('id', toAccountId)

      return NextResponse.json({
        message: 'Transfer completed successfully',
        status: 'completed',
        estimatedDelivery: new Date().toISOString()
      })
    }

    if (action === 'wire') {
      // Wire transfer (domestic or international)
      if (!recipientBank || !recipientRoutingNumber) {
        return NextResponse.json(
          { error: 'Recipient bank and routing number required for wire transfer' },
          { status: 400 }
        )
      }

      // Create wire transfer record
      const { data: wireTransfer } = await supabase
        .from('wire_transfers')
        .insert([
          {
            user_id: userId,
            from_account_id: fromAccountId,
            amount,
            recipient_name: recipientName,
            recipient_bank: recipientBank,
            recipient_routing_number: recipientRoutingNumber,
            recipient_account_number: recipientAccountNumber?.slice(-4),
            status: 'processing',
            created_at: new Date().toISOString(),
          }
        ])
        .select()

      // Create transaction
      await supabase.from('transactions').insert([
        {
          account_id: fromAccountId,
          user_id: userId,
          description: `Wire transfer to ${recipientName}`,
          amount,
          type: 'debit',
          category: 'wire_transfer',
          status: 'processing',
        }
      ])

      // Deduct from account
      await supabase
        .from('accounts')
        .update({ balance: fromAccount.balance - amount })
        .eq('id', fromAccountId)

      return NextResponse.json({
        message: 'Wire transfer initiated. Typically arrives within 1-2 business days',
        wireTransferId: wireTransfer?.[0]?.id,
        status: 'processing',
        estimatedDelivery: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        recipient: recipientName
      })
    }

    if (action === 'zelle') {
      // Zelle transfer (email or phone)
      if (!recipientEmail && !recipientPhone) {
        return NextResponse.json(
          { error: 'Recipient email or phone number required for Zelle' },
          { status: 400 }
        )
      }

      // Create Zelle transfer
      const { data: zelleTransfer } = await supabase
        .from('zelle_transfers')
        .insert([
          {
            user_id: userId,
            from_account_id: fromAccountId,
            amount,
            recipient_email: recipientEmail,
            recipient_phone: recipientPhone,
            recipient_name: recipientName,
            status: 'sent',
            created_at: new Date().toISOString(),
          }
        ])
        .select()

      // Create transaction
      await supabase.from('transactions').insert([
        {
          account_id: fromAccountId,
          user_id: userId,
          description: `Zelle to ${recipientName || recipientEmail}`,
          amount,
          type: 'debit',
          category: 'zelle',
          status: 'completed',
        }
      ])

      // Deduct from account
      await supabase
        .from('accounts')
        .update({ balance: fromAccount.balance - amount })
        .eq('id', fromAccountId)

      return NextResponse.json({
        message: 'Zelle transfer sent. Recipient will receive within minutes',
        zelleTransferId: zelleTransfer?.[0]?.id,
        status: 'sent',
        recipient: recipientName || recipientEmail
      })
    }

    if (action === 'bill_pay') {
      // Bill pay
      if (!billPayee || !billDueDate) {
        return NextResponse.json(
          { error: 'Payee and due date required for bill pay' },
          { status: 400 }
        )
      }

      // Create bill payment
      const { data: billPayment } = await supabase
        .from('bill_payments')
        .insert([
          {
            user_id: userId,
            from_account_id: fromAccountId,
            amount,
            payee: billPayee,
            due_date: billDueDate,
            scheduled_date: scheduledDate || billDueDate,
            frequency,
            status: scheduledDate && new Date(scheduledDate) > new Date() ? 'scheduled' : 'processing',
            created_at: new Date().toISOString(),
          }
        ])
        .select()

      // Create transaction
      await supabase.from('transactions').insert([
        {
          account_id: fromAccountId,
          user_id: userId,
          description: `Bill payment to ${billPayee}`,
          amount,
          type: 'debit',
          category: 'bill_payment',
          status: 'processing',
        }
      ])

      // Deduct from account if not scheduled
      if (!scheduledDate || new Date(scheduledDate) <= new Date()) {
        await supabase
          .from('accounts')
          .update({ balance: fromAccount.balance - amount })
          .eq('id', fromAccountId)
      }

      return NextResponse.json({
        message: `Bill payment to ${billPayee} ${scheduledDate ? 'scheduled' : 'initiated'}`,
        billPaymentId: billPayment?.[0]?.id,
        status: billPayment?.[0]?.status,
        dueDate: billDueDate
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
    const supabase = createServiceClient()
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
