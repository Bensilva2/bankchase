import { NextRequest, NextResponse } from 'next/server'

/**
 * Forgot Password API Route
 * Proxies requests to Python backend /auth/forgot-password endpoint
 */

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    const response = await fetch(`${backendUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.detail || 'Failed to process request' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Forgot password proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}
