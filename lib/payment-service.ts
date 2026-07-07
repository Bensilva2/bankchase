import Stripe from 'stripe'
import { redis } from '@/lib/redis'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
})

export interface PaymentData {
  amount: number
  currency: string
  description: string
  senderEmail: string
  senderName: string
  recipientEmail: string
  recipientName: string
  recipientPhone?: string
}

export interface PaymentResult {
  success: boolean
  transactionId?: string
  paymentIntentId?: string
  status?: string
  message: string
  error?: string
}

export async function createPaymentIntent(data: PaymentData): Promise<PaymentResult> {
  try {
    console.log('[v0] Creating payment intent for:', data.recipientEmail)

    // Create payment intent with metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100), // Convert to cents
      currency: data.currency.toLowerCase(),
      description: `P2P Transfer from ${data.senderName} to ${data.recipientName}: ${data.description}`,
      metadata: {
        senderEmail: data.senderEmail,
        senderName: data.senderName,
        recipientEmail: data.recipientEmail,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone || '',
        transactionType: 'p2p_transfer',
      },
    })

    console.log('[v0] Payment intent created:', paymentIntent.id)

    // Store transaction metadata in Redis for quick access
    const transactionKey = `transaction:${paymentIntent.id}`
    await redis.setex(
      transactionKey,
      86400, // 24 hours
      JSON.stringify({
        paymentIntentId: paymentIntent.id,
        ...data,
        createdAt: new Date().toISOString(),
        status: paymentIntent.status,
      })
    )

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      message: 'Payment intent created successfully',
    }
  } catch (error) {
    console.error('[v0] Payment intent creation error:', error)
    return {
      success: false,
      message: 'Failed to create payment intent',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function confirmPayment(
  paymentIntentId: string,
  paymentMethodId: string
): Promise<PaymentResult> {
  try {
    console.log('[v0] Confirming payment:', paymentIntentId)

    // Confirm the payment intent with payment method
    const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    })

    console.log('[v0] Payment confirmed:', confirmedIntent.status)

    // Update transaction status in Redis
    const transactionKey = `transaction:${paymentIntentId}`
    const existingData = await redis.get<any>(transactionKey)

    if (existingData) {
      await redis.setex(
        transactionKey,
        86400,
        JSON.stringify({
          ...existingData,
          status: confirmedIntent.status,
          updatedAt: new Date().toISOString(),
        })
      )
    }

    return {
      success: confirmedIntent.status === 'succeeded',
      paymentIntentId: confirmedIntent.id,
      transactionId: confirmedIntent.id,
      status: confirmedIntent.status,
      message:
        confirmedIntent.status === 'succeeded'
          ? 'Payment completed successfully'
          : `Payment status: ${confirmedIntent.status}`,
    }
  } catch (error) {
    console.error('[v0] Payment confirmation error:', error)
    return {
      success: false,
      message: 'Failed to confirm payment',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getPaymentStatus(paymentIntentId: string): Promise<any> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
      created: paymentIntent.created,
    }
  } catch (error) {
    console.error('[v0] Error retrieving payment status:', error)
    return null
  }
}

export async function refundPayment(paymentIntentId: string): Promise<PaymentResult> {
  try {
    console.log('[v0] Initiating refund for:', paymentIntentId)

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
    })

    console.log('[v0] Refund initiated:', refund.id)

    return {
      success: true,
      transactionId: refund.id,
      status: refund.status,
      message: 'Refund initiated successfully',
    }
  } catch (error) {
    console.error('[v0] Refund error:', error)
    return {
      success: false,
      message: 'Failed to initiate refund',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
