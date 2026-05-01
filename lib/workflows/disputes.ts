import { sleep, createWebhook, RetryableError } from 'workflow'
import { createDispute, updateDisputeStatus, logWorkflowEvent } from './steps/database'
import { sendDisputeStatusEmail } from './steps/email'
import { notifyDisputeEscalation } from './steps/slack'
import { refundTransaction } from './steps/payment'

export interface DisputeInput {
  userId: string
  userEmail: string
  transactionId: string
  amount: number
  reason: string
  description: string
}

export interface DisputeOutput {
  success: boolean
  disputeId?: string
  status?: string
  error?: string
}

async function investigateDispute(
  disputeId: string,
  transactionId: string,
): Promise<{ investigationId: string; findings: string }> {
  'use step'

  console.log(
    `[Dispute] Investigating dispute ${disputeId} for transaction ${transactionId}`,
  )

  // Simulate investigation
  const investigationId = `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const findings = 'Transaction appears to be unauthorized based on account activity patterns'

  return { investigationId, findings }
}

async function notifyMerchant(
  transactionId: string,
  amount: number,
  reason: string,
): Promise<{ notificationId: string; status: string }> {
  'use step'

  console.log(
    `[Dispute] Notifying merchant about dispute for transaction ${transactionId}`,
  )

  // Simulate merchant notification
  const notificationId = `MN_${Date.now()}`

  return { notificationId, status: 'sent' }
}

export async function paymentDisputeWorkflow(input: DisputeInput): Promise<DisputeOutput> {
  'use workflow'

  const workflowRunId = crypto.randomUUID()

  try {
    // Step 1: Create dispute record
    const disputeResult = await createDispute(
      input.userId,
      input.transactionId,
      input.reason,
    )

    if (!disputeResult.success || !disputeResult.disputeId) {
      throw new Error('Failed to create dispute')
    }

    const disputeId = disputeResult.disputeId

    await logWorkflowEvent(
      'payment_dispute',
      workflowRunId,
      'dispute_initiated',
      { disputeId, transactionId: input.transactionId },
      'completed',
    )

    // Step 2: Create webhook for evidence collection
    const evidenceWebhook = createWebhook()

    console.log(
      `[Dispute] Waiting for evidence via webhook: ${evidenceWebhook.token}`,
    )

    // Step 3: Notify merchant
    await notifyMerchant(input.transactionId, input.amount, input.reason)

    // Step 4: Update dispute status to "evidence_collection"
    await updateDisputeStatus(disputeId, 'evidence_collection')

    // Wait for evidence webhook callback (30-day window)
    let evidenceData: any = null
    try {
      const request = await evidenceWebhook
      const payload = await request.json()
      evidenceData = payload
      console.log(`[Dispute] Received evidence for dispute ${disputeId}`)
    } catch (error) {
      console.error('[Dispute] No evidence received within timeframe')
      // Continue without evidence
    }

    // Step 5: Investigate the dispute
    const investigation = await investigateDispute(disputeId, input.transactionId)

    // Step 6: Check if escalation is needed
    const needsEscalation = evidenceData?.suspicious || investigation.findings.includes('unauthorized')

    if (needsEscalation) {
      await notifyDisputeEscalation(disputeId, input.userId, investigation.findings)
      await updateDisputeStatus(disputeId, 'escalated')

      // Wait before resolution
      await sleep('5s')
    }

    // Step 7: Resolve the dispute
    let resolution = 'chargeback_approved'
    let refundResult = null

    if (investigation.findings.includes('unauthorized')) {
      await refundTransaction(input.transactionId, input.amount, 'Chargeback due to unauthorized transaction')
      refundResult = { status: 'refunded' }
      resolution = 'refunded'
    } else {
      resolution = 'merchant_found_responsible'
    }

    // Step 8: Update final status
    await updateDisputeStatus(disputeId, 'resolved', resolution)

    // Step 9: Send final notification to customer
    await sendDisputeStatusEmail(
      input.userEmail,
      disputeId,
      'Resolved',
      `Your dispute has been investigated and resolved. ${resolution === 'refunded' ? 'A refund has been processed.' : 'The merchant has been found responsible.'}`,
    )

    await logWorkflowEvent(
      'payment_dispute',
      workflowRunId,
      'dispute_resolved',
      { disputeId, resolution, investigationId: investigation.investigationId },
      'completed',
    )

    return {
      success: true,
      disputeId,
      status: 'resolved',
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    await logWorkflowEvent(
      'payment_dispute',
      workflowRunId,
      'dispute_failed',
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
