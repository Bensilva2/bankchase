import { RetryableError, FatalError } from 'workflow'

export async function validateTransfer(
  senderId: string,
  recipientId: string,
  amount: number,
): Promise<{ valid: boolean; reason?: string }> {
  'use step'

  // Validate amount
  if (amount <= 0) {
    throw new FatalError('Transfer amount must be positive')
  }

  if (amount > 1000000) {
    throw new FatalError('Transfer amount exceeds maximum limit')
  }

  // Validate IDs
  if (!senderId || !recipientId) {
    throw new FatalError('Invalid sender or recipient ID')
  }

  if (senderId === recipientId) {
    throw new FatalError('Cannot transfer to same account')
  }

  return { valid: true }
}

export async function checkAccountBalance(
  accountId: string,
): Promise<{ balance: number; available: number }> {
  'use step'

  try {
    // Simulate balance check - in production, query from database
    // This would typically call your payment processor or database
    const balance = 10000 // Mock balance
    const available = 9500 // Mock available (excluding holds)

    if (available < 0) {
      throw new FatalError('Account has negative balance')
    }

    return { balance, available }
  } catch (error) {
    console.error('[Payment Step] Failed to check balance:', error)
    throw new RetryableError('Temporarily unable to check balance', {
      retryAfter: '30s',
    })
  }
}

export async function performFraudDetection(
  senderId: string,
  recipientId: string,
  amount: number,
  timestamp: Date,
): Promise<{ flagged: boolean; riskScore: number }> {
  'use step'

  try {
    // Simulate fraud detection - in production, use ML model or fraud service
    const riskFactors = {
      largeAmount: amount > 5000 ? 1 : 0,
      newRecipient: 1, // Assume new for demo
      oddHour: timestamp.getHours() < 6 || timestamp.getHours() > 22 ? 1 : 0,
    }

    const riskScore = Object.values(riskFactors).reduce((a, b) => a + b, 0) / 3
    const flagged = riskScore > 0.5

    return { flagged, riskScore }
  } catch (error) {
    console.error('[Payment Step] Fraud detection failed:', error)
    throw new RetryableError('Fraud detection service temporarily unavailable', {
      retryAfter: '1m',
    })
  }
}

export async function processTransferPayment(
  senderId: string,
  recipientId: string,
  amount: number,
): Promise<{ transactionId: string; status: string }> {
  'use step'

  try {
    // Simulate payment processing
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // In production, this would call your payment processor
    console.log(
      `[Payment Step] Processing transfer: ${senderId} -> ${recipientId}, $${amount}`,
    )

    // Simulate occasional transient failures
    if (Math.random() < 0.05) {
      throw new RetryableError('Payment gateway temporarily unavailable', {
        retryAfter: '5s',
      })
    }

    return {
      transactionId,
      status: 'completed',
    }
  } catch (error) {
    if (error instanceof RetryableError) {
      throw error
    }
    console.error('[Payment Step] Payment processing failed:', error)
    throw new FatalError('Payment processing failed')
  }
}

export async function settlementProcess(
  transactionId: string,
): Promise<{ settled: boolean; settleTime: string }> {
  'use step'

  try {
    // Simulate settlement (typically T+1 or T+2 in banking)
    const settleTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    console.log(`[Payment Step] Settlement scheduled for transaction ${transactionId}`)

    return {
      settled: true,
      settleTime,
    }
  } catch (error) {
    console.error('[Payment Step] Settlement failed:', error)
    throw new RetryableError('Settlement service temporarily unavailable', {
      retryAfter: '1m',
    })
  }
}

export async function processLoanFunding(
  loanApplicationId: string,
  amount: number,
): Promise<{ fundingId: string; status: string }> {
  'use step'

  try {
    const fundingId = `FUND_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log(`[Payment Step] Processing loan funding: ${loanApplicationId}, $${amount}`)

    // Simulate funding
    return {
      fundingId,
      status: 'funded',
    }
  } catch (error) {
    console.error('[Payment Step] Loan funding failed:', error)
    throw new RetryableError('Loan funding temporarily unavailable', {
      retryAfter: '1m',
    })
  }
}

export async function processBillPayment(
  paymentId: string,
  amount: number,
  payeeId: string,
): Promise<{ confirmationId: string; status: string }> {
  'use step'

  try {
    const confirmationId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log(`[Payment Step] Processing bill payment: ${paymentId}, $${amount}`)

    // Simulate occasional failures for retry testing
    if (Math.random() < 0.1) {
      throw new RetryableError('Payee service temporarily unavailable', {
        retryAfter: '30s',
      })
    }

    return {
      confirmationId,
      status: 'processed',
    }
  } catch (error) {
    if (error instanceof RetryableError) {
      throw error
    }
    console.error('[Payment Step] Bill payment failed:', error)
    throw new FatalError('Bill payment processing failed')
  }
}

export async function refundTransaction(
  originalTransactionId: string,
  amount: number,
  reason: string,
): Promise<{ refundId: string; status: string }> {
  'use step'

  try {
    const refundId = `REF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log(
      `[Payment Step] Processing refund for ${originalTransactionId}: $${amount}`,
    )

    return {
      refundId,
      status: 'processed',
    }
  } catch (error) {
    console.error('[Payment Step] Refund failed:', error)
    throw new RetryableError('Refund service temporarily unavailable', {
      retryAfter: '1m',
    })
  }
}
