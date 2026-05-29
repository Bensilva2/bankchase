import { NextRequest, NextResponse } from 'next/server'
import { sendSmsAlert, sendBulkSmsAlerts, type SMSAlert } from '@/lib/sms-alerts'

/**
 * POST /api/sms/alert
 * 
 * Send SMS notification for transfer status
 * Can send single or bulk alerts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if it's a bulk request
    if (Array.isArray(body.alerts)) {
      return await handleBulkAlert(body.alerts)
    }

    // Single alert
    const { phoneNumber, amount, currency, status, transactionId, receiverAccount, failureReason } = body

    if (!phoneNumber || !amount || !currency || !status || !transactionId) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['phoneNumber', 'amount', 'currency', 'status', 'transactionId']
        },
        { status: 400 }
      )
    }

    const alert: SMSAlert = {
      phoneNumber,
      amount: parseFloat(amount.toString()),
      currency,
      status,
      transactionId,
      receiverAccount,
      failureReason
    }

    const result = await sendSmsAlert(alert)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send SMS' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        messageId: result.messageId,
        message: 'SMS alert sent successfully'
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] SMS alert error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send SMS' },
      { status: 500 }
    )
  }
}

/**
 * Handle bulk SMS alert requests
 */
async function handleBulkAlert(alerts: any[]) {
  if (!Array.isArray(alerts) || alerts.length === 0) {
    return NextResponse.json(
      { error: 'alerts array is required and must not be empty' },
      { status: 400 }
    )
  }

  if (alerts.length > 100) {
    return NextResponse.json(
      { error: 'Maximum 100 alerts per request' },
      { status: 400 }
    )
  }

  // Validate and map alerts
  const smsAlerts: SMSAlert[] = alerts.map(alert => {
    if (!alert.phoneNumber || !alert.amount || !alert.currency || !alert.status) {
      throw new Error('Invalid alert structure')
    }

    return {
      phoneNumber: alert.phoneNumber,
      amount: parseFloat(alert.amount.toString()),
      currency: alert.currency,
      status: alert.status,
      transactionId: alert.transactionId || 'UNKNOWN',
      receiverAccount: alert.receiverAccount,
      failureReason: alert.failureReason
    }
  })

  const result = await sendBulkSmsAlerts(smsAlerts)

  return NextResponse.json(
    {
      success: result.failed === 0,
      sent: result.sent,
      failed: result.failed,
      total: alerts.length,
      results: result.results
    },
    { status: result.failed === 0 ? 200 : 207 }
  )
}

/**
 * GET /api/sms/alert (info endpoint)
 */
export async function GET() {
  return NextResponse.json(
    {
      description: 'SMS alert service for bank transfers',
      method: 'POST',
      providers: process.env.SMS_PROVIDER || 'twilio',
      endpoints: {
        single: 'POST /api/sms/alert',
        bulk: 'POST /api/sms/alert (with alerts array)'
      },
      requiredFields: {
        single: ['phoneNumber', 'amount', 'currency', 'status', 'transactionId'],
        bulk: 'Array of objects with above fields'
      },
      validStatuses: ['initiated', 'completed', 'failed'],
      rateLimit: '100 requests per minute'
    },
    { status: 200 }
  )
}
