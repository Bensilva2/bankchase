import { NextRequest, NextResponse } from 'next/server'
import {
  processInstantPayment,
  PAYMENT_RAILS,
  generateTransactionSteps,
  type InstantPaymentRequest,
} from '@/lib/instant-payments-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      senderId,
      recipientId,
      recipientEmail,
      recipientPhone,
      amount,
      currency = 'USD',
      paymentRail = 'zelle',
      memo,
    } = body

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    if (!recipientId && !recipientEmail && !recipientPhone) {
      return NextResponse.json(
        { error: 'Recipient identifier required (id, email, or phone)' },
        { status: 400 }
      )
    }

    // Get payment rail info
    const rail = PAYMENT_RAILS.find((r) => r.id === paymentRail)
    if (!rail) {
      return NextResponse.json(
        { error: `Unsupported payment rail: ${paymentRail}` },
        { status: 400 }
      )
    }

    // Check amount limits
    if (amount > rail.maxAmount) {
      return NextResponse.json(
        {
          error: `Amount exceeds ${rail.name} limit`,
          maxAmount: rail.maxAmount,
        },
        { status: 400 }
      )
    }

    // Process the instant payment
    const paymentRequest: InstantPaymentRequest = {
      senderId: senderId || 'default-user',
      recipientId: recipientId || recipientEmail || recipientPhone,
      amount,
      currency,
      paymentRail,
      memo,
    }

    const result = await processInstantPayment(paymentRequest)

    // Generate tracking steps
    const trackingSteps = generateTransactionSteps(paymentRail)

    return NextResponse.json({
      success: true,
      transaction: {
        ...result,
        paymentRail: rail.name,
        amount,
        currency,
        recipient: recipientId || recipientEmail || recipientPhone,
        memo,
        trackingSteps,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Instant payment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment processing failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Return available payment rails and their info
  return NextResponse.json({
    paymentRails: PAYMENT_RAILS.map((rail) => ({
      id: rail.id,
      name: rail.name,
      description: rail.description,
      maxAmount: rail.maxAmount,
      processingTime: rail.processingTime,
      fees: rail.fees,
      availability: rail.availability,
      countries: rail.countries,
    })),
  })
}
