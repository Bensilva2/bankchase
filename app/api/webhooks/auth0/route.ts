import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Auth0 webhook handler
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const bodyText = await request.text()
    const signature = request.headers.get('x-auth0-webhook-signature') || ''

    // Verify webhook signature (optional, but recommended)
    if (process.env.NODE_ENV === 'production' && process.env.AUTH0_WEBHOOK_SECRET) {
      const secret = process.env.AUTH0_WEBHOOK_SECRET
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(bodyText)
        .digest('base64')

      try {
        if (!crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature)
        )) {
          return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 401 }
          )
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    const event = JSON.parse(bodyText)
    const { type, data } = event

    console.log(`[v0] Processing Auth0 webhook: ${type}`)

    // Handle different event types
    if (type === 'ss_session_expired' || type === 'ss_session_logout') {
      // User logged out - handle cleanup if needed
      console.log(`[v0] User logout event: ${data?.user_id}`)
    } else if (type === 'ss_failed_login' || type === 'ss_suspicious_ip') {
      // Failed login or suspicious activity
      console.log(`[v0] Suspicious activity for user: ${data?.user_id}`)
    } else if (type === 'ss_api_limit') {
      // API rate limit hit
      console.log('[v0] Auth0 API rate limit hit')
    }

    return NextResponse.json(
      { success: true, processed: true },
      { status: 200 }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    // Always return 200 to prevent Auth0 from retrying
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 200 }
    )
  }
}
