import { NextRequest, NextResponse } from "next/server"
import { sendTransactionAlert, sendWireConfirmation } from "@/lib/sms-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, alertType, data } = body

    if (!phoneNumber || !alertType || !data) {
      return NextResponse.json(
        { error: "Phone number, alert type, and data are required" },
        { status: 400 }
      )
    }

    // Clean phone number format
    const cleanPhone = phoneNumber.replace(/[^+\d]/g, "")

    let result

    switch (alertType) {
      case "transaction":
        result = await sendTransactionAlert(cleanPhone, {
          type: data.type,
          amount: data.amount,
          recipientName: data.recipientName,
          accountLast4: data.accountLast4,
          balance: data.balance,
          reference: data.reference,
        })
        break

      case "wire_confirmation":
        result = await sendWireConfirmation(cleanPhone, {
          amount: data.amount,
          recipientName: data.recipientName,
          recipientBank: data.recipientBank,
          confirmationNumber: data.confirmationNumber,
          estimatedArrival: data.estimatedArrival,
        })
        break

      default:
        return NextResponse.json(
          { error: "Invalid alert type" },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send alert" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Alert sent successfully",
    })
  } catch (error) {
    console.error("[API] SMS alert failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
