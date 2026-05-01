import { sleep, FatalError, RetryableError } from 'workflow'
import { validateTransfer, checkAccountBalance, performFraudDetection, processTransferPayment, settlementProcess } from './steps/payment'
import { sendTransferConfirmation } from './steps/email'
import { recordTransferTransaction, logWorkflowEvent } from './steps/database'

export interface TransferInput {
  senderId: string
  senderEmail: string
  senderName: string
  recipientId: string
  recipientName: string
  amount: number
}

export interface TransferOutput {
  success: boolean
  transactionId?: string
  status?: string
  error?: string
}

export async function moneyTransferWorkflow(input: TransferInput): Promise<TransferOutput> {
  'use workflow'

  const { senderId, senderEmail, senderName, recipientId, recipientName, amount } = input
  const workflowRunId = crypto.randomUUID()

  try {
    // Step 1: Validate transfer details
    await logWorkflowEvent(
      'money_transfer',
      workflowRunId,
      'validate_transfer',
      { senderId, recipientId, amount },
      'started',
    )

    await validateTransfer(senderId, recipientId, amount)

    // Step 2: Check account balance
    const balanceInfo = await checkAccountBalance(senderId)

    if (balanceInfo.available < amount) {
      throw new FatalError(
        `Insufficient funds. Available: $${balanceInfo.available.toFixed(2)}, Required: $${amount.toFixed(2)}`,
      )
    }

    // Step 3: Fraud detection
    const fraudCheck = await performFraudDetection(
      senderId,
      recipientId,
      amount,
      new Date(),
    )

    if (fraudCheck.flagged) {
      await logWorkflowEvent(
        'money_transfer',
        workflowRunId,
        'fraud_detected',
        { senderId, riskScore: fraudCheck.riskScore },
        'completed',
      )

      throw new RetryableError('Transfer flagged for manual review', {
        retryAfter: '1h',
      })
    }

    // Step 4: Process the payment
    const payment = await processTransferPayment(senderId, recipientId, amount)

    // Step 5: Settlement
    await settlementProcess(payment.transactionId)

    // Step 6: Record transaction in database
    await recordTransferTransaction(
      senderId,
      recipientId,
      amount,
      'completed',
      {
        transactionId: payment.transactionId,
        timestamp: new Date().toISOString(),
      },
    )

    // Step 7: Wait before sending confirmation (simulating processing time)
    await sleep('2s')

    // Step 8: Send confirmation email
    await sendTransferConfirmation(
      senderEmail,
      recipientName,
      amount,
      new Date().toLocaleDateString(),
    )

    // Step 9: Log success
    await logWorkflowEvent(
      'money_transfer',
      workflowRunId,
      'transfer_completed',
      { transactionId: payment.transactionId, status: payment.status },
      'completed',
    )

    return {
      success: true,
      transactionId: payment.transactionId,
      status: 'completed',
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    await logWorkflowEvent(
      'money_transfer',
      workflowRunId,
      'transfer_failed',
      { error: errorMessage },
      'failed',
    )

    return {
      success: false,
      error: errorMessage,
      status: 'failed',
    }
  }
}
