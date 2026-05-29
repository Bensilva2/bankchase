import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { processTransfer, validateTransfer } from '@/lib/transfer-processor'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/transfers/send
 * 
 * Legacy endpoint that delegates to /api/transfers/process
 * Kept for backward compatibility with existing clients
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fromAccountId, toAccountNumber, toBankCode, amount, narration } = body

    // Validate required fields
    if (!fromAccountId || !toAccountNumber || !toBankCode || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
    }

    // Generate idempotency key
    const idempotencyKey = request.headers.get('idempotency-key') || uuidv4()

    // Create transfer request
    const transferRequest = {
      userId: user.id,
      fromAccountId,
      toAccountNumber,
      toBankCode,
      amount: parseFloat(amount.toString()),
      currency: 'USD',
      idempotencyKey,
      narration
    }

    // Validate transfer
    const validation = await validateTransfer(transferRequest)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors[0] },
        { status: 400 }
      )
    }

    // Process the transfer (async)
    const result = await processTransfer(transferRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Transfer processing failed' },
        { status: 400 }
      )
    }

    // Return 202 Accepted for async processing
    return NextResponse.json(
      {
        success: true,
        status: 'processing',
        transaction: {
          id: result.transactionId,
          status: result.status,
          createdAt: new Date().toISOString()
        },
        _links: {
          status: `/api/transfers/status/${result.transactionId}`
        }
      },
      { status: 202 }
    )
  } catch (error: any) {
    console.error('[v0] Transfer send error:', error.message)
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 })
  }
}
