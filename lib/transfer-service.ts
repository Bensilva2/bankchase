/**
 * Client-side transfer service
 * Handles all transfer operations with proper error handling
 */

export interface TransferRequest {
  fromAccountId: string
  toAccountNumber: string
  toBankCode: string
  amount: number
  currency?: string
  narration?: string
}

export interface TransferResponse {
  success: boolean
  transactionId?: string
  status?: string
  error?: string
  details?: any
}

export interface TransactionStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  amount: number
  currency: string
  from_account_id: string
  to_account_number: string
  to_bank_code: string
  initiated_at: string
  completed_at?: string
  failure_reason?: string
  reference_id?: string
}

/**
 * Send a transfer request
 */
export async function sendTransfer(request: TransferRequest): Promise<TransferResponse> {
  try {
    console.log('[v0] Sending transfer:', request)

    const response = await fetch('/api/transfers/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'idempotency-key': `${Date.now()}-${Math.random()}`
      },
      body: JSON.stringify({
        fromAccountId: request.fromAccountId,
        toAccountNumber: request.toAccountNumber,
        toBankCode: request.toBankCode,
        amount: request.amount,
        currency: request.currency || 'USD',
        narration: request.narration
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[v0] Transfer error:', data)
      return {
        success: false,
        error: data.error || 'Transfer failed',
        details: data.details
      }
    }

    console.log('[v0] Transfer created:', data)
    return {
      success: true,
      transactionId: data.transactionId,
      status: data.status,
      details: data.details
    }
  } catch (error: any) {
    console.error('[v0] Transfer request error:', error)
    return {
      success: false,
      error: error.message || 'Network error'
    }
  }
}

/**
 * Send a demo transfer (no auth required)
 * Uses mock endpoint for testing without database
 */
export async function sendDemoTransfer(request: Partial<TransferRequest> = {}): Promise<TransferResponse> {
  try {
    const response = await fetch('/api/transfers/mock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fromAccountId: request.fromAccountId || 'demo-account-1',
        toAccountNumber: request.toAccountNumber || '1234567890',
        toBankCode: request.toBankCode || 'MOCK',
        amount: request.amount || 100,
        currency: request.currency || 'USD',
        narration: request.narration || 'Demo transfer'
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[v0] Demo transfer error:', data)
      return {
        success: false,
        error: data.error || 'Transfer failed'
      }
    }

    return {
      success: true,
      transactionId: data.transaction?.id,
      status: data.transaction?.status,
      details: data.transaction
    }
  } catch (error: any) {
    console.error('[v0] Demo transfer error:', error)
    return {
      success: false,
      error: error.message || 'Network error'
    }
  }
}

/**
 * Get transfer status
 */
export async function getTransferStatus(transactionId: string): Promise<{
  success: boolean
  transaction?: TransactionStatus
  progress?: {
    percent: number
    message: string
    stage: string
  }
  error?: string
}> {
  try {
    const response = await fetch(`/api/transfers/status?transactionId=${transactionId}`)

    if (!response.ok) {
      return {
        success: false,
        error: 'Transaction not found'
      }
    }

    const data = await response.json()
    return {
      success: true,
      transaction: data.transaction,
      progress: data.progress
    }
  } catch (error: any) {
    console.error('[v0] Status check error:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch status'
    }
  }
}

/**
 * Poll transfer status until completion or timeout
 */
export async function pollTransferStatus(
  transactionId: string,
  onProgress?: (progress: { percent: number; message: string }) => void,
  maxAttempts: number = 60,
  intervalMs: number = 1000
): Promise<{
  completed: boolean
  status?: string
  attempts: number
}> {
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      const result = await getTransferStatus(transactionId)

      if (result.success && result.progress) {
        onProgress?.(result.progress)

        if (['completed', 'failed'].includes(result.transaction?.status || '')) {
          return {
            completed: true,
            status: result.transaction?.status,
            attempts
          }
        }
      }
    } catch (error) {
      console.error('[v0] Polling error:', error)
    }

    attempts++
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  return {
    completed: false,
    attempts
  }
}

/**
 * Fetch transfer history
 */
export async function getTransferHistory(limit: number = 10): Promise<{
  success: boolean
  transactions?: TransactionStatus[]
  error?: string
}> {
  try {
    const response = await fetch(`/api/transfers/demo/history?limit=${limit}`)

    if (!response.ok) {
      return {
        success: false,
        error: 'Failed to fetch history'
      }
    }

    const data = await response.json()
    return {
      success: true,
      transactions: data.transactions
    }
  } catch (error: any) {
    console.error('[v0] History fetch error:', error)
    return {
      success: false,
      error: error.message || 'Network error'
    }
  }
}

/**
 * Calculate fees for a transfer
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
  const isDomestic = currency === 'USD' && toBankCode.length <= 9

  const baseFee = isDomestic ? 0 : 2.5
  const percentageRate = isDomestic ? 0.001 : 0.005
  const percentageFee = amount * percentageRate
  const totalFee = baseFee + percentageFee

  return {
    baseFee,
    percentageFee: Math.round(percentageFee * 100) / 100,
    totalFee: Math.round(totalFee * 100) / 100,
    total: Math.round((amount + totalFee) * 100) / 100
  }
}
