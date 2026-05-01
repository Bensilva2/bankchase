import { sleep, createHook, FatalError } from 'workflow'
import { createLoanApplication, logWorkflowEvent } from './steps/database'
import { sendEmail } from './steps/email'
import { notifySlack } from './steps/slack'

export interface AccountOpeningInput {
  email: string
  fullName: string
  dateOfBirth: string
  ssn: string
  address: string
}

export interface AccountOpeningOutput {
  success: boolean
  accountId?: string
  status?: string
  error?: string
}

async function performKYC(
  email: string,
  name: string,
  ssn: string,
  dateOfBirth: string,
): Promise<{ verified: boolean; kycId: string; details: Record<string, any> }> {
  'use step'

  console.log(`[Account Opening] Performing KYC for ${email}`)

  // Simulate KYC verification
  const kycId = `KYC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // In production, this would call a KYC service like Onfido, Jumio, or IDology
  const verified = true // Assume verification for demo

  return {
    verified,
    kycId,
    details: {
      name,
      dateOfBirth,
      verificationMethod: 'document_upload',
      timestamp: new Date().toISOString(),
    },
  }
}

async function createAccountRecord(
  email: string,
  name: string,
  kycId: string,
): Promise<{ accountId: string; created: boolean }> {
  'use step'

  console.log(`[Account Opening] Creating account record for ${email}`)

  const accountId = `ACC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // In production, this would write to the database
  return {
    accountId,
    created: true,
  }
}

async function sendWelcomeKit(
  email: string,
  accountId: string,
): Promise<{ sent: boolean }> {
  'use step'

  const html = `
    <h2>Welcome to BankChase!</h2>
    <p>Your account has been successfully created.</p>
    <p><strong>Account ID:</strong> ${accountId}</p>
    <p>Your debit card will arrive within 7-10 business days.</p>
    <p>In the meantime, you can set up:</p>
    <ul>
      <li>Direct deposits</li>
      <li>Bill payments</li>
      <li>Mobile banking</li>
    </ul>
    <p>Welcome aboard!</p>
  `

  const result = await sendEmail(email, 'Welcome to BankChase', html)
  return { sent: result.success }
}

export async function accountOpeningWorkflow(
  input: AccountOpeningInput,
): Promise<AccountOpeningOutput> {
  'use workflow'

  const workflowRunId = crypto.randomUUID()

  try {
    // Step 1: Log account opening request
    await logWorkflowEvent(
      'account_opening',
      workflowRunId,
      'opening_requested',
      { email: input.email },
      'started',
    )

    // Step 2: Perform initial KYC verification
    const kycResult = await performKYC(
      input.email,
      input.fullName,
      input.ssn,
      input.dateOfBirth,
    )

    if (!kycResult.verified) {
      throw new FatalError('KYC verification failed')
    }

    // Step 3: Create document upload hook (for manual document verification)
    const documentHook = createHook<{ documentsVerified: boolean; notes?: string }>({
      token: `account-docs-${input.email}`,
    })

    console.log(`[Account Opening] Waiting for document uploads for ${input.email}`)

    // Send initial instruction email
    const instructionHtml = `
      <h2>Complete Your Account Setup</h2>
      <p>To finish opening your account, please upload the following documents:</p>
      <ul>
        <li>Government-issued ID (passport or driver's license)</li>
        <li>Proof of address (utility bill or lease)</li>
      </ul>
      <p>Documents must be uploaded within 14 days or your application will be closed.</p>
    `

    await sendEmail(
      input.email,
      'Complete Your Account Setup',
      instructionHtml,
    )

    // Wait for document upload (14-day window)
    const documentResult = await documentHook

    if (!documentResult.documentsVerified) {
      throw new FatalError(
        `Document verification failed: ${documentResult.notes || 'Documents not verified'}`,
      )
    }

    // Step 4: Create account record in database
    const accountResult = await createAccountRecord(
      input.email,
      input.fullName,
      kycResult.kycId,
    )

    if (!accountResult.created || !accountResult.accountId) {
      throw new FatalError('Failed to create account')
    }

    // Step 5: Create approval hook (for manual review if needed)
    const approvalHook = createHook<{ approved: boolean; reviewer?: string; notes?: string }>({
      token: `account-approve-${input.email}`,
    })

    console.log(`[Account Opening] Waiting for account approval for ${input.email}`)

    // Wait for approval (48-hour window)
    const approval = await approvalHook

    if (!approval.approved) {
      throw new FatalError(`Account opening rejected: ${approval.notes || 'No reason provided'}`)
    }

    // Step 6: Notify Slack about new account
    await notifySlack(
      'New Account Approved',
      `Account ${accountResult.accountId} approved for ${input.email} by ${approval.reviewer || 'system'}`,
      'info',
    )

    // Step 7: Wait before sending welcome materials
    await sleep('2s')

    // Step 8: Send welcome kit
    await sendWelcomeKit(input.email, accountResult.accountId)

    // Step 9: Log successful account opening
    await logWorkflowEvent(
      'account_opening',
      workflowRunId,
      'account_opened',
      {
        accountId: accountResult.accountId,
        kycId: kycResult.kycId,
        approver: approval.reviewer,
      },
      'completed',
    )

    return {
      success: true,
      accountId: accountResult.accountId,
      status: 'opened',
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    await logWorkflowEvent(
      'account_opening',
      workflowRunId,
      'opening_failed',
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
