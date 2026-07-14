import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/transfers/demo
 * Demo transfer endpoint for testing without auth
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      fromAccountId = 'demo-account-1',
      toAccountNumber = '1234567890',
      toBankCode = 'DEMO',
      amount = 100,
      currency = 'USD',
      narration = 'Demo transfer'
    } = body

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    try {
      const supabase = await createClient()
      const transactionId = uuidv4()

      // Create transaction record
      const { data: transaction, error: insertError } = await supabase
        .from('transactions')
        .insert({
          id: transactionId,
          user_id: 'demo-user',
          from_account_id: fromAccountId,
          to_account_number: toAccountNumber,
          to_bank_code: toBankCode,
          amount,
          currency,
          idempotency_key: uuidv4(),
          narration,
          status: 'completed',
          initiated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          reference_id: `REF-${Date.now()}`
        })
        .select()
        .single()

      if (insertError) {
        console.error('[v0] Transaction insert error:', insertError)
        return NextResponse.json(
          { error: 'Failed to create transaction' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          success: true,
          status: 'completed',
          transaction: {
            id: transactionId,
            status: 'completed',
            amount,
            currency,
            reference: `REF-${Date.now()}`,
            timestamp: new Date().toISOString()
          },
          _links: {
            status: `/api/transfers/status/${transactionId}`
          }
        },
        { status: 201 }
      )
    } catch (dbError: any) {
      console.error('[v0] Database error:', dbError)
      return NextResponse.json(
        { error: 'Database operation failed', details: dbError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[v0] Transfer demo error:', error)
    return NextResponse.json(
      { error: 'Transfer failed', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/transfers/demo/history
 * Fetch demo transfer history
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', 'demo-user')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        count: transactions?.length || 0,
        transactions: transactions || []
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] History fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
