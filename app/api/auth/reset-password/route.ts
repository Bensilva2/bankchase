import { NextRequest, NextResponse } from 'next/server'

/**
 * Reset Password API Route
 * Proxies requests to Python backend /auth/reset-password endpoint
 */

export async function POST(request: NextRequest) {
  try {
    const { token, new_password } = await request.json()

    if (!token || !new_password) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      )
    }

    if (new_password.length < 12) {
      return NextResponse.json(
        { error: 'Password must be at least 12 characters' },
        { status: 400 }
      )
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    const response = await fetch(`${backendUrl}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        token, 
        new_password 
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.detail || 'Failed to reset password' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Reset password proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
