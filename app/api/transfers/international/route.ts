import { NextRequest, NextResponse } from "next/server"
import {
  initiateCrossBorderTransfer,
  getExchangeRate,
  calculateTransferFees,
  getEstimatedArrival,
  validateSwiftCode,
  validateIBAN,
  SUPPORTED_CURRENCIES,
} from "@/lib/cross-border-service"
import { sendInternationalTransferUpdate } from "@/lib/sms-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      senderAccountId,
      senderName,
      senderAddress,
      senderCountry,
      recipientName,
      recipientBank,
      recipientBankAddress,
      recipientCountry,
      recipientAccountNumber,
      recipientIBAN,
      swiftBic,
      amount,
      sourceCurrency,
      targetCurrency,
      purpose,
      reference,
      senderPhone, // For SMS alerts
    } = body

    // Validate required fields
    if (!senderAccountId || !recipientName || !recipientBank || 
        !recipientAccountNumber || !swiftBic || !amount || !sourceCurrency) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than zero" },
        { status: 400 }
      )
    }

    // Validate SWIFT code
    const swiftValidation = validateSwiftCode(swiftBic)
    if (!swiftValidation.valid) {
      return NextResponse.json(
        { error: swiftValidation.error },
        { status: 400 }
      )
    }

    // Validate IBAN if provided
    if (recipientIBAN) {
      const ibanValidation = validateIBAN(recipientIBAN)
      if (!ibanValidation.valid) {
        return NextResponse.json(
          { error: ibanValidation.error },
          { status: 400 }
        )
      }
    }

    // Initiate the transfer
    const result = await initiateCrossBorderTransfer({
      senderAccountId,
      senderName: senderName || "Chase Customer",
      senderAddress: senderAddress || "",
      senderCountry: senderCountry || "US",
      recipientName,
      recipientBank,
      recipientBankAddress,
      recipientCountry: recipientCountry || swiftValidation.countryCode || "",
      recipientAccountNumber,
      recipientIBAN,
      swiftBic,
      amount,
      sourceCurrency,
      targetCurrency: targetCurrency || sourceCurrency,
      purpose: purpose || "Personal Transfer",
      reference,
    })

    // Send SMS alert if phone number provided
    if (senderPhone && result.success) {
      await sendInternationalTransferUpdate(senderPhone, {
        amount,
        currency: sourceCurrency,
        recipientName,
        status: "initiated",
        swiftReference: result.swiftReference,
      })
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
      swiftReference: result.swiftReference,
      estimatedArrival: result.estimatedArrival,
      exchangeRate: result.exchangeRate,
      convertedAmount: result.convertedAmount,
      fees: result.fees,
      status: result.status,
    })
  } catch (error) {
    console.error("[API] Cross-border transfer failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET endpoint for exchange rates and fee quotes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const from = searchParams.get("from") || "USD"
    const to = searchParams.get("to") || "EUR"
    const amount = Number.parseFloat(searchParams.get("amount") || "1000")

    switch (action) {
      case "rate":
        const rateInfo = getExchangeRate(from, to)
        return NextResponse.json(rateInfo)

      case "quote":
        const fees = calculateTransferFees(amount, from, to)
        const exchange = getExchangeRate(from, to)
        const arrival = getEstimatedArrival(from, to)
        
        return NextResponse.json({
          amount,
          sourceCurrency: from,
          targetCurrency: to,
          exchangeRate: exchange.rate,
          convertedAmount: Math.round(amount * exchange.rate * 100) / 100,
          fees,
          totalCost: amount + fees.totalFees,
          estimatedArrival: arrival.estimatedDays,
          transferMethod: arrival.method,
        })

      case "currencies":
        return NextResponse.json({
          currencies: SUPPORTED_CURRENCIES,
        })

      case "validate-swift":
        const swift = searchParams.get("code")
        if (!swift) {
          return NextResponse.json(
            { error: "SWIFT code required" },
            { status: 400 }
          )
        }
        return NextResponse.json(validateSwiftCode(swift))

      case "validate-iban":
        const iban = searchParams.get("code")
        if (!iban) {
          return NextResponse.json(
            { error: "IBAN required" },
            { status: 400 }
          )
        }
        return NextResponse.json(validateIBAN(iban))

      default:
        return NextResponse.json({
          availableActions: ["rate", "quote", "currencies", "validate-swift", "validate-iban"],
        })
    }
  } catch (error) {
    console.error("[API] Cross-border GET failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
