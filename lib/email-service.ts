import sgMail from '@sendgrid/mail'

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export interface EmailPayload {
  to: string
  subject: string
  html: string
  text?: string
}

export interface TransactionEmailData {
  recipientName: string
  recipientEmail: string
  senderName: string
  amount: number
  currency: string
  description: string
  transactionId: string
  timestamp: Date
}

export async function sendTransactionNotification(data: TransactionEmailData): Promise<boolean> {
  try {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@chasebank.app'

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { border-bottom: 3px solid #0066cc; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #0066cc; margin: 0; font-size: 28px; }
          .content { margin: 20px 0; }
          .transaction-details { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #00b386; }
          .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: 600; color: #333; }
          .detail-value { color: #666; }
          .amount { font-size: 32px; font-weight: bold; color: #00b386; margin: 20px 0; }
          .footer { color: #999; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
          .success-badge { display: inline-block; background-color: #00b386; color: white; padding: 8px 16px; border-radius: 4px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Payment Received</h1>
          </div>

          <div class="content">
            <p>Hello <strong>${data.recipientName}</strong>,</p>
            <p>Great news! You&apos;ve received a payment. Here are the details:</p>

            <div class="success-badge">✓ Transfer Completed</div>

            <div class="transaction-details">
              <div class="detail-row">
                <span class="detail-label">From:</span>
                <span class="detail-value">${data.senderName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value amount">${data.currency.toUpperCase()} $${data.amount.toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Description:</span>
                <span class="detail-value">${data.description}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Transaction ID:</span>
                <span class="detail-value" style="font-family: monospace; font-size: 12px;">${data.transactionId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date & Time:</span>
                <span class="detail-value">${data.timestamp.toLocaleString()}</span>
              </div>
            </div>

            <p style="margin-top: 30px; color: #666;">
              The funds have been transferred to your account. Depending on your bank, they may take 1-3 business days to appear in your account.
            </p>

            <p style="margin-top: 20px; color: #666;">
              <strong>Need help?</strong> Contact our support team at support@chasebank.app
            </p>
          </div>

          <div class="footer">
            <p>This is an automated transaction notification from Chase Bank. Please do not reply to this email.</p>
            <p>&copy; 2024 Chase Bank. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const textContent = `
Payment Received

Hello ${data.recipientName},

You have received a payment from ${data.senderName}.

Amount: ${data.currency.toUpperCase()} $${data.amount.toFixed(2)}
Description: ${data.description}
Transaction ID: ${data.transactionId}
Date: ${data.timestamp.toLocaleString()}

The funds have been transferred to your account. They may take 1-3 business days to appear.

Contact us at support@chasebank.app for assistance.
    `

    const message: EmailPayload = {
      to: data.recipientEmail,
      subject: `Payment Received: ${data.currency.toUpperCase()} $${data.amount.toFixed(2)} from ${data.senderName}`,
      html: htmlContent,
      text: textContent,
    }

    console.log('[v0] Sending transaction notification to:', data.recipientEmail)

    // Only send if SendGrid is configured
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send({
        to: message.to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@chasebank.app',
        subject: message.subject,
        html: message.html,
        text: message.text,
      })
      console.log('[v0] Transaction email sent successfully')
    } else {
      console.log('[v0] SendGrid not configured - email not sent (development mode)')
    }

    return true
  } catch (error) {
    console.error('[v0] Email service error:', error)
    throw error
  }
}

export async function sendPaymentConfirmation(data: TransactionEmailData): Promise<boolean> {
  try {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@chasebank.app'

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { border-bottom: 3px solid #0066cc; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #0066cc; margin: 0; font-size: 28px; }
          .transaction-details { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0066cc; }
          .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: 600; color: #333; }
          .detail-value { color: #666; }
          .amount { font-size: 32px; font-weight: bold; color: #0066cc; margin: 20px 0; }
          .footer { color: #999; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
          .pending-badge { display: inline-block; background-color: #ff9800; color: white; padding: 8px 16px; border-radius: 4px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📤 Payment Sent</h1>
          </div>

          <div class="content">
            <p>Hello <strong>${data.senderName}</strong>,</p>
            <p>Your payment has been sent successfully. Here are the details:</p>

            <div class="pending-badge">⏳ Processing</div>

            <div class="transaction-details">
              <div class="detail-row">
                <span class="detail-label">To:</span>
                <span class="detail-value">${data.recipientName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value amount">-${data.currency.toUpperCase()} $${data.amount.toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Description:</span>
                <span class="detail-value">${data.description}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Transaction ID:</span>
                <span class="detail-value" style="font-family: monospace; font-size: 12px;">${data.transactionId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date & Time:</span>
                <span class="detail-value">${data.timestamp.toLocaleString()}</span>
              </div>
            </div>

            <p style="margin-top: 30px; color: #666;">
              Your payment is being processed and will be delivered to ${data.recipientName} shortly.
            </p>
          </div>

          <div class="footer">
            <p>This is an automated transaction confirmation from Chase Bank.</p>
            <p>&copy; 2024 Chase Bank. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send({
        to: data.senderName ? data.senderEmail : data.recipientEmail,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@chasebank.app',
        subject: `Payment Sent Confirmation: ${data.currency.toUpperCase()} $${data.amount.toFixed(2)}`,
        html: htmlContent,
      })
      console.log('[v0] Confirmation email sent')
    }

    return true
  } catch (error) {
    console.error('[v0] Email confirmation error:', error)
    throw error
  }
}
