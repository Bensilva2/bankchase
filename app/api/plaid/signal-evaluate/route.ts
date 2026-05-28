import { NextRequest, NextResponse } from 'next/server'

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID
const PLAID_SECRET = process.env.PLAID_SECRET
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox'

interface SignalEvaluateRequest {
  accessToken: string
  accountId: string
  amount: number
  clientTransactionId: string
  isRecurring?: boolean
  defaultPaymentMethod?: 'SAME_DAY_ACH' | 'STANDARD_ACH' | 'MULTIPLE_PAYMENT_METHODS'
  user?: {
    name?: {
      givenName?: string
      familyName?: string
    }
    phoneNumber?: string
    emailAddress?: string
  }
  device?: {
    ipAddress?: string
    userAgent?: string
  }
}

interface PlaidSignalResponse {
  scores?: {
    customer_initiated_return_risk: {
      score: number
    }
    bank_initiated_return_risk: {
      score: number
    }
  }
  core_attributes?: {
    available_balance: number
    current_balance: number
    [key: string]: any
  }
  ruleset?: {
    ruleset_key: string
    result: 'ACCEPT' | 'REROUTE' | 'REVIEW'
    triggered_rule_details?: {
      internal_note?: string
      custom_action_key?: string
    }
  }
  warnings?: Array<{
    warning_type: string
    warning_code: string
    warning_message: string
  }>
  request_id: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SignalEvaluateRequest = await request.json()

    if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
      return NextResponse.json(
        { error: 'Plaid credentials not configured' },
        { status: 500 }
      )
    }

    const plaidUrl = `https://${PLAID_ENV}.plaid.com/signal/evaluate`

    const signalRequest = {
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      access_token: body.accessToken,
      account_id: body.accountId,
      client_transaction_id: body.clientTransactionId,
      amount: body.amount,
      is_recurring: body.isRecurring || false,
      default_payment_method: body.defaultPaymentMethod || 'STANDARD_ACH',
      user: body.user ? {
        name: body.user.name ? {
          given_name: body.user.name.givenName,
          family_name: body.user.name.familyName,
        } : undefined,
        phone_number: body.user.phoneNumber,
        email_address: body.user.emailAddress,
      } : undefined,
      device: body.device ? {
        ip_address: body.device.ipAddress,
        user_agent: body.device.userAgent,
      } : undefined,
    }

    const response = await fetch(plaidUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signalRequest),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[Plaid Signal Error]', error)
      return NextResponse.json(
        { error: error.error_message || 'Failed to evaluate transaction' },
        { status: response.status }
      )
    }

    const data: PlaidSignalResponse = await response.json()

    // Transform response for frontend
    const riskAssessment = {
      transactionId: body.clientTransactionId,
      customerRisk: data.scores?.customer_initiated_return_risk.score || 0,
      bankRisk: data.scores?.bank_initiated_return_risk.score || 0,
      recommendation: data.ruleset?.result || 'ACCEPT',
      availableBalance: data.core_attributes?.available_balance || 0,
      currentBalance: data.core_attributes?.current_balance || 0,
      warnings: data.warnings || [],
      requestId: data.request_id,
    }

    return NextResponse.json(riskAssessment)
  } catch (error) {
    console.error('[Plaid Signal Evaluate Error]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
