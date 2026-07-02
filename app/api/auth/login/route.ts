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

  // Create auth token
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

  // Trigger welcome notification event
  try {
    await triggerNotificationEvent({
      userId: DEMO_USER.id,
      type: 'alert',
      title: 'Welcome back!',
      message: `Welcome back, ${DEMO_USER.firstName}!`,
      channels: ['email', 'push'],
    })
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
