import { NextRequest, NextResponse } from "next/server"
import { sendOTPVerification } from "@/lib/sms-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber } = body

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      )
    }

    // Clean phone number format
    const cleanPhone = phoneNumber.replace(/[^+\d]/g, "")

    // Send OTP via SMS
    const result = await sendOTPVerification(cleanPhone)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send verification code" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      verificationId: result.verificationId,
      message: "Verification code sent successfully",
    })
  } catch (error) {
    console.error("[API] SMS OTP request failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
