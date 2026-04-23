/**
 * Email Notification API - Sends transactional emails
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      email,
      subject,
      template,
      data,
    } = await request.json()

    if (!email || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('[v0] Processing email notification:', {
      userId,
      email,
      subject,
      template,
    })

    // In production, integrate with email service (SendGrid, Mailgun, AWS SES, etc.)
    // For now, we'll simulate with console logs and webhook

    // Simulate email service delay
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Log email details
    const emailPayload = buildEmailPayload(subject, template, data)
    console.log('[v0] Email content:', {
      to: email,
      subject,
      html: emailPayload,
    })

    // In production, call actual email service
    // Example: await sendGridClient.send({ ... })

    // Simulate success response
    return NextResponse.json({
      success: true,
      message: 'Email queued for delivery',
      email,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    })
  } catch (error) {
    console.error('[v0] Email notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send email notification' },
      { status: 500 }
    )
  }
}

/**
 * Build email HTML payload based on template
 */
function buildEmailPayload(subject: string, template: string, data: any): string {
  if (template === 'transaction-alert') {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #003478; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; }
            .transaction-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1f2937; }
            .amount { font-size: 24px; font-weight: bold; color: #000; }
            .label { color: #6b7280; font-size: 12px; text-transform: uppercase; }
            .footer { text-align: center; color: #9ca3af; font-size: 12px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Transaction Alert</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We detected a transaction on your account:</p>
              
              <div class="transaction-card">
                <div class="label">Description</div>
                <p style="margin: 5px 0; font-weight: 500;">${data.description}</p>
                
                <div class="label" style="margin-top: 15px;">Amount</div>
                <div class="amount" style="color: ${data.type === 'credit' ? '#10b981' : '#ef4444'};">
                  ${data.type === 'credit' ? '+' : '-'}$${data.amount.toFixed(2)}
                </div>
                
                <div class="label" style="margin-top: 15px;">Category</div>
                <p style="margin: 5px 0;">${data.category}</p>
                
                ${data.recipientName ? `
                  <div class="label" style="margin-top: 15px;">Recipient</div>
                  <p style="margin: 5px 0;">${data.recipientName}</p>
                ` : ''}
                
                <div class="label" style="margin-top: 15px;">Time</div>
                <p style="margin: 5px 0;">${data.timestamp}</p>
              </div>
              
              <p>If you did not authorize this transaction, please contact us immediately.</p>
              <p>Best regards,<br/>Your Banking Team</p>
            </div>
            <div class="footer">
              <p>© 2026 Secure Banking. All rights reserved.</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  return '<p>Transaction notification</p>'
}
