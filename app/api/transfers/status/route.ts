import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/transfers/status?transactionId=UUID
 * 
 * Poll transaction status for real-time updates
 * Used by frontend to track transfer progress
 * 
 * Returns:
 * - 200 with transaction data when found
 * - 404 when transaction not found
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transactionId = request.nextUrl.searchParams.get('transactionId')

    if (!transactionId) {
      return NextResponse.json(
        {
          error: 'Missing transactionId query parameter',
          example: '/api/transfers/status?transactionId=550e8400-e29b-41d4-a716-446655440000'
        },
        { status: 400 }
      )
    }

    // Get transaction with full details
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select(`
        id,
        status,
        amount,
        currency,
        from_account_id,
        to_account_number,
        to_bank_code,
        initiated_at,
        processing_at,
        completed_at,
        failure_reason,
        reference_id,
        created_at,
        updated_at
      `)
      .eq('id', transactionId)
      .eq('user_id', user.id)
      .single()

    if (error || !transaction) {
      return NextResponse.json(
        { error: 'Transaction not found', transactionId },
        { status: 404 }
      )
    }

    // Calculate elapsed time
    const initiatedAt = new Date(transaction.initiated_at).getTime()
    const now = Date.now()
    const elapsedMs = now - initiatedAt

    // Determine progress based on status
    let progress = 0
    let message = ''

    switch (transaction.status) {
      case 'pending':
        progress = 10
        message = 'Validating transfer...'
        break
      case 'processing':
        progress = 50
        message = 'Processing through payment network...'
        break
      case 'completed':
        progress = 100
        message = 'Transfer completed successfully'
        break
      case 'failed':
        progress = 0
        message = `Transfer failed: ${transaction.failure_reason || 'Unknown reason'}`
        break
      default:
        progress = 25
        message = 'Transfer in progress...'
    }

    return NextResponse.json(
      {
        transaction: {
          id: transaction.id,
          status: transaction.status,
          amount: transaction.amount,
          currency: transaction.currency,
          receiver: {
            accountNumber: transaction.to_account_number,
            bankCode: transaction.to_bank_code
          },
          timestamps: {
            initiated: transaction.initiated_at,
            processing: transaction.processing_at,
            completed: transaction.completed_at
          },
          referenceId: transaction.reference_id,
          failureReason: transaction.failure_reason,
          elapsedSeconds: Math.floor(elapsedMs / 1000)
        },
        progress: {
          percent: progress,
          message,
          stage: transaction.status
        },
        _meta: {
          timestamp: new Date().toISOString(),
          pollIntervalMs: 5000
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Transfer status error:', error.message)
    return NextResponse.json(
      { error: 'Failed to fetch transfer status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/transfers/status (batch)
 * 
 * Fetch multiple transaction statuses in a single request
 * Reduces client-side polling overhead
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { transactionIds } = body

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { error: 'transactionIds array required and must not be empty' },
        { status: 400 }
      )
    }

    if (transactionIds.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 transaction IDs allowed per request' },
        { status: 400 }
      )
    }

    // Fetch all transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('id, status, amount, currency, to_account_number, updated_at')
      .in('id', transactionIds)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json(
      {
        total: transactionIds.length,
        found: transactions?.length || 0,
        notFound: transactionIds.length - (transactions?.length || 0),
        transactions: transactions?.map((t) => ({
          id: t.id,
          status: t.status,
          amount: t.amount,
          currency: t.currency,
          receiverAccount: t.to_account_number,
          updatedAt: t.updated_at
        })) || []
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Batch status error:', error.message)
    return NextResponse.json(
      { error: 'Failed to fetch transaction statuses' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/transfers/status?transactionId=UUID
 * 
 * Cancel a pending transfer
 * Only works if transfer hasn't been submitted to provider yet
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transactionId = request.nextUrl.searchParams.get('transactionId')

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Missing transactionId query parameter' },
        { status: 400 }
      )
    }

    // Get transaction
    const { data: transaction } = await supabase
      .from('transactions')
      .select('id, status, user_id')
      .eq('id', transactionId)
      .eq('user_id', user.id)
      .single()

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Only allow cancellation of pending transfers
    if (transaction.status !== 'pending') {
      return NextResponse.json(
        {
          error: `Cannot cancel ${transaction.status} transfer`,
          message: 'Only pending transfers can be cancelled'
        },
        { status: 400 }
      )
    }

    // Update transaction status to failed
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'failed',
        failure_reason: 'Cancelled by user',
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Transfer cancelled successfully',
        transaction: {
          id: transactionId,
          status: 'failed'
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Transfer cancellation error:', error.message)
    return NextResponse.json(
      { error: 'Failed to cancel transfer' },
      { status: 500 }
    )
  }
}
