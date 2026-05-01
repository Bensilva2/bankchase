import { sleep, createHook, FatalError } from 'workflow'
import { archiveUserData, updateLoanApplication, logWorkflowEvent } from './steps/database'
import { sendAccountClosureEmail } from './steps/email'
import { notifyAccountClosureRequest } from './steps/slack'
import { refundTransaction } from './steps/payment'

export interface AccountClosureInput {
  userId: string
  userEmail: string
  userName: string
  reason: string
}

export interface AccountClosureOutput {
  success: boolean
  status?: string
  error?: string
}

async function validateNoPendingTransactions(userId: string): Promise<{
  valid: boolean
  pendingCount: number
}> {
  'use step'

  console.log(`[Closure] Checking pending transactions for user ${userId}`)

  // Simulate checking database for pending transactions
  const pendingCount = Math.random() > 0.8 ? 0 : Math.floor(Math.random() * 2)

  return {
    valid: pendingCount === 0,
    pendingCount,
  }
}

async function calculateRefundAmount(userId: string): Promise<{ amount: number; description: string }> {
  'use step'

  console.log(`[Closure] Calculating refund amount for user ${userId}`)

  // Simulate calculating any pending refunds (e.g., overdraft fees, pending credits)
  const amount = Math.random() > 0.7 ? Math.floor(Math.random() * 500) : 0

  return {
    amount,
    description: amount > 0 ? 'Fee reversal and credit balance' : 'No refund due',
  }
}

async function deactivateAccount(userId: string): Promise<{
  deactivated: boolean
  timestamp: string
}> {
  'use step'

  console.log(`[Closure] Deactivating account for user ${userId}`)

  return {
    deactivated: true,
    timestamp: new Date().toISOString(),
  }
}

async function sendComplianceNotification(
  userId: string,
  closureReason: string,
): Promise<{ notified: boolean }> {
  'use step'

  console.log(`[Closure] Sending compliance notification for account closure - User ${userId}`)

  // In production, this would post to Slack about regulatory/compliance requirements
  return { notified: true }
}

export async function accountClosureWorkflow(
  input: AccountClosureInput,
): Promise<AccountClosureOutput> {
  'use workflow'

  const workflowRunId = crypto.randomUUID()

  try {
    // Step 1: Log closure request
    await logWorkflowEvent(
      'account_closure',
      workflowRunId,
      'closure_requested',
      { userId: input.userId, reason: input.reason },
      'started',
    )

    // Step 2: Notify admin/compliance team
    await notifyAccountClosureRequest(input.userId, input.userEmail)

    // Step 3: Create verification hook (for manual verification if needed)
    const verificationHook = createHook<{ verified: boolean; notes?: string }>({
      token: `closure-verify-${input.userId}`,
    })

    console.log(`[Closure] Waiting for verification for account ${input.userId}`)

    // Wait for verification (24-hour window)
    const verification = await verificationHook

    if (!verification.verified) {
      throw new FatalError(`Account closure verification failed: ${verification.notes || 'Unknown reason'}`)
    }

    // Step 4: Check for pending transactions
    const transactionCheck = await validateNoPendingTransactions(input.userId)

    if (!transactionCheck.valid) {
      throw new FatalError(
        `Cannot close account with ${transactionCheck.pendingCount} pending transaction(s)`,
      )
    }

    // Step 5: Calculate and process refunds
    const refundInfo = await calculateRefundAmount(input.userId)

    if (refundInfo.amount > 0) {
      await refundTransaction(
        `ACC_${input.userId}`,
        refundInfo.amount,
        'Account closure - fee reversal',
      )
    }

    // Step 6: Deactivate the account
    const deactivation = await deactivateAccount(input.userId)

    // Step 7: Archive user data
    await archiveUserData(input.userId, input.reason)

    // Wait before sending confirmation (allows final backend processing)
    await sleep('2s')

    // Step 8: Send confirmation email
    await sendAccountClosureEmail(input.userEmail, input.userName)

    // Step 9: Notify compliance team
    await sendComplianceNotification(input.userId, input.reason)

    // Step 10: Log successful closure
    await logWorkflowEvent(
      'account_closure',
      workflowRunId,
      'account_closed',
      {
        userId: input.userId,
        deactivatedAt: deactivation.timestamp,
        refundProcessed: refundInfo.amount,
      },
      'completed',
    )

    return {
      success: true,
      status: 'closed',
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    await logWorkflowEvent(
      'account_closure',
      workflowRunId,
      'closure_failed',
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
