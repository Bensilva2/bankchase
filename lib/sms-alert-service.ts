import { Redis } from '@upstash/redis'

export interface SmsAlert {
  userId: string
  phoneNumber: string
  message: string
  type: 'transfer_initiated' | 'transfer_completed' | 'transfer_failed'
  transactionId: string
  amount?: number
  currency?: string
}

/**
 * Initialize Redis client for SMS queue
 */
function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn('[v0] Upstash Redis not configured')
    return null
  }

  return new Redis({
    url,
    token
  })
}

/**
 * Queue SMS alert for delivery
 * Supports Twilio and Infobip providers
 */
export async function queueSmsAlert(alert: SmsAlert): Promise<boolean> {
  try {
    const redis = getRedisClient()
    if (!redis) {
      console.warn('[v0] Redis not available for SMS queue')
      return false
    }

    const queueKey = 'sms:queue'
    await redis.lpush(queueKey, JSON.stringify({
      ...alert,
      queuedAt: new Date().toISOString()
    }))

    console.log('[v0] SMS alert queued:', { userId: alert.userId, type: alert.type })
    return true
  } catch (error) {
    console.error('[v0] Failed to queue SMS alert:', error)
    return false
  }
}

/**
 * Send SMS via Twilio
 */
export async function sendSmsViaTwilio(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      return {
        success: false,
        error: 'Twilio credentials not configured'
      }
    }

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: fromNumber,
          Body: message
        }).toString()
      }
    )

    const data = await response.json() as any

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Failed to send SMS'
      }
    }

    return {
      success: true,
      sid: data.sid
    }
  } catch (error) {
    console.error('[v0] Twilio SMS error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send SMS via Infobip
 */
export async function sendSmsViaInfobip(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const apiKey = process.env.INFOBIP_API_KEY
    const baseUrl = process.env.INFOBIP_BASE_URL || 'https://api.infobip.com'
    const senderId = process.env.INFOBIP_SENDER_ID || 'BankChase'

    if (!apiKey) {
      return {
        success: false,
        error: 'Infobip API key not configured'
      }
    }

    const response = await fetch(`${baseUrl}/sms/2/text/advanced`, {
      method: 'POST',
      headers: {
        'Authorization': `App ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            destinations: [{ to: phoneNumber }],
            from: senderId,
            text: message
          }
        ]
      })
    })

    const data = await response.json() as any

    if (!response.ok) {
      return {
        success: false,
        error: data.requestError?.serviceException?.message || 'Failed to send SMS'
      }
    }

    const messageId = data.messages?.[0]?.messageId
    return {
      success: true,
      messageId
    }
  } catch (error) {
    console.error('[v0] Infobip SMS error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send SMS using configured provider
 */
export async function sendSms(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const provider = process.env.SMS_PROVIDER || 'twilio'

  if (provider === 'infobip') {
    return sendSmsViaInfobip(phoneNumber, message)
  } else {
    return sendSmsViaTwilio(phoneNumber, message)
  }
}

/**
 * Generate transfer alert message
 */
export function generateTransferAlertMessage(
  type: SmsAlert['type'],
  amount?: number,
  currency?: string,
  reference?: string
): string {
  switch (type) {
    case 'transfer_initiated':
      return `BankChase: Transfer of ${currency} ${amount} initiated. Ref: ${reference}`
    case 'transfer_completed':
      return `BankChase: Your transfer of ${currency} ${amount} has been completed. Ref: ${reference}`
    case 'transfer_failed':
      return `BankChase: Your transfer of ${currency} ${amount} failed. Please retry or contact support. Ref: ${reference}`
    default:
      return 'BankChase: Transaction update'
  }
}

/**
 * Process SMS alerts from queue
 * Typically called by a background worker or cron job
 */
export async function processSmsQueue(): Promise<{
  processed: number
  succeeded: number
  failed: number
}> {
  const redis = getRedisClient()
  if (!redis) {
    return { processed: 0, succeeded: 0, failed: 0 }
  }

  let processed = 0
  let succeeded = 0
  let failed = 0

  try {
    // Process up to 100 messages per run
    for (let i = 0; i < 100; i++) {
      const item = await redis.rpop('sms:queue')
      if (!item) break

      processed++
      const alert = JSON.parse(item as string) as SmsAlert

      const message = generateTransferAlertMessage(
        alert.type,
        alert.amount,
        alert.currency,
        alert.transactionId
      )

      const result = await sendSms(alert.phoneNumber, message)

      if (result.success) {
        succeeded++
        console.log('[v0] SMS sent successfully:', { userId: alert.userId })
      } else {
        failed++
        console.error('[v0] SMS delivery failed:', { userId: alert.userId, error: result.error })
        // Re-queue for retry
        await redis.lpush('sms:queue:failed', JSON.stringify(alert))
      }
    }
  } catch (error) {
    console.error('[v0] SMS queue processing error:', error)
  }

  return { processed, succeeded, failed }
}
