import Mailgun from 'mailgun.js'
import FormData from 'form-data'

let mg: any = null

if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
  const mailgun = new Mailgun(FormData)
  mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY,
  })
}

export interface TransactionEmailData {
  recipientName: string
  recipientEmail: string
  senderName: string
  senderEmail: string
  amount: number
  currency: string
  description: string
  transactionId: string
  timestamp: Date
}

export async function sendTransactionNotificationMailgun(
  data: TransactionEmailData
): Promise<boolean> {
  try {
    if (!mg || !process.env.MAILGUN_DOMAIN) {
      console.log('[v0] Mailgun not configured. Email would be sent to:', data.recipientEmail)
      return true
    }

    const fromEmail = process.env.MAILGUN_FROM_EMAIL || 'noreply@chasebank.app'

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; }
          .header { border-bottom: 3px solid #0066cc; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #0066cc; margin: 0; font-size: 28px; }
          .content { line-height: 1.6; color: #333; }
          .transaction-details { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .label { font-weight: bold; color: #666; }
          .value { color: #0066cc; font-weight: 600; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
          .badge { display: inline-block; background-color: #28a745; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Chase Bank</h1>
            <p style="margin: 5px 0; color: #666;">Payment Confirmed</p>
          </div>
          <div class="content">
            <div class="badge">TRANSACTION COMPLETED</div>
            <p>Hello <strong>${data.recipientName}</strong>,</p>
            <p>You have received a payment from <strong>${data.senderName}</strong>.</p>
            <div class="transaction-details">
              <div class="detail-row">
                <span class="label">Amount:</span>
                <span class="value">${data.currency} ${data.amount.toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="label">From:</span>
                <span>${data.senderName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Transaction ID:</span>
                <span style="font-family: monospace;">${data.transactionId}</span>
              </div>
              <div class="detail-row">
                <span class="label">Status:</span>
                <span style="color: #28a745;">Settled</span>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>Chase Bank • Secure Banking</p>
          </div>
        </div>
      </body>
      </html>
    `

    const emailData = {
      from: fromEmail,
      to: data.recipientEmail,
      subject: `Payment Received: ${data.currency} ${data.amount.toFixed(2)}`,
      text: `You have received ${data.currency} ${data.amount.toFixed(2)} from ${data.senderName}`,
      html: htmlContent,
    }

    const response = await mg.messages.create(process.env.MAILGUN_DOMAIN, emailData)
    console.log('[v0] Mailgun email sent:', response.id)
    return true
  } catch (error) {
    console.error('[v0] Mailgun error:', error)
    return false
  }
}

export async function sendSenderConfirmationMailgun(data: TransactionEmailData): Promise<boolean> {
  try {
    if (!mg || !process.env.MAILGUN_DOMAIN) {
      console.log('[v0] Mailgun not configured. Sender confirmation would be sent')
      return true
    }

    const fromEmail = process.env.MAILGUN_FROM_EMAIL || 'noreply@chasebank.app'

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; }
          .header { border-bottom: 3px solid #0066cc; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #0066cc; margin: 0; font-size: 28px; }
          .content { line-height: 1.6; color: #333; }
          .transaction-details { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .label { font-weight: bold; color: #666; }
          .value { color: #0066cc; font-weight: 600; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
          .badge { display: inline-block; background-color: #28a745; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Chase Bank</h1>
            <p style="margin: 5px 0; color: #666;">Payment Sent</p>
          </div>
          <div class="content">
            <div class="badge">PAYMENT SENT</div>
            <p>Hello ${data.senderName},</p>
            <p>Your payment to <strong>${data.recipientName}</strong> has been successfully processed.</p>
            <div class="transaction-details">
              <div class="detail-row">
                <span class="label">Amount:</span>
                <span class="value">${data.currency} ${data.amount.toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="label">To:</span>
                <span>${data.recipientName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Transaction ID:</span>
                <span style="font-family: monospace;">${data.transactionId}</span>
              </div>
              <div class="detail-row">
                <span class="label">Status:</span>
                <span style="color: #28a745;">Completed</span>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>Chase Bank • Secure Banking</p>
          </div>
        </div>
      </body>
      </html>
    `

    const emailData = {
      from: fromEmail,
      to: data.senderEmail,
      subject: `Payment Sent: ${data.currency} ${data.amount.toFixed(2)} to ${data.recipientName}`,
      text: `You sent ${data.currency} ${data.amount.toFixed(2)} to ${data.recipientName}`,
      html: htmlContent,
    }

    const response = await mg.messages.create(process.env.MAILGUN_DOMAIN, emailData)
    console.log('[v0] Mailgun sender confirmation sent:', response.id)
    return true
  } catch (error) {
    console.error('[v0] Mailgun sender error:', error)
    return false
  }
}
