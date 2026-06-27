import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Demo credentials for testing
const DEMO_USER = {
  id: 'demo_user_1',
  email: 'demo@bankchase.com',
  password: 'DemoPassword123!',
  name: 'Demo User',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check against demo credentials
    if (email === DEMO_USER.email && password === DEMO_USER.password) {
      // Valid credentials - set auth cookie
      const cookieStore = await cookies()
      cookieStore.set('auth_token', JSON.stringify({
        id: DEMO_USER.id,
        email: DEMO_USER.email,
        name: DEMO_USER.name,
        loginTime: new Date().toISOString(),
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      // Create a JWT-like token
      const token = Buffer.from(JSON.stringify({
        sub: DEMO_USER.id,
        email: DEMO_USER.email,
        name: DEMO_USER.name,
        iat: Date.now(),
      })).toString('base64')

      return NextResponse.json(
        {
          success: true,
          token,
          user: {
            id: DEMO_USER.id,
            email: DEMO_USER.email,
            name: DEMO_USER.name,
          },
          data: {
            user: {
              id: DEMO_USER.id,
              email: DEMO_USER.email,
              name: DEMO_USER.name,
            },
          },
          message: 'Signed in successfully',
        },
        { status: 200 }
      )
    }

    // Invalid credentials
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    )
  } catch (error) {
    console.error('[v0] Sign-in error:', error)
    return NextResponse.json(
      { error: 'Failed to sign in' },
      { status: 500 }
    )
  }
}
