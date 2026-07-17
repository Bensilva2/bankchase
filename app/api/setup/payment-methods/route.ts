import { NextRequest, NextResponse } from 'next/server'
import {
  setupDefaultPaymentMethodDomains,
  getPaymentMethodDomains,
} from '@/lib/payment-method-setup'

/**
 * POST /api/setup/payment-methods
 * Setup payment method domains (Link, Apple Pay, Google Pay)
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[v0] Setting up payment method domains...')

    await setupDefaultPaymentMethodDomains()

    const domains = await getPaymentMethodDomains()

    return NextResponse.json(
      {
        success: true,
        message: 'Payment method domains setup complete',
        domains,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Payment method setup error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to setup payment method domains',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/setup/payment-methods
 * Get registered payment method domains
 */
export async function GET(req: NextRequest) {
  try {
    const domains = await getPaymentMethodDomains()

    return NextResponse.json(
      {
        success: true,
        domains,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Error fetching payment method domains:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch payment method domains',
      },
      { status: 500 }
    )
  }
}
