import { sleep, createHook } from 'workflow'
import { createLoanApplication, updateLoanApplication, logWorkflowEvent } from './steps/database'
import { sendLoanOfferEmail } from './steps/email'
import { notifyLoanApproval } from './steps/slack'
import { processLoanFunding } from './steps/payment'

export interface LoanApplicationInput {
  userId: string
  userEmail: string
  userName: string
  requestedAmount: number
  loanTerm: number
  purpose: string
}

export interface LoanApprovalDecision {
  approved: boolean
  amount?: number
  rate?: number
  reason?: string
}

export interface LoanApplicationOutput {
  success: boolean
  applicationId?: string
  status?: string
  offer?: {
    amount: number
    rate: number
    term: number
  }
  error?: string
}

async function performCreditCheck(userId: string): Promise<{
  score: number
  approved: boolean
  rate: number
}> {
  'use step'

  // Simulate credit check
  const score = Math.floor(Math.random() * 400) + 300 // 300-700 range
  const approved = score >= 580
  const rate = approved ? 8.5 - (score - 580) * 0.01 : 0

  console.log(`[Loan Step] Credit check for user ${userId}: score=${score}, approved=${approved}`)

  return { score, approved, rate }
}

async function calculateLoanOffer(
  amount: number,
  term: number,
  creditRate: number,
): Promise<{ approvedAmount: number; interestRate: number }> {
  'use step'

  // Calculate based on credit score
  const approvedAmount = Math.min(amount, 500000)
  const interestRate = creditRate

  return {
    approvedAmount,
    interestRate,
  }
}

export async function loanApplicationWorkflow(
  input: LoanApplicationInput,
): Promise<LoanApplicationOutput> {
  'use workflow'

  const workflowRunId = crypto.randomUUID()

  try {
    // Step 1: Create application record
    const appResult = await createLoanApplication(
      input.userId,
      input.requestedAmount,
      input.loanTerm,
      'pending_review',
    )

    if (!appResult.success || !appResult.applicationId) {
      throw new Error('Failed to create loan application')
    }

    const applicationId = appResult.applicationId

    await logWorkflowEvent(
      'loan_application',
      workflowRunId,
      'application_created',
      { applicationId, userId: input.userId },
      'completed',
    )

    // Step 2: Wait for document uploads (simulated with hook)
    const uploadHook = createHook<{ documentsVerified: boolean }>({
      token: `loan-docs-${applicationId}`,
    })

    console.log(`[Loan] Waiting for document uploads for application ${applicationId}`)

    const uploadResult = await uploadHook
    if (!uploadResult.documentsVerified) {
      await updateLoanApplication(applicationId, {
        status: 'documents_rejected',
      })
      throw new Error('Documents could not be verified')
    }

    // Step 3: Perform credit check
    const creditCheck = await performCreditCheck(input.userId)

    if (!creditCheck.approved) {
      await updateLoanApplication(applicationId, {
        status: 'denied',
        denial_reason: 'Credit score too low',
      })

      throw new Error('Loan denied due to credit score')
    }

    // Step 4: Calculate loan offer
    const offer = await calculateLoanOffer(
      input.requestedAmount,
      input.loanTerm,
      creditCheck.rate,
    )

    await updateLoanApplication(applicationId, {
      status: 'offer_sent',
      offered_amount: offer.approvedAmount,
      interest_rate: offer.interestRate,
    })

    // Step 5: Send loan offer email
    await sendLoanOfferEmail(
      input.userEmail,
      input.userName,
      offer.approvedAmount,
      offer.interestRate,
      input.loanTerm,
    )

    // Step 6: Notify admin via Slack
    await notifyLoanApproval(applicationId, offer.approvedAmount)

    // Step 7: Wait for applicant acceptance (hook with timeout)
    const acceptanceHook = createHook<{ accepted: boolean }>({
      token: `loan-accept-${applicationId}`,
    })

    console.log(`[Loan] Waiting for applicant acceptance for application ${applicationId}`)

    // Wait with timeout of 30 days
    const acceptanceResult = await acceptanceHook

    if (!acceptanceResult.accepted) {
      await updateLoanApplication(applicationId, {
        status: 'rejected_by_applicant',
      })
      throw new Error('Applicant rejected the loan offer')
    }

    // Step 8: Process loan funding
    const funding = await processLoanFunding(applicationId, offer.approvedAmount)

    await updateLoanApplication(applicationId, {
      status: 'funded',
      funding_id: funding.fundingId,
      funded_at: new Date().toISOString(),
    })

    // Step 9: Send welcome materials (email)
    await sleep('1s')

    await logWorkflowEvent(
      'loan_application',
      workflowRunId,
      'loan_approved_and_funded',
      { applicationId, fundingId: funding.fundingId },
      'completed',
    )

    return {
      success: true,
      applicationId,
      status: 'funded',
      offer: {
        amount: offer.approvedAmount,
        rate: offer.interestRate,
        term: input.loanTerm,
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    await logWorkflowEvent(
      'loan_application',
      workflowRunId,
      'application_failed',
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
