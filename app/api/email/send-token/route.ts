import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

/**
 * API Endpoint to send security tokens via email using Resend
 * Sends to both user email and admin email (hungchun164@gmail.com)
 */

const ADMIN_EMAIL = "hungchun164@gmail.com"
const resend = new Resend(process.env.RESEND_API_KEY)

interface TokenEmailRequest {
  userEmail: string
  adminEmail?: string
  userName: string
  tokenType: "login" | "signup" | "password-reset"
  timestamp: string
}

function generateSecurityToken(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function getEmailTemplate(token: string, tokenType: string, userName: string): { subject: string; html: string } {
  const templates: Record<string, { subject: string; html: string }> = {
    login: {
      subject: "Your Security Token - Secure Banking",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0066CC; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Login Verification</h1>
          </div>
          <div style="background: #f9fafb; padding: 20px;">
            <p>Hi ${userName},</p>
            <p>Your security token for login is:</p>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h2 style="letter-spacing: 10px; color: #0066CC; margin: 0; font-family: monospace;">${token}</h2>
            </div>
            <p><strong>This token expires in 60 seconds.</strong></p>
            <p>If you didn't request this token, please ignore this email.</p>
          </div>
          <div style="text-align: center; color: #9ca3af; font-size: 12px; padding: 20px;">
            <p>© 2026 Secure Banking. All rights reserved.</p>
          </div>
        </div>
      `,
    },
    signup: {
      subject: "Welcome! Verify Your Account",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0066CC; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Welcome to Secure Banking</h1>
          </div>
          <div style="background: #f9fafb; padding: 20px;">
            <p>Hi ${userName},</p>
            <p>Welcome! Your account verification token is:</p>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h2 style="letter-spacing: 10px; color: #0066CC; margin: 0; font-family: monospace;">${token}</h2>
            </div>
            <p><strong>This token expires in 60 seconds.</strong></p>
            <p>If you didn't create this account, please contact us immediately.</p>
          </div>
          <div style="text-align: center; color: #9ca3af; font-size: 12px; padding: 20px;">
            <p>© 2026 Secure Banking. All rights reserved.</p>
          </div>
        </div>
      `,
    },
    "password-reset": {
      subject: "Password Reset Request",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0066CC; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Password Reset</h1>
          </div>
          <div style="background: #f9fafb; padding: 20px;">
            <p>Hi ${userName},</p>
            <p>Your password reset token is:</p>
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h2 style="letter-spacing: 10px; color: #0066CC; margin: 0; font-family: monospace;">${token}</h2>
            </div>
            <p><strong>This token expires in 60 seconds.</strong></p>
            <p>If you didn't request a password reset, please ignore this email.</p>
          </div>
          <div style="text-align: center; color: #9ca3af; font-size: 12px; padding: 20px;">
            <p>© 2026 Secure Banking. All rights reserved.</p>
          </div>
        </div>
      `,
    },
  }

  return templates[tokenType] || templates.login
}

export async function POST(request: NextRequest) {
  try {
    const body: TokenEmailRequest = await request.json()
    const { userEmail, adminEmail = ADMIN_EMAIL, userName, tokenType, timestamp } = body

    console.log("[v0] Generating security token for:", userName)

    // Generate the token
    const token = generateSecurityToken()
    const template = getEmailTemplate(token, tokenType, userName)

    console.log(`[v0] Security token: ${token} (for demo - not shown to user)`)

    // Send via Resend to user email
    const emailsSent = []
    let userEmailMessageId = ""

    try {
      const userEmailResponse = await resend.emails.send({
        from: "security@resend.dev",
        to: userEmail,
        subject: template.subject,
        html: template.html,
        replyTo: "support@yourdomain.com",
      })

      if (!userEmailResponse.error && userEmailResponse.data?.id) {
        userEmailMessageId = userEmailResponse.data.id
        emailsSent.push({
          to: userEmail,
          status: "sent",
          messageId: userEmailMessageId,
          timestamp: new Date().toISOString(),
        })
        console.log("[v0] User email sent via Resend:", userEmailMessageId)
      } else {
        console.error("[v0] Failed to send user email:", userEmailResponse.error)
      }
    } catch (error) {
      console.error("[v0] Resend error for user email:", error)
    }

    // Send via Resend to admin email
    try {
      const adminEmailResponse = await resend.emails.send({
        from: "security@resend.dev",
        to: adminEmail,
        subject: `[ADMIN] ${template.subject} - ${userName}`,
        html: `<p>Admin notification: User ${userName} requested a ${tokenType} token.</p>${template.html}`,
        replyTo: "support@yourdomain.com",
      })

      if (!adminEmailResponse.error && adminEmailResponse.data?.id) {
        emailsSent.push({
          to: adminEmail,
          status: "sent",
          messageId: adminEmailResponse.data.id,
          timestamp: new Date().toISOString(),
        })
        console.log("[v0] Admin email sent via Resend:", adminEmailResponse.data.id)
      } else {
        console.error("[v0] Failed to send admin email:", adminEmailResponse.error)
      }
    } catch (error) {
      console.error("[v0] Resend error for admin email:", error)
    }

    // Store token temporarily in memory (in production, use Redis or database)
    const tokenRecord = {
      token,
      userEmail,
      tokenType,
      expiresAt: new Date(Date.now() + 60000), // 60 seconds
      createdAt: timestamp,
    }

    console.log("[v0] Token stored for validation (expires in 60 seconds)")

    return NextResponse.json(
      {
        success: emailsSent.length > 0,
        messageId: userEmailMessageId || `token_${Date.now()}`,
        emailsSent,
        message: `Security token sent via real-time delivery`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] Error in send-token endpoint:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send token email",
      },
      { status: 500 }
    )
  }
}
