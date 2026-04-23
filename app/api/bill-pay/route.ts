/**
 * Bill Pay API - Utilities, credit cards, loans, subscriptions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/bill-pay - Get all bills and payees
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: bills, error } = await supabase
      .from('bill_payments')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate total due this month
    const today = new Date()
    const thisMonth = bills?.filter(b => {
      const dueDate = new Date(b.due_date)
      return dueDate.getMonth() === today.getMonth() && dueDate.getFullYear() === today.getFullYear()
    }) || []

    const totalDue = thisMonth.reduce((sum, b) => sum + b.amount, 0)

    return NextResponse.json({
      bills: bills || [],
      count: bills?.length || 0,
      thisMonth: thisMonth.length,
      totalDueThisMonth: totalDue,
      lastSync: new Date().toISOString()
    })
  } catch (error) {
    console.error('[v0] Bill pay fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bills' },
      { status: 500 }
    )
  }
}

// POST /api/bill-pay - Create or update bill
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const userId = request.headers.get('x-user-id')
    const {
      accountId,
      payee,
      amount,
      category, // 'utility' | 'credit_card' | 'loan' | 'subscription' | 'insurance' | 'other'
      dueDate,
      frequency, // 'once' | 'monthly' | 'quarterly' | 'yearly'
      accountNumber,
    } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!payee || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'Payee, amount, and due date are required' },
        { status: 400 }
      )
    }

    const numAmount = parseFloat(amount)
    if (numAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Create bill
    const { data: bill, error } = await supabase
      .from('bill_payments')
      .insert([
        {
          user_id: userId,
          from_account_id: accountId,
          payee,
          amount: numAmount,
          category: category || 'other',
          due_date: dueDate,
          frequency: frequency || 'once',
          payee_account_number: accountNumber ? accountNumber.slice(-4) : null,
          status: 'active',
          created_at: new Date().toISOString(),
        }
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      message: 'Bill added successfully',
      bill: bill[0],
      setup: frequency !== 'once' ? 'recurring' : 'one_time'
    })
  } catch (error) {
    console.error('[v0] Create bill error:', error)
    return NextResponse.json(
      { error: 'Failed to create bill' },
      { status: 500 }
    )
  }
}

// DELETE /api/bill-pay - Remove bill
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const userId = request.headers.get('x-user-id')
    const { searchParams } = new URL(request.url)
    const billId = searchParams.get('billId')

    if (!userId || !billId) {
      return NextResponse.json({ error: 'Unauthorized or missing billId' }, { status: 401 })
    }

    // Verify bill belongs to user
    const { data: bill } = await supabase
      .from('bill_payments')
      .select('id')
      .eq('id', billId)
      .eq('user_id', userId)
      .single()

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    // Delete bill
    const { error } = await supabase
      .from('bill_payments')
      .delete()
      .eq('id', billId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      message: 'Bill removed successfully'
    })
  } catch (error) {
    console.error('[v0] Delete bill error:', error)
    return NextResponse.json(
      { error: 'Failed to delete bill' },
      { status: 500 }
    )
  }
}
