import { processTransfer } from './transfer-processor'
import { queueSmsAlert } from './sms-alert-service'

/**
 * Complete transfer workflow orchestration
 * Coordinates all components: API → Processor → Webhooks → SMS
 */

export interface TransferWorkflowRequest {
  userId: string
  fromAccountId: string
  toAccountNumber: string
  toBankCode: string
  amount: number
  currency: string
  phoneNumber: string
  narration?: string
}

export interface TransferWorkflowResponse {
  success: boolean
  transactionId?: string
  status?: string
  smsQueued?: boolean
  error?: string
  details?: Record<string, any>
}

/**
 * Execute complete transfer workflow
 * 1. Validate transfer
 * 2. Process transfer (ACID)
 * 3. Queue SMS notification
 * 4. Return status
 */
export async function executeTransferWorkflow(
  request: TransferWorkflowRequest
): Promise<TransferWorkflowResponse> {
  const {
    userId,
    fromAccountId,
    toAccountNumber,
    toBankCode,
    amount,
    currency,
    phoneNumber,
    narration
  } = request

  try {
    // Step 1: Process the transfer
    const transferResult = await processTransfer({
      userId,
      fromAccountId,
      toAccountNumber,
      toBankCode,
      amount,
      currency,
      idempotencyKey: `${userId}-${Date.now()}`,
      narration
    })

    if (!transferResult.success) {
      return {
        success: false,
        error: transferResult.error,
        details: transferResult.details
      }
    }

    // Step 2: Queue SMS notification (fire-and-forget)
    const smsQueued = await queueSmsAlert({
      userId,
      phoneNumber,
      message: `BankChase: Transfer of ${currency} ${amount} initiated. Ref: ${transferResult.transactionId}`,
      type: 'transfer_initiated',
      transactionId: transferResult.transactionId!,
      amount,
      currency
    })

    return {
      success: true,
      transactionId: transferResult.transactionId,
      status: transferResult.status || 'pending',
      smsQueued,
      details: {
        message: 'Transfer initiated successfully',
        statusCheckUrl: `/api/transfers/status?transactionId=${transferResult.transactionId}`
      }
    }
  } catch (error) {
    console.error('[v0] Transfer workflow error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transfer workflow failed'
    }
  }
}

/**
 * Poll transfer status until completion or timeout
 */
export async function pollTransferStatus(
  transactionId: string,
  maxAttempts: number = 60, // 5 minutes at 5-second intervals
  intervalMs: number = 5000
): Promise<{
  status: string
  completed: boolean
  attempts: number
}> {
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(
        `/api/transfers/status?transactionId=${transactionId}`
      )

      if (response.ok) {
        const data = await response.json() as any
        const status = data.status || data.transaction?.status

        if (status === 'completed' || status === 'failed' || status === 'rejected') {
          return {
            status,
            completed: true,
            attempts
          }
        }
      }
    } catch (error) {
      console.error('[v0] Status poll error:', error)
    }

    attempts++
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  return {
    status: 'unknown',
    completed: false,
    attempts
  }
}

/**
 * Calculate transfer fees based on amount and destination
 */
export function calculateTransferFees(
  amount: number,
  toBankCode: string,
  currency: string = 'USD'
): {
  baseFee: number
  percentageFee: number
  totalFee: number
  total: number
} {
  // Domestic vs international
  const isDomestic = currency === 'USD' && toBankCode.length <= 9
  
  // Base fees
  const baseFee = isDomestic ? 0 : 2.5
  const percentageRate = isDomestic ? 0.001 : 0.005 // 0.1% domestic, 0.5% international
  const percentageFee = amount * percentageRate

  const totalFee = baseFee + percentageFee
  
  return {
    baseFee,
    percentageFee: Math.round(percentageFee * 100) / 100,
    totalFee: Math.round(totalFee * 100) / 100,
    total: amount + Math.round(totalFee * 100) / 100
  }
}

/**
 * Validate transfer is within limits
 */
export function validateTransferLimits(
  amount: number,
  dailyUsage: number,
  monthlyUsage: number
): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Daily limit: $10,000
  if (dailyUsage + amount > 10000) {
    errors.push('Daily limit of $10,000 exceeded')
  }

  // Monthly limit: $100,000
  if (monthlyUsage + amount > 100000) {
    errors.push('Monthly limit of $100,000 exceeded')
  }

  // Single transfer limit: $50,000
  if (amount > 50000) {
    errors.push('Single transfer limit of $50,000 exceeded')
  }

  // Minimum amount
  if (amount < 0.01) {
    errors.push('Minimum transfer amount is $0.01')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get estimated delivery time based on destination
 */
export function getEstimatedDeliveryTime(
  toBankCode: string,
  currency: string = 'USD'
): {
  minMinutes: number
  maxMinutes: number
  type: string
} {
  const isDomestic = currency === 'USD' && toBankCode.length <= 9

  if (isDomestic) {
    return {
      minMinutes: 1,
      maxMinutes: 30,
      type: 'ACH/Domestic'
    }
  } else {
    return {
      minMinutes: 24 * 60, // 1 day
      maxMinutes: 3 * 24 * 60, // 3 days
      type: 'International Wire'
    }
  }
}
