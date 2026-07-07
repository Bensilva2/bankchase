import { NextRequest, NextResponse } from 'next/server'
import { createPaymentIntent } from '@/lib/payment-service'
import { sendTransactionNotification, sendPaymentConfirmation } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { senderName, senderEmail, recipientName, recipientEmail, amount, currency, description } = body

    console.log('[v0] Payment request received:', { recipientEmail, amount })

    // Validate input
    if (!senderName || !senderEmail || !recipientName || !recipientEmail || !amount || !currency || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate amount
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 10000) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Create payment intent with Stripe
    const paymentResult = await createPaymentIntent({
      amount: parsedAmount,
      currency,
      description,
      senderEmail,
      senderName,
      recipientEmail,
      recipientName,
    })

    if (!paymentResult.success || !paymentResult.paymentIntentId) {
      console.error('[v0] Payment intent creation failed:', paymentResult.error)
      return NextResponse.json(
        { success: false, error: paymentResult.message },
        { status: 400 }
      )
    }

    const transactionId = paymentResult.paymentIntentId

    // Send transaction notification to recipient
    try {
      await sendTransactionNotification({
        recipientName,
        recipientEmail,
        senderName,
        amount: parsedAmount,
        currency,
        description,
        transactionId,
        timestamp: new Date(),
      })
      console.log('[v0] Transaction notification sent to recipient')
    } catch (emailError) {
      console.error('[v0] Failed to send recipient notification:', emailError)
      // Continue even if email fails
    }

    // Send confirmation to sender
    try {
      await sendPaymentConfirmation({
        recipientName,
        recipientEmail,
        senderName,
        amount: parsedAmount,
        currency,
        description,
        transactionId,
        timestamp: new Date(),
      })
      console.log('[v0] Confirmation notification sent to sender')
    } catch (emailError) {
      console.error('[v0] Failed to send sender confirmation:', emailError)
      // Continue even if email fails
    }

    console.log('[v0] Payment processed successfully:', transactionId)

    return NextResponse.json({
      success: true,
      transactionId,
      message: 'Payment processed successfully. Confirmation emails have been sent.',
      paymentIntentId: transactionId,
      status: paymentResult.status,
    })
  } catch (error) {
    console.error('[v0] Payment API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process payment',
      },
      { status: 500 }
    )
  }
}
