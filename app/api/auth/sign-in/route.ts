import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Demo user credentials - matches the main login route
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
    const { username, email, password } = body

    // Accept either username or email as login identifier
    const loginIdentifier = username || email

    if (!loginIdentifier || !password) {
      return NextResponse.json(
        { error: 'Username/email and password are required' },
        { status: 400 }
      )
    }

    // Validate credentials against demo user
    const isValidCredentials =
      (loginIdentifier === DEMO_USER.username || loginIdentifier === DEMO_USER.email) &&
      password === DEMO_USER.password

    if (!isValidCredentials) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
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

    // Also set token for compatibility
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
        message: 'Signed in successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Sign-in error:', error)
    return NextResponse.json(
      { error: 'Failed to sign in' },
      { status: 500 }
    )
  }
}
