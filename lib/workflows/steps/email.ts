import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
) {
  'use step'

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@bankchase.example.com',
      to,
      subject,
      html,
    })

    if (result.error) {
      throw new Error(`Email send failed: ${result.error.message}`)
    }

    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error('[Email Step] Failed to send email:', error)
    throw error
  }
}

export async function sendTransferConfirmation(
  email: string,
  recipientName: string,
  amount: number,
  date: string,
) {
  'use step'

  const html = `
    <h2>Transfer Confirmation</h2>
    <p>Your transfer has been processed successfully.</p>
    <p>
      <strong>Recipient:</strong> ${recipientName}<br />
      <strong>Amount:</strong> $${amount.toFixed(2)}<br />
      <strong>Date:</strong> ${date}
    </p>
    <p>Thank you for using BankChase.</p>
  `

  return sendEmail(email, 'Transfer Confirmation', html)
}

export async function sendLoanOfferEmail(
  email: string,
  applicantName: string,
  amount: number,
  rate: number,
  term: number,
) {
  'use step'

  const html = `
    <h2>Loan Offer</h2>
    <p>Dear ${applicantName},</p>
    <p>We're pleased to offer you a loan with the following terms:</p>
    <p>
      <strong>Loan Amount:</strong> $${amount.toFixed(2)}<br />
      <strong>Interest Rate:</strong> ${rate}%<br />
      <strong>Term:</strong> ${term} months
    </p>
    <p>Please review the attached documents and reply to accept this offer.</p>
  `

  return sendEmail(email, 'Your Loan Offer', html)
}

export async function sendDisputeStatusEmail(
  email: string,
  disputeId: string,
  status: string,
  details: string,
) {
  'use step'

  const html = `
    <h2>Dispute Status Update</h2>
    <p>
      <strong>Dispute ID:</strong> ${disputeId}<br />
      <strong>Status:</strong> ${status}
    </p>
    <p>${details}</p>
    <p>If you have questions, please contact our support team.</p>
  `

  return sendEmail(email, `Dispute Status: ${status}`, html)
}

export async function sendAccountClosureEmail(
  email: string,
  customerName: string,
) {
  'use step'

  const html = `
    <h2>Account Closure Confirmation</h2>
    <p>Dear ${customerName},</p>
    <p>Your BankChase account has been successfully closed.</p>
    <p>If you have any questions, please reach out to our support team.</p>
    <p>Thank you for banking with us.</p>
  `

  return sendEmail(email, 'Account Closure Confirmation', html)
}
