import { sleep, RetryableError, FatalError } from 'workflow'
import { recordBillPayment, updateLoanApplication, logWorkflowEvent } from './steps/database'
import { sendEmail } from './steps/email'
import { notifyFailedPaymentRetry } from './steps/slack'
import { processBillPayment } from './steps/payment'

export interface BillPaymentInput {
  userId: string
  userEmail: string
  payeeId: string
  payeeName: string
  amount: number
  dueDate: string
  frequency: 'one-time' | 'weekly' | 'monthly' | 'quarterly'
}

export interface BillPaymentOutput {
  success: boolean
  paymentId?: string
  status?: string
  error?: string
}

async function validatePayee(payeeId: string): Promise<{
  valid: boolean
  payeeName: string
}> {
  'use step'

  console.log(`[Bill Payment] Validating payee ${payeeId}`)

  // Simulate payee validation
  if (!payeeId || payeeId.length < 3) {
    throw new FatalError('Invalid payee ID')
  }

  return {
    valid: true,
    payeeName: 'Utility Company',
  }
}

async function scheduleNextPayment(
  userId: string,
  payeeId: string,
  frequency: string,
  currentDueDate: string,
): Promise<{ nextDueDate: string; scheduled: boolean }> {
  'use step'

  console.log(
    `[Bill Payment] Scheduling next payment for user ${userId}, frequency: ${frequency}`,
  )

  const currentDate = new Date(currentDueDate)
  let nextDueDate = new Date(currentDate)

  switch (frequency) {
    case 'weekly':
      nextDueDate.setDate(nextDueDate.getDate() + 7)
      break
    case 'monthly':
      nextDueDate.setMonth(nextDueDate.getMonth() + 1)
      break
    case 'quarterly':
      nextDueDate.setMonth(nextDueDate.getMonth() + 3)
      break
    default:
      return { nextDueDate: '', scheduled: false }
  }

  return {
    nextDueDate: nextDueDate.toISOString(),
    scheduled: frequency !== 'one-time',
  }
}

async function sendPaymentConfirmation(
  email: string,
  payeeName: string,
  amount: number,
  paymentDate: string,
  confirmationNumber: string,
): Promise<{ sent: boolean }> {
  'use step'

  const html = `
    <h2>Bill Payment Confirmation</h2>
    <p>Your payment has been processed successfully.</p>
    <p>
      <strong>Payee:</strong> ${payeeName}<br />
      <strong>Amount:</strong> $${amount.toFixed(2)}<br />
      <strong>Payment Date:</strong> ${paymentDate}<br />
      <strong>Confirmation #:</strong> ${confirmationNumber}
    </p>
    <p>Thank you!</p>
  `

  const result = await sendEmail(email, 'Bill Payment Confirmation', html)
  return { sent: result.success }
}

async function sendFailureNotification(
  email: string,
  payeeName: string,
  amount: number,
  attemptNumber: number,
): Promise<{ sent: boolean }> {
  'use step'

  const html = `
    <h2>Bill Payment Failed</h2>
    <p>We were unable to process your payment on attempt #${attemptNumber}.</p>
    <p>
      <strong>Payee:</strong> ${payeeName}<br />
      <strong>Amount:</strong> $${amount.toFixed(2)}
    </p>
    <p>We will retry this payment. If the issue persists, please contact support.</p>
  `

  const result = await sendEmail(email, 'Bill Payment Failed - Retry Scheduled', html)
  return { sent: result.success }
}

export async function billPaymentAutomationWorkflow(
  input: BillPaymentInput,
): Promise<BillPaymentOutput> {
  'use workflow'

  const workflowRunId = crypto.randomUUID()
  let attemptCount = 0
  const maxRetries = 3

  try {
    // Step 1: Validate payee
    const payeeValidation = await validatePayee(input.payeeId)

    if (!payeeValidation.valid) {
      throw new FatalError(`Invalid payee: ${input.payeeId}`)
    }

    await logWorkflowEvent(
      'bill_payment',
      workflowRunId,
      'payee_validated',
      { payeeId: input.payeeId, payeeName: payeeValidation.payeeName },
      'completed',
    )

    // Step 2: Create payment record
    const paymentRecord = await recordBillPayment(
      input.userId,
      input.payeeId,
      input.amount,
      input.dueDate,
      'pending',
    )

    if (!paymentRecord.success || !paymentRecord.paymentId) {
      throw new Error('Failed to create payment record')
    }

    const paymentId = paymentRecord.paymentId

    // Step 3: Process payment with retry logic
    let paymentResult = null
    let lastError = null

    while (attemptCount < maxRetries) {
      attemptCount++
      console.log(`[Bill Payment] Attempt ${attemptCount} for payment ${paymentId}`)

      try {
        paymentResult = await processBillPayment(paymentId, input.amount, input.payeeId)
        break // Success, exit retry loop
      } catch (error) {
        lastError = error

        if (error instanceof FatalError) {
          throw error // Don't retry fatal errors
        }

        if (attemptCount < maxRetries) {
          // Notify about failure and retry
          await notifyFailedPaymentRetry(
            paymentId,
            attemptCount,
            error instanceof Error ? error.message : 'Unknown error',
          )

          await sendFailureNotification(
            input.userEmail,
            input.payeeName,
            input.amount,
            attemptCount,
          )

          // Wait before retrying (exponential backoff)
          const delaySeconds = Math.pow(2, attemptCount)
          await sleep(`${delaySeconds}s`)
        }
      }
    }

    // If all retries failed
    if (!paymentResult) {
      throw lastError || new Error('Payment failed after all retry attempts')
    }

    // Step 4: Send confirmation
    await sendPaymentConfirmation(
      input.userEmail,
      input.payeeName,
      input.amount,
      new Date().toLocaleDateString(),
      paymentResult.confirmationId,
    )

    // Step 5: Schedule next payment if recurring
    let nextPaymentScheduled = false
    if (input.frequency !== 'one-time') {
      const nextPayment = await scheduleNextPayment(
        input.userId,
        input.payeeId,
        input.frequency,
        input.dueDate,
      )

      nextPaymentScheduled = nextPayment.scheduled

      if (nextPaymentScheduled) {
        // Create a follow-up workflow run for next payment
        console.log(
          `[Bill Payment] Next payment scheduled for ${nextPayment.nextDueDate}`,
        )
      }
    }

    // Step 6: Log success
    await logWorkflowEvent(
      'bill_payment',
      workflowRunId,
      'payment_completed',
      {
        paymentId,
        confirmationId: paymentResult.confirmationId,
        nextScheduled: nextPaymentScheduled,
        attempts: attemptCount,
      },
      'completed',
    )

    return {
      success: true,
      paymentId,
      status: 'completed',
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    await logWorkflowEvent(
      'bill_payment',
      workflowRunId,
      'payment_failed',
      { error: errorMessage, attempts: attemptCount },
      'failed',
    )

    return {
      success: false,
      error: errorMessage,
      status: 'failed',
    }
  }
}
