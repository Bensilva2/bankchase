import crypto from 'crypto'

/**
 * Verify webhook signature using HMAC-SHA256
 * Prevents spoofing and ensures authenticity of payment provider callbacks
 */
export function verifyWebhookSignature(
  body: string | Buffer,
  signature: string,
  secret: string
): boolean {
  try {
    // Convert body to string if Buffer
    const bodyString = typeof body === 'string' ? body : body.toString('utf-8')

    // Compute expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyString, 'utf-8')
      .digest('hex')

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('[v0] Webhook signature verification failed:', error)
    return false
  }
}

/**
 * Extract signature from webhook headers
 * Different providers use different header names
 */
export function extractSignature(
  headers: Record<string, string | string[] | undefined>,
  provider: string
): string | null {
  // Normalize header names to lowercase
  const normalizedHeaders = Object.entries(headers).reduce(
    (acc, [key, value]) => {
      acc[key.toLowerCase()] = value
      return acc
    },
    {} as Record<string, string | string[] | undefined>
  )

  // Provider-specific signature headers
  const signatureHeaders: Record<string, string> = {
    twilio: 'x-twilio-signature',
    stripe: 'stripe-signature',
    currencycloud: 'x-currencycloud-signature',
    wise: 'x-wise-signature',
    swift: 'x-swift-signature',
    default: 'x-provider-signature'
  }

  const headerName = signatureHeaders[provider.toLowerCase()] || signatureHeaders.default
  const value = normalizedHeaders[headerName]

  return typeof value === 'string' ? value : Array.isArray(value) ? value[0] : null
}

/**
 * Validate webhook payload structure
 */
export function validateWebhookPayload(payload: any): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!payload) {
    errors.push('Payload is empty')
    return { valid: false, errors }
  }

  // Required fields for payment provider webhook
  const requiredFields = ['event_id', 'transaction_id', 'status']
  for (const field of requiredFields) {
    if (!payload[field]) {
      errors.push(`Missing required field: ${field}`)
    }
  }

  // Status validation
  const validStatuses = ['pending', 'processing', 'completed', 'failed', 'delivered', 'settled']
  if (payload.status && !validStatuses.includes(payload.status)) {
    errors.push(`Invalid status: ${payload.status}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Log webhook for audit trail
 */
export async function logWebhookEvent(
  transactionId: string,
  event: any,
  signature: string,
  verified: boolean
) {
  try {
    console.log('[v0] Webhook event:', {
      transactionId,
      eventId: event.event_id,
      status: event.status,
      timestamp: new Date().toISOString(),
      verified,
      signaturePresent: !!signature
    })

    // TODO: Store webhook log in database for audit trail
    // await supabase.from('webhook_logs').insert({
    //   transaction_id: transactionId,
    //   event_id: event.event_id,
    //   status: event.status,
    //   payload: event,
    //   signature_verified: verified,
    //   created_at: new Date().toISOString()
    // })
  } catch (error) {
    console.error('[v0] Failed to log webhook event:', error)
  }
}

/**
 * Get webhook signing secret for a provider
 */
export function getWebhookSecret(provider: string): string {
  const secrets: Record<string, string> = {
    twilio: process.env.TWILIO_WEBHOOK_SECRET || '',
    stripe: process.env.STRIPE_WEBHOOK_SECRET || '',
    currencycloud: process.env.CURRENCYCLOUD_WEBHOOK_SECRET || '',
    wise: process.env.WISE_WEBHOOK_SECRET || '',
    swift: process.env.SWIFT_WEBHOOK_SECRET || '',
    payment_provider: process.env.PAYMENT_PROVIDER_WEBHOOK_SECRET || ''
  }

  const secret = secrets[provider.toLowerCase()] || secrets.payment_provider
  if (!secret) {
    throw new Error(`Webhook secret not configured for provider: ${provider}`)
  }

  return secret
}
