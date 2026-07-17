import { NextRequest, NextResponse } from 'next/server'
import { createAccountLink } from '@/lib/stripe-connect-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { stripeAccountId } = body

    if (!stripeAccountId) {
      return NextResponse.json(
        { error: 'Missing required field: stripeAccountId' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const refreshUrl = `${baseUrl}/dashboard/account/onboarding`
    const returnUrl = `${baseUrl}/dashboard/account/onboarding-complete`

    const onboardingUrl = await createAccountLink(stripeAccountId, refreshUrl, returnUrl)

    console.log('[v0] Onboarding URL generated:', stripeAccountId)

    return NextResponse.json({ onboardingUrl }, { status: 200 })
  } catch (error) {
    console.error('[v0] Onboarding link error:', error)
    return NextResponse.json(
      { error: 'Failed to create onboarding link' },
      { status: 500 }
    )
  }
}
