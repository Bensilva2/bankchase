import { NextRequest, NextResponse } from 'next/server'

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID
const PLAID_SECRET = process.env.PLAID_SECRET
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox'

interface DecisionReportRequest {
  clientTransactionId: string
  initiated: boolean
  decisionOutcome: 'APPROVE' | 'REVIEW' | 'REJECT' | 'TAKE_OTHER_RISK_MEASURES' | 'NOT_EVALUATED'
  paymentMethod?: 'SAME_DAY_ACH' | 'STANDARD_ACH' | 'MULTIPLE_PAYMENT_METHODS'
  daysFundsOnHold?: number
  amountInstantlyAvailable?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: DecisionReportRequest = await request.json()

    if (!PLAID_CLIENT_ID || !PLAID_SECRET) {
      return NextResponse.json(
        { error: 'Plaid credentials not configured' },
        { status: 500 }
      )
    }

    const plaidUrl = `https://${PLAID_ENV}.plaid.com/signal/decision/report`

    const reportRequest = {
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      client_transaction_id: body.clientTransactionId,
      initiated: body.initiated,
      decision_outcome: body.decisionOutcome,
      payment_method: body.paymentMethod,
      days_funds_on_hold: body.daysFundsOnHold,
      amount_instantly_available: body.amountInstantlyAvailable,
    }

    const response = await fetch(plaidUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportRequest),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[Plaid Signal Decision Report Error]', error)
      return NextResponse.json(
        { error: error.error_message || 'Failed to report decision' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      requestId: data.request_id,
    })
  } catch (error) {
    console.error('[Plaid Signal Decision Report Error]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
