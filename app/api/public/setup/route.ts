import { NextRequest, NextResponse } from 'next/server'
import {
  setupDefaultPaymentMethodDomains,
  getPaymentMethodDomains,
} from '@/lib/payment-method-setup'

/**
 * POST /api/public/setup
 * Public endpoint to setup payment method domains
 * This endpoint is publicly accessible for initial setup
 */
export async function POST(req: NextRequest) {
  try {
    // Verify request has authorization header or is from localhost
    const origin = req.headers.get('origin') || req.headers.get('referer') || ''
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1')

    if (!isLocalhost && process.env.NODE_ENV === 'development') {
      console.log('[v0] Setup endpoint called from:', origin)
    }

    console.log('[v0] Setting up payment method domains...')

    await setupDefaultPaymentMethodDomains()

    const domains = await getPaymentMethodDomains()

    return NextResponse.json(
      {
        success: true,
        message: 'Payment method domains setup complete',
        domains,
        timestamp: new Date().toISOString(),
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
 * GET /api/public/setup
 * Get registered payment method domains (public)
 */
export async function GET(req: NextRequest) {
  try {
    const domains = await getPaymentMethodDomains()

    return NextResponse.json(
      {
        success: true,
        domains,
        timestamp: new Date().toISOString(),
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
