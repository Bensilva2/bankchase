import { NextRequest, NextResponse } from 'next/server'

/**
 * Signup route that proxies to the Python backend
 * Handles user registration with validation
 */

const PYTHON_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, first_name, last_name } = body

    console.log(`[v0] Signup attempt for email: ${email}`)

    // Validate required fields
    if (!email || !password) {
      console.log('[v0] Missing required fields: email or password')
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Call Python backend
    console.log(`[v0] Forwarding signup request to Python backend: ${PYTHON_API_URL}/auth/signup`)
    const response = await fetch(`${PYTHON_API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        first_name: first_name || '',
        last_name: last_name || '',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[v0] Python backend error:', data)
      return NextResponse.json(
        { error: data.detail || data.message || 'Signup failed' },
        { status: response.status }
      )
    }

    console.log(`[v0] User created successfully: ${data.user_id}`)
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[v0] Signup error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
