import { NextRequest, NextResponse } from 'next/server'
import { getPostHogClient } from '@/lib/posthog-server'

export async function POST(request: NextRequest) {
  try {
    const distinctId = request.headers.get('x-posthog-distinct-id')
    if (distinctId) {
      const posthog = getPostHogClient()
      posthog.capture({
        distinctId,
        event: 'user_signed_out',
      })
      await posthog.flush()
    }

    return NextResponse.json({
      success: true,
      message: 'Signed out',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Sign-out failed' }, { status: 400 })
  }
}
