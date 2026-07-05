import fs from 'fs'
import path from 'path'

interface EmailMessage {
  to: string
  subject: string
  text?: string
  html?: string
  cc?: string[]
  bcc?: string[]
  replyTo?: string
}

// Store emails in memory (in production, use database)
let emailStorage: Array<EmailMessage & { id: string; timestamp: string }> = []

function getStorageFile(): string {
  return path.join(process.cwd(), '.emails')
}

function saveEmails() {
  try {
    const dir = path.dirname(getStorageFile())
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(getStorageFile(), JSON.stringify(emailStorage, null, 2))
  } catch (err) {
    console.warn('[Mock Email] Could not persist emails to file:', err)
  }
}

function loadEmails() {
  try {
    if (fs.existsSync(getStorageFile())) {
      const data = fs.readFileSync(getStorageFile(), 'utf-8')
      emailStorage = JSON.parse(data)
    }
  } catch (err) {
    console.warn('[Mock Email] Could not load emails from file:', err)
    emailStorage = []
  }
}

// Load emails on module load
loadEmails()

export async function sendOnboardingEmail({
  email,
  name,
}: {
  email: string
  name: string
}) {
  try {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const timestamp = new Date().toISOString()

    const message: EmailMessage & { id: string; timestamp: string } = {
      id: messageId,
      to: email,
      subject: 'Welcome to BankChase AI Suite',
      html: generateOnboardingEmailHTML(name),
      text: `Welcome to BankChase AI Suite\n\nHi ${name},\n\nThank you for starting your AI Suite onboarding journey!`,
      timestamp,
    }

    emailStorage.push(message)
    saveEmails()

    console.log('[Mock Email] Onboarding email sent:', { to: email, messageId })

    return { success: true, messageId }
  } catch (error) {
    console.error('[Mock Email] Failed to send onboarding email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

export async function sendWorkflowCompletionEmail({
  email,
  name,
  workflowRunId,
}: {
  email: string
  name: string
  workflowRunId: string
}) {
  try {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const timestamp = new Date().toISOString()

    const message: EmailMessage & { id: string; timestamp: string } = {
      id: messageId,
      to: email,
      subject: 'Your AI Suite Setup is Complete',
      html: generateCompletionEmailHTML(name, workflowRunId),
      text: `Setup Complete!\n\nHi ${name},\n\nCongratulations! Your BankChase AI Suite is now fully configured.`,
      timestamp,
    }

    emailStorage.push(message)
    saveEmails()

    console.log('[Mock Email] Completion email sent:', { to: email, messageId })

    return { success: true, messageId }
  } catch (error) {
    console.error('[Mock Email] Failed to send completion email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

export async function sendCustomEmail({
  to,
  subject,
  html,
  text,
  cc,
  bcc,
  replyTo,
}: EmailMessage) {
  try {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const timestamp = new Date().toISOString()

    const message: EmailMessage & { id: string; timestamp: string } = {
      id: messageId,
      to,
      subject,
      html,
      text,
      cc,
      bcc,
      replyTo,
      timestamp,
    }

    emailStorage.push(message)
    saveEmails()

    console.log('[Mock Email] Custom email sent:', { to, subject, messageId })

    return { success: true, messageId }
  } catch (error) {
    console.error('[Mock Email] Failed to send custom email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

export function getAllEmails() {
  return emailStorage
}

export function getEmailsByRecipient(recipient: string) {
  return emailStorage.filter((email) => email.to === recipient || email.cc?.includes(recipient) || email.bcc?.includes(recipient))
}

export function getEmailById(id: string) {
  return emailStorage.find((email) => email.id === id)
}

function generateOnboardingEmailHTML(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0a6fb8; padding-bottom: 20px; }
          .header h1 { color: #0f1a2a; margin: 0; font-size: 28px; }
          .content { margin-bottom: 30px; }
          .button { display: inline-block; background-color: #0a6fb8; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to BankChase AI Suite</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for starting your AI Suite onboarding journey! We're excited to help you set up your banking platform with cutting-edge AI capabilities.</p>
            <p>Your onboarding has been initiated. Complete all setup steps in your dashboard to unlock these powerful features.</p>
            <p>Best regards,<br/>The BankChase Team</p>
          </div>
          <div class="footer">
            <p>BankChase | AI-Powered Banking Suite</p>
          </div>
        </div>
      </body>
    </html>
  `
}

function generateCompletionEmailHTML(name: string, workflowRunId: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0a6fb8; padding-bottom: 20px; }
          .header h1 { color: #0f1a2a; margin: 0; font-size: 28px; }
          .success-badge { display: inline-block; background-color: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin-top: 10px; }
          .content { margin-bottom: 30px; }
          .info-box { background-color: #f3f4f6; border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; margin: 20px 0; font-family: monospace; }
          .footer { text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Setup Complete</h1>
            <div class="success-badge">Successfully Completed</div>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Congratulations! Your BankChase AI Suite is now fully configured and ready for production use.</p>
            <div class="info-box">
              <strong>Workflow ID:</strong><br/>
              ${workflowRunId}
            </div>
            <p>Your system is now live and ready to handle customer interactions with enterprise-grade AI capabilities.</p>
            <p>Best regards,<br/>The BankChase Team</p>
          </div>
          <div class="footer">
            <p>BankChase | AI-Powered Banking Suite</p>
          </div>
        </div>
      </body>
    </html>
  `
}
