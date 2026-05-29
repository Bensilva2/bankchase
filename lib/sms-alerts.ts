import crypto from 'crypto'

export type SMSProvider = 'twilio' | 'infobip'

export interface SMSAlert {
  phoneNumber: string
  amount: number
  currency: string
  status: 'initiated' | 'completed' | 'failed'
  transactionId: string
  receiverAccount?: string
  failureReason?: string
}

/**
 * Send SMS alert via configured provider
 */
export async function sendSmsAlert(alert: SMSAlert): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  const provider = (process.env.SMS_PROVIDER || 'twilio') as SMSProvider

  try {
    const message = buildAlertMessage(alert)

    switch (provider) {
      case 'twilio':
        return await sendTwilioAlert(alert.phoneNumber, message)
      case 'infobip':
        return await sendInfobipAlert(alert.phoneNumber, message)
      default:
        return {
          success: false,
          error: `Unknown SMS provider: ${provider}`
        }
    }
  } catch (error: any) {
    console.error('[v0] SMS alert error:', error)
    return {
      success: false,
      error: error.message || 'Failed to send SMS'
    }
  }
}

/**
 * Build human-readable alert message
 */
function buildAlertMessage(alert: SMSAlert): string {
  const { amount, currency, status, transactionId, receiverAccount, failureReason } = alert

  switch (status) {
    case 'initiated':
      return `Bank Transfer initiated: ${currency} ${amount.toFixed(2)} to ${receiverAccount || 'external account'}. Ref: ${transactionId.slice(0, 8)}`

    case 'completed':
      return `Transfer successful: ${currency} ${amount.toFixed(2)} sent. Ref: ${transactionId.slice(0, 8)}`

    case 'failed':
      return `Transfer failed: ${currency} ${amount.toFixed(2)}. Reason: ${failureReason || 'Unknown'}. Ref: ${transactionId.slice(0, 8)}`

    default:
      return `Transfer update: ${transactionId.slice(0, 8)}`
  }
}

/**
 * Send SMS via Twilio
 */
async function sendTwilioAlert(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: false,
      error: 'Twilio credentials not configured'
    }
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

    const params = new URLSearchParams()
    params.append('To', phoneNumber)
    params.append('From', fromNumber)
    params.append('Body', message)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Twilio API error: ${error}`)
    }

    const data = (await response.json()) as any
    return {
      success: true,
      messageId: data.sid
    }
  } catch (error: any) {
    console.error('[v0] Twilio error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Send SMS via Infobip
 */
async function sendInfobipAlert(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.INFOBIP_API_KEY
  const baseUrl = process.env.INFOBIP_BASE_URL || 'https://api.infobip.com'
  const fromNumber = process.env.INFOBIP_PHONE_NUMBER || 'BankChase'

  if (!apiKey) {
    return {
      success: false,
      error: 'Infobip API key not configured'
    }
  }

  try {
    const url = `${baseUrl}/sms/2/text/advanced`

    const payload = {
      messages: [
        {
          destinations: [{ to: phoneNumber }],
          from: fromNumber,
          text: message
        }
      ]
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `App ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Infobip API error: ${error}`)
    }

    const data = (await response.json()) as any
    const messageId = data.messages?.[0]?.messageId

    return {
      success: true,
      messageId
    }
  } catch (error: any) {
    console.error('[v0] Infobip error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Verify SMS webhook signature (for Twilio)
 */
export function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN || ''

  // Sort params and build data string
  const data = url + Object.keys(params)
    .sort()
    .map(key => key + params[key])
    .join('')

  const hash = crypto
    .createHmac('sha1', authToken)
    .update(data, 'utf-8')
    .digest('base64')

  return hash === signature
}

/**
 * Send bulk SMS alerts
 * Useful for batch notifications
 */
export async function sendBulkSmsAlerts(
  alerts: SMSAlert[]
): Promise<{
  sent: number
  failed: number
  results: Array<{ phoneNumber: string; success: boolean; error?: string }>
}> {
  const results = await Promise.all(
    alerts.map(async (alert) => {
      const result = await sendSmsAlert(alert)
      return {
        phoneNumber: alert.phoneNumber,
        success: result.success,
        error: result.error
      }
    })
  )

  const sent = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  return { sent, failed, results }
}
