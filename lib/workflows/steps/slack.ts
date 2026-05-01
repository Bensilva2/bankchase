import { IncomingWebhook } from '@slack/webhook'

const webhookUrl = process.env.SLACK_WEBHOOK_URL
const webhook = webhookUrl ? new IncomingWebhook(webhookUrl) : null

export async function notifySlack(
  title: string,
  message: string,
  severity: 'info' | 'warning' | 'error' = 'info',
) {
  'use step'

  if (!webhook) {
    console.warn('[Slack Step] Slack webhook not configured')
    return { success: false, error: 'Slack not configured' }
  }

  try {
    const colorMap = {
      info: '#36a64f',
      warning: '#ff9900',
      error: '#ff0000',
    }

    await webhook.send({
      text: title,
      attachments: [
        {
          color: colorMap[severity],
          title,
          text: message,
          footer: 'BankChase Workflow System',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    })

    return { success: true }
  } catch (error) {
    console.error('[Slack Step] Failed to send notification:', error)
    throw error
  }
}

export async function notifyDisputeEscalation(
  disputeId: string,
  customerId: string,
  reason: string,
) {
  'use step'

  const message = `
Customer #${customerId} dispute (ID: ${disputeId}) has been escalated.
Reason: ${reason}
Action required: Please review and investigate.
  `.trim()

  return notifySlack(
    'Payment Dispute Escalation',
    message,
    'warning',
  )
}

export async function notifyAccountClosureRequest(
  customerId: string,
  customerEmail: string,
) {
  'use step'

  const message = `
Account closure request received from Customer #${customerId}
Email: ${customerEmail}
Status: Pending verification
  `.trim()

  return notifySlack(
    'Account Closure Request',
    message,
    'info',
  )
}

export async function notifyLoanApproval(
  applicationId: string,
  amount: number,
) {
  'use step'

  const message = `
New loan approved in the system:
Application ID: ${applicationId}
Amount: $${amount.toFixed(2)}
Next step: Send offer to applicant
  `.trim()

  return notifySlack(
    'Loan Approved',
    message,
    'info',
  )
}

export async function notifyFailedPaymentRetry(
  paymentId: string,
  attempt: number,
  error: string,
) {
  'use step'

  const message = `
Payment retry attempt #${attempt}
Payment ID: ${paymentId}
Error: ${error}
Next retry: Scheduled
  `.trim()

  return notifySlack(
    'Payment Failed - Retry Scheduled',
    message,
    'warning',
  )
}
