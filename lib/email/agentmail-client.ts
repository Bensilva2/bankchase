import axios from 'axios'

interface EmailMessage {
  to: string
  subject: string
  text?: string
  html?: string
  cc?: string[]
  bcc?: string[]
  replyTo?: string
}

interface InboxInfo {
  inboxId: string
  email: string
  domain: string
}

function getAgentMailClient() {
  const apiKey = process.env.AGENTMAIL_API_KEY
  if (!apiKey) {
    throw new Error('AGENTMAIL_API_KEY is not configured. Set it in your environment variables.')
  }
  
  return axios.create({
    baseURL: 'https://api.agentmail.to/v0',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })
}

let cachedInboxId: string | null = null
let cachedInboxEmail: string | null = null

async function getOrCreateInbox(): Promise<InboxInfo> {
  // Return cached values if available
  if (cachedInboxId && cachedInboxEmail) {
    return {
      inboxId: cachedInboxId,
      email: cachedInboxEmail,
      domain: cachedInboxEmail.split('@')[1],
    }
  }

  try {
    const client = getAgentMailClient()
    
    // Try to create a new inbox
    const response = await client.post('/inboxes', {
      username: `bankchase-${Date.now()}`,
    })

    const { inbox_id: inboxId, email } = response.data
    
    // Cache the values
    cachedInboxId = inboxId
    cachedInboxEmail = email
    
    console.log('[AgentMail] Created new inbox:', { inboxId, email })
    
    return {
      inboxId,
      email,
      domain: email.split('@')[1],
    }
  } catch (error) {
    console.error('[AgentMail] Failed to create inbox:', error)
    throw new Error('Failed to create AgentMail inbox')
  }
}

export async function sendOnboardingEmail({
  email,
  name,
}: {
  email: string
  name: string
}) {
  try {
    const inbox = await getOrCreateInbox()
    const client = getAgentMailClient()

    const result = await client.post(`/inboxes/${inbox.inboxId}/messages`, {
      to: email,
      subject: 'Welcome to BankChase AI Suite',
      html: generateOnboardingEmailHTML(name),
      text: `Welcome to BankChase AI Suite\n\nHi ${name},\n\nThank you for starting your AI Suite onboarding journey! We're excited to help you set up your banking platform with cutting-edge AI capabilities.\n\nYour onboarding has been initiated. Complete all setup steps in your dashboard to unlock these powerful features.\n\nBest regards,\nThe BankChase Team`,
    })

    console.log('[AgentMail] Onboarding email sent:', { to: email, messageId: result.data?.id })
    
    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error('[AgentMail] Failed to send onboarding email:', error)
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
    const inbox = await getOrCreateInbox()
    const client = getAgentMailClient()

    const result = await client.post(`/inboxes/${inbox.inboxId}/messages`, {
      to: email,
      subject: 'Your AI Suite Setup is Complete',
      html: generateCompletionEmailHTML(name, workflowRunId),
      text: `Setup Complete!\n\nHi ${name},\n\nCongratulations! Your BankChase AI Suite is now fully configured and ready for production use.\n\nWorkflow ID: ${workflowRunId}\n\nYour system is now live and ready to handle customer interactions with enterprise-grade AI capabilities.\n\nBest regards,\nThe BankChase Team`,
    })

    console.log('[AgentMail] Completion email sent:', { to: email, messageId: result.data?.id })
    
    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error('[AgentMail] Failed to send completion email:', error)
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
    const inbox = await getOrCreateInbox()
    const client = getAgentMailClient()

    const result = await client.post(`/inboxes/${inbox.inboxId}/messages`, {
      to,
      subject,
      html,
      text,
      ...(cc && { cc }),
      ...(bcc && { bcc }),
      ...(replyTo && { reply_to: replyTo }),
    })

    console.log('[AgentMail] Custom email sent:', { to, subject, messageId: result.data?.id })
    
    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error('[AgentMail] Failed to send custom email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

function generateOnboardingEmailHTML(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9fafb;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #0a6fb8;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #0f1a2a;
            margin: 0;
            font-size: 28px;
          }
          .content {
            color: #555;
            margin-bottom: 30px;
          }
          .content p {
            margin: 15px 0;
          }
          .button {
            display: inline-block;
            background-color: #0a6fb8;
            color: white;
            padding: 12px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .features {
            background-color: #f0f9ff;
            border-left: 4px solid #0a6fb8;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .features ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .features li {
            padding: 8px 0;
            color: #333;
          }
          .features li:before {
            content: "✓ ";
            color: #0a6fb8;
            font-weight: bold;
            margin-right: 10px;
          }
          .footer {
            text-align: center;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            color: #999;
            font-size: 12px;
          }
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
            
            <div class="features">
              <ul>
                <li>AI-powered customer interactions</li>
                <li>Enterprise-grade security</li>
                <li>Real-time email notifications</li>
                <li>Automated workflow orchestration</li>
                <li>Production-ready deployment</li>
              </ul>
            </div>
            
            <p>Your onboarding has been initiated. Complete all setup steps in your dashboard to unlock these powerful features.</p>
            
            <p>If you need any assistance, our support team is available 24/7 to help you succeed.</p>
            
            <p>Best regards,<br/>The BankChase Team</p>
          </div>
          
          <div class="footer">
            <p>BankChase | AI-Powered Banking Suite<br/>
            <a href="https://bankchase.app" style="color: #0a6fb8; text-decoration: none;">Visit our website</a></p>
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
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9fafb;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #0a6fb8;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #0f1a2a;
            margin: 0;
            font-size: 28px;
          }
          .success-badge {
            display: inline-block;
            background-color: #d1fae5;
            color: #065f46;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            margin-top: 10px;
          }
          .content {
            color: #555;
            margin-bottom: 30px;
          }
          .content p {
            margin: 15px 0;
          }
          .info-box {
            background-color: #f3f4f6;
            border: 1px solid #e5e7eb;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            font-family: monospace;
            font-size: 12px;
            word-break: break-all;
          }
          .next-steps {
            background-color: #eff6ff;
            border-left: 4px solid #0a6fb8;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .next-steps h3 {
            color: #0a6fb8;
            margin-top: 0;
          }
          .next-steps ol {
            color: #333;
            margin: 10px 0;
            padding-left: 20px;
          }
          .next-steps li {
            margin: 8px 0;
          }
          .footer {
            text-align: center;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Setup Complete!</h1>
            <div class="success-badge">✓ All Systems Active</div>
          </div>
          
          <div class="content">
            <p>Hi ${name},</p>
            
            <p>Congratulations! Your BankChase AI Suite is now fully configured and ready for production use.</p>
            
            <div class="info-box">
              <strong>Workflow ID:</strong><br/>${workflowRunId}
            </div>
            
            <div class="next-steps">
              <h3>Next Steps</h3>
              <ol>
                <li>Access your dashboard to monitor AI interactions</li>
                <li>Configure custom workflows for your use cases</li>
                <li>Set up team members and permissions</li>
                <li>Review security and compliance settings</li>
                <li>Start using AI-powered features in production</li>
              </ol>
            </div>
            
            <p>Your system is now live and ready to handle customer interactions with enterprise-grade AI capabilities.</p>
            
            <p>Questions? Our support team is available 24/7 to assist you.</p>
            
            <p>Best regards,<br/>The BankChase Team</p>
          </div>
          
          <div class="footer">
            <p>BankChase | AI-Powered Banking Suite<br/>
            <a href="https://bankchase.app" style="color: #0a6fb8; text-decoration: none;">Visit our website</a></p>
          </div>
        </div>
      </body>
    </html>
  `
}
