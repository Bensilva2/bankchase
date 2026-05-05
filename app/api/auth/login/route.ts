import { NextRequest, NextResponse } from 'next/server'

/**
 * Login proxy route - forwards login requests to Python FastAPI backend
 * The backend handles password verification and token generation
 */

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password required' },
      { status: 400 }
    )
  }

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    const response = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.detail || 'Invalid email or password' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(
      {
        token: data.access_token,
        access_token: data.access_token,
        user: {
          id: data.user_id,
          email: data.email,
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          role: data.role || 'user',
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Login proxy error:', error)
    return NextResponse.json(
      { error: 'Login failed - please try again' },
      { status: 500 }
    )
  }
}
