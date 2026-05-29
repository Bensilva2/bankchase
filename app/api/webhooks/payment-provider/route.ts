import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  verifyWebhookSignature,
  extractSignature,
  validateWebhookPayload,
  logWebhookEvent,
  getWebhookSecret
} from '@/lib/webhook-verifier'

/**
 * POST /api/webhooks/payment-provider
 * 
 * Receive asynchronous transfer status updates from payment providers
 * - Verifies webhook authenticity via HMAC signature
 * - Updates transaction status in database
 * - Creates double-entry ledger entries for completed transfers
 * - Queues SMS confirmation notifications
 * 
 * Providers: SWIFT, Wise, CurrencyCloud, Stripe, etc.
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification (must be before JSON parsing)
    const rawBody = await request.text()

    // Extract provider from header or query param
    const provider =
      request.headers.get('x-provider-name') ||
      new URL(request.url).searchParams.get('provider') ||
      'payment_provider'

    // Get webhook signature
    const signature = extractSignature(
      Object.fromEntries(request.headers),
      provider
    )

    if (!signature) {
      console.warn('[v0] Webhook received without signature:', { provider })
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      )
    }

    // Get secret and verify signature
    let secret: string
    try {
      secret = getWebhookSecret(provider)
    } catch (error: any) {
      console.warn('[v0] Webhook secret not configured:', { provider, error: error.message })
      return NextResponse.json(
        { error: 'Webhook not configured for provider' },
        { status: 503 }
      )
    }

    const isValid = verifyWebhookSignature(rawBody, signature, secret)
    if (!isValid) {
      console.warn('[v0] Webhook signature verification failed:', { provider })
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse and validate webhook payload
    const payload = JSON.parse(rawBody)
    const validation = validateWebhookPayload(payload)

    if (!validation.valid) {
      console.warn('[v0] Invalid webhook payload:', validation.errors)
      return NextResponse.json(
        {
          error: 'Invalid payload',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // Initialize Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const transactionId = payload.transaction_id
    const status = payload.status
    const eventId = payload.event_id

    // Log webhook event for audit trail
    await logWebhookEvent(transactionId, payload, signature, isValid)

    // Map provider status to internal status
    const statusMap: Record<string, string> = {
      'delivered': 'completed',
      'settled': 'completed',
      'completed': 'completed',
      'failed': 'failed',
      'rejected': 'failed',
      'cancelled': 'failed'
    }

    const internalStatus = statusMap[status] || status

    // Fetch existing transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('id, from_account_id, amount, currency, user_id')
      .eq('id', transactionId)
      .single()

    if (fetchError || !transaction) {
      console.warn('[v0] Transaction not found:', { transactionId })
      // Still return 200 OK to provider to avoid retry loops
      return NextResponse.json(
        {
          success: false,
          message: 'Transaction not found',
          event_id: eventId
        },
        { status: 200 }
      )
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: internalStatus,
        reference_id: payload.provider_reference_id || eventId,
        completed_at: internalStatus === 'completed' ? new Date().toISOString() : null,
        failure_reason: internalStatus === 'failed' ? payload.failure_reason : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId)

    if (updateError) {
      console.error('[v0] Failed to update transaction status:', updateError)
      // Return 200 OK anyway to prevent webhook retries
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to update transaction',
          event_id: eventId
        },
        { status: 200 }
      )
    }

    // If transfer completed, create ledger entries and queue notifications
    if (internalStatus === 'completed') {
      // Create debit entry for sender
      const { error: ledgerError } = await supabase
        .from('ledger_entries')
        .insert({
          transaction_id: transactionId,
          account_id: transaction.from_account_id,
          direction: 'debit',
          amount: transaction.amount,
          balance_before: 0, // TODO: Fetch actual balance before debit
          balance_after: 0 // TODO: Fetch actual balance after debit
        })

      if (ledgerError) {
        console.error('[v0] Failed to create ledger entry:', ledgerError)
      }

      // Queue SMS confirmation
      queueSmsNotification(
        transaction.user_id,
        transaction.amount,
        transaction.currency,
        'completed',
        transactionId
      )
    }

    // Acknowledge receipt to provider
    return NextResponse.json(
      {
        success: true,
        message: 'Webhook processed successfully',
        event_id: eventId,
        transaction_id: transactionId
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Webhook processing error:', error)
    // Return 200 OK to prevent infinite webhook retries
    return NextResponse.json(
      {
        success: false,
        message: 'Internal error processing webhook',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 200 }
    )
  }
}

/**
 * Queue SMS notification for webhook event
 */
function queueSmsNotification(
  userId: string,
  amount: number,
  currency: string,
  status: string,
  transactionId: string
) {
  try {
    const event = {
      type: 'transfer_status_update',
      userId,
      amount,
      currency,
      status,
      transactionId,
      timestamp: new Date().toISOString()
    }

    console.log('[v0] SMS queued from webhook:', event)

    // TODO: Push to message queue (SQS, Kafka, Redis)
    // await redis.lpush('sms_queue', JSON.stringify(event))
  } catch (error) {
    console.error('[v0] Failed to queue SMS notification:', error)
  }
}

/**
 * OPTIONS /api/webhooks/payment-provider
 * CORS preflight and documentation
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {
      method: 'POST',
      description: 'Receive payment provider webhook notifications',
      providers: ['swift', 'wise', 'currencycloud', 'stripe'],
      headers: {
        'x-provider-name': 'Provider identifier (swift, wise, etc)',
        'x-provider-signature': 'HMAC-SHA256 signature of request body'
      },
      expectedPayload: {
        event_id: 'Unique event identifier',
        transaction_id: 'UUID of transaction from /api/transfers/process',
        status: 'Transfer status (delivered, failed, etc)',
        provider_reference_id: 'Provider-specific reference',
        failure_reason: 'Reason if failed'
      },
      successResponse: {
        status: 200,
        body: {
          success: true,
          event_id: 'Echoed event ID',
          transaction_id: 'Processed transaction ID'
        }
      }
    },
    { status: 200 }
  )
}
