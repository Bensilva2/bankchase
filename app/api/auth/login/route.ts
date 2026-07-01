import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Demo user credentials - Username-based authentication
const DEMO_USER = {
  id: 'demo-user-1',
  username: 'Lin Huang',
  email: 'linhuang011@gmail.com',
  password: 'Lin1122',
  firstName: 'Lin',
  lastName: 'Huang',
  role: 'customer',
  emailVerified: true,
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Validate credentials
    if (username !== DEMO_USER.username || password !== DEMO_USER.password) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Create session cookie
    const cookieStore = await cookies()
    cookieStore.set('auth_user', JSON.stringify({
      id: DEMO_USER.id,
      email: DEMO_USER.email,
      username: DEMO_USER.username,
      firstName: DEMO_USER.firstName,
      lastName: DEMO_USER.lastName,
      role: DEMO_USER.role,
      emailVerified: DEMO_USER.emailVerified,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    // Also set token for compatibility with auth-context
    const token = Buffer.from(JSON.stringify({
      id: DEMO_USER.id,
      username: DEMO_USER.username,
      email: DEMO_USER.email,
      iat: Math.floor(Date.now() / 1000),
    })).toString('base64')

    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: DEMO_USER.id,
          email: DEMO_USER.email,
          username: DEMO_USER.username,
          firstName: DEMO_USER.firstName,
          lastName: DEMO_USER.lastName,
          role: DEMO_USER.role,
          emailVerified: DEMO_USER.emailVerified,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
