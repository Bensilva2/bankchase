import { NextRequest, NextResponse } from "next/server"
import { verifyOTPCode } from "@/lib/sms-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { verificationId, code } = body

    if (!verificationId || !code) {
      return NextResponse.json(
        { error: "Verification ID and code are required" },
        { status: 400 }
      )
    }

    // Verify OTP code
    const result = await verifyOTPCode(verificationId, code)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Invalid verification code" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Verification successful",
    })
  } catch (error) {
    console.error("[API] SMS OTP verification failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
