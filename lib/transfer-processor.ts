import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Lazy-load Supabase client to avoid initialization errors during build
let supabase: ReturnType<typeof createSupabaseClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )
  }
  return supabase;
}

export interface ProcessTransferRequest {
  userId: string
  fromAccountId: string
  toAccountNumber: string
  toBankCode: string
  amount: number
  currency: string
  idempotencyKey: string
  narration?: string
}

export interface TransferResult {
  success: boolean
  transactionId?: string
  status?: string
  error?: string
  details?: Record<string, any>
}

/**
 * Process a transfer with ACID guarantees and idempotency protection
 * Returns 202 Accepted immediately with transaction ID
 */
export async function processTransfer(
  request: ProcessTransferRequest
): Promise<TransferResult> {
  const {
    userId,
    fromAccountId,
    toAccountNumber,
    toBankCode,
    amount,
    currency,
    idempotencyKey,
    narration
  } = request

  try {
    const sb = getSupabaseClient();
    // Start a database transaction with SERIALIZABLE isolation
    const { data, error: txError } = await sb.rpc('process_transfer', {
      p_user_id: userId,
      p_from_account_id: fromAccountId,
      p_to_account_number: toAccountNumber,
      p_to_bank_code: toBankCode,
      p_amount: amount,
      p_currency: currency,
      p_idempotency_key: idempotencyKey,
      p_narration: narration || ''
    })

    if (txError) {
      // Check if idempotency key conflict
      if (txError.message?.includes('duplicate') || txError.message?.includes('idempotency')) {
        console.log('[v0] Idempotent request detected:', idempotencyKey)
        // Fetch existing transaction
        const { data: existing } = await supabase
          .from('transactions')
          .select('id, status')
          .eq('idempotency_key', idempotencyKey)
          .single()

        if (existing) {
          return {
            success: true,
            transactionId: existing.id,
            status: existing.status,
            details: { message: 'Duplicate request - using existing transaction' }
          }
        }
      }

      console.error('[v0] Transfer processing error:', txError)
      return {
        success: false,
        error: txError.message || 'Transfer processing failed'
      }
    }

    // Async notification and network handoff
    if (data) {
      const transactionId = data.transaction_id

      // Fire background jobs
      queueSmsNotification(data.phone_number, amount, currency, 'initiated', transactionId)
      dispatchNetworkTransfer(transactionId, request)

      return {
        success: true,
        transactionId,
        status: 'processing',
        details: {
          message: 'Transfer initiated. International network processing...',
          initiatedAt: new Date().toISOString()
        }
      }
    }

    return {
      success: false,
      error: 'Failed to create transaction record'
    }
  } catch (error: any) {
    console.error('[v0] Transfer processor error:', error)
    return {
      success: false,
      error: error.message || 'Internal server error'
    }
  }
}

/**
 * Queue SMS notification via Redis for async processing
 */
function queueSmsNotification(
  phoneNumber: string,
  amount: number,
  currency: string,
  status: string,
  transactionId: string
) {
  try {
    // In production, push to SQS, RabbitMQ, or Kafka
    const event = {
      type: 'transfer_notification',
      phoneNumber,
      amount,
      currency,
      status,
      transactionId,
      timestamp: new Date().toISOString()
    }

    console.log('[v0] SMS queued:', event)

    // TODO: Implement actual queue with Upstash Redis or similar
    // await redis.lpush('sms_queue', JSON.stringify(event))
  } catch (error) {
    console.error('[v0] Failed to queue SMS notification:', error)
  }
}

/**
 * Dispatch network transfer to payment provider
 */
function dispatchNetworkTransfer(
  transactionId: string,
  request: ProcessTransferRequest
) {
  try {
    console.log('[v0] Dispatching network transfer:', {
      transactionId,
      provider: request.toBankCode,
      amount: request.amount,
      currency: request.currency
    })

    // TODO: Call actual payment provider API
    // - SWIFT network for international transfers
    // - Domestic clearing house for local transfers
  } catch (error) {
    console.error('[v0] Failed to dispatch network transfer:', error)
  }
}

/**
 * Get transfer status
 */
export async function getTransferStatus(transactionId: string) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, status, amount, currency, from_account_id, to_account_number, initiated_at, completed_at, failure_reason')
      .eq('id', transactionId)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      transaction: data
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch transaction status'
    }
  }
}

/**
 * Validate transfer before processing
 */
export async function validateTransfer(request: ProcessTransferRequest) {
  const errors: string[] = []

  // Amount validation
  if (request.amount <= 0) {
    errors.push('Amount must be greater than 0')
  }

  // Account validation
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('id, balance, user_id')
    .eq('id', request.fromAccountId)
    .single()

  if (accountError || !account) {
    errors.push('Source account not found')
  } else if (account.user_id !== request.userId) {
    errors.push('Unauthorized: Account does not belong to user')
  } else if (account.balance < request.amount) {
    errors.push(`Insufficient balance. Available: ${account.balance}, Required: ${request.amount}`)
  }

  // Idempotency key validation
  if (!request.idempotencyKey || request.idempotencyKey.length < 16) {
    errors.push('Invalid idempotency key')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
