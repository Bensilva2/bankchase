import { NextRequest, NextResponse } from 'next/server'
import { createConnectedAccount } from '@/lib/stripe-connect-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, businessName, userId, commissionRate } = body

    if (!email || !businessName || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: email, businessName, userId' },
        { status: 400 }
      )
    }

    const account = await createConnectedAccount(
      email,
      businessName,
      userId,
      commissionRate || 2.5
    )

    console.log('[v0] Account creation API response:', account.stripeAccountId)

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('[v0] Account creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create connected account' },
      { status: 500 }
    )
  }
}
