import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { processTransfer, validateTransfer } from '@/lib/transfer-processor'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/transfers/process
 * 
 * Process a real-time bank transfer with:
 * - ACID transaction guarantees
 * - Idempotency protection
 * - Balance locking
 * - Async SMS notifications
 * - Network provider handoff
 * 
 * Returns 202 Accepted with transaction ID for async processing
 */
export async function POST(request: NextRequest) {
  try {
    // Get authentication from cookies
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      fromAccountId,
      toAccountNumber,
      toBankCode,
      amount,
      currency = 'USD',
      narration
    } = body

    // Validate required fields
    if (!fromAccountId || !toAccountNumber || !toBankCode || !amount) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['fromAccountId', 'toAccountNumber', 'toBankCode', 'amount']
        },
        { status: 400 }
      )
    }

    // Generate idempotency key from request or create new one
    const idempotencyKey = request.headers.get('idempotency-key') || uuidv4()

    // Create transfer request
    const transferRequest = {
      userId: user.id,
      fromAccountId,
      toAccountNumber,
      toBankCode,
      amount: parseFloat(amount.toString()),
      currency,
      idempotencyKey,
      narration
    }

    // Validate transfer before processing
    const validation = await validateTransfer(transferRequest)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Transfer validation failed',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // Process the transfer
    const result = await processTransfer(transferRequest)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Transfer processing failed' },
        { status: 400 }
      )
    }

    // Return 202 Accepted with transaction ID
    // Client polls /api/transfers/status/:transactionId for status updates
    return NextResponse.json(
      {
        status: 'processing',
        transactionId: result.transactionId,
        message: 'Transfer initiated. Processing in background...',
        details: result.details,
        _links: {
          status: `/api/transfers/status/${result.transactionId}`,
          poll_interval_ms: 5000
        }
      },
      { 
        status: 202,
        headers: {
          'Location': `/api/transfers/status/${result.transactionId}`
        }
      }
    )
  } catch (error: any) {
    console.error('[v0] Transfer processing error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS /api/transfers/process
 * CORS preflight and API documentation
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {
      method: 'POST',
      description: 'Process a real-time bank transfer',
      contentType: 'application/json',
      headers: {
        'idempotency-key': 'Optional UUID for idempotency. Prevents duplicate processing of same request.',
        'authorization': 'Bearer token in cookies (automatic via Supabase)'
      },
      requestBody: {
        fromAccountId: 'UUID of sender\'s account',
        toAccountNumber: 'Receiver\'s account number (IBAN or domestic format)',
        toBankCode: 'BIC/SWIFT code or domestic routing code',
        amount: 'Transfer amount (numeric)',
        currency: 'ISO currency code (default: USD)',
        narration: 'Optional transfer description'
      },
      response: {
        status: 202,
        body: {
          status: 'processing',
          transactionId: 'UUID for tracking transfer status',
          message: 'Transfer initiated message',
          _links: {
            status: 'Endpoint to poll for transaction status'
          }
        }
      },
      errorResponses: {
        400: 'Validation failed (insufficient balance, invalid account, missing fields)',
        401: 'Unauthorized (not authenticated)',
        409: 'Conflict (duplicate idempotency key)',
        500: 'Internal server error'
      }
    },
    { status: 200 }
  )
}
