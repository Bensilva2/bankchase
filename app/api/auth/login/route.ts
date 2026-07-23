import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { withErrorHandler, validateRequiredFields, APIError } from '@/lib/api-error-handler'
import { triggerNotificationEvent } from '@/lib/inngest-events'

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

async function handler(request: NextRequest) {
  console.log('[v0] Login attempt')

  const body = await request.json()
  const { username, password } = body

  // Validate required fields
  validateRequiredFields(body, ['username', 'password'])

  // Validate credentials
  if (username !== DEMO_USER.username || password !== DEMO_USER.password) {
    throw new APIError(401, 'Invalid username or password', 'INVALID_CREDENTIALS')
  }

  // Create session cookie
  const cookieStore = await cookies()
  const userSession = {
    id: DEMO_USER.id,
    email: DEMO_USER.email,
    username: DEMO_USER.username,
    firstName: DEMO_USER.firstName,
    lastName: DEMO_USER.lastName,
    role: DEMO_USER.role,
    emailVerified: DEMO_USER.emailVerified,
  }

  cookieStore.set('auth_user', JSON.stringify(userSession), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

    // Normalize input (trim whitespace, case-insensitive for email)
    const normalizedIdentifier = loginIdentifier.trim().toLowerCase()
    const normalizedUsername = DEFAULT_USER.username.toLowerCase()
    const normalizedEmail = DEFAULT_USER.email.toLowerCase()

    // Check default demo user first
    if (
      (normalizedIdentifier === normalizedUsername || normalizedIdentifier === normalizedEmail) &&
      password === DEFAULT_USER.password
    ) {
      user = DEFAULT_USER
    } else {
      // In production, query database here for other users
      // For now, only demo user is available
      return NextResponse.json(
        { error: 'Invalid email/username or password' },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email/username or password' },
        { status: 401 }
      )
    }

  // Trigger welcome notification event
  try {
    await triggerNotificationEvent({
      userId: DEMO_USER.id,
      type: 'alert',
      title: 'Welcome back!',
      message: `Welcome back, ${DEMO_USER.firstName}!`,
      channels: ['email', 'push'],
    })

    // Create a simple JWT-like token (in production, use proper JWT library)
    const token = Buffer.from(JSON.stringify({
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      iat: Date.now(),
    })).toString('base64')

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          emailVerified: user.email_verified,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Error triggering welcome notification:', error)
  }

  console.log(`[v0] User ${DEMO_USER.username} logged in successfully`)

  return NextResponse.json(
    {
      success: true,
      token,
      user: userSession,
    },
    { status: 200 }
  )
}

export const POST = withErrorHandler(handler)
