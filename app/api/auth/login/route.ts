import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password required' },
      { status: 400 }
    )
  }

  try {
    // Single backend call - 5 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }))
      return NextResponse.json(
        { error: error.detail || 'Login failed' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(
      {
        access_token: data.access_token,
        user: data.user,
        is_new_user: data.is_new_user || false,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Login error:', error.message)

    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Login service timeout - please try again' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Login failed - please try again' },
      { status: 500 }
    )
  }
}
