import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPostHogClient } from '@/lib/posthog-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create user object with complete profile
    const userId = 'user_' + Math.random().toString(36).substr(2, 9)
    const user = {
      id: userId,
      username: firstName ? `${firstName} ${lastName}`.trim() : email.split('@')[0],
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      role: 'customer',
      emailVerified: false,
      createdAt: new Date().toISOString(),
    }

    // Create token (base64 encoded for compatibility)
    const token = Buffer.from(JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username,
      iat: Math.floor(Date.now() / 1000),
    })).toString('base64')

    // Set auth cookies
    const cookieStore = await cookies()
    cookieStore.set('auth_user', JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    const posthog = getPostHogClient()
    posthog.identify({
      distinctId: user.id,
      properties: {
        role: user.role,
      },
    })
    posthog.capture({
      distinctId: user.id,
      event: 'user_signed_up',
      properties: {
        role: user.role,
        email_verified: user.emailVerified,
      },
    })
    await posthog.flush()

    return NextResponse.json(
      {
        success: true,
        token,
        user,
        message: 'Account created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Sign-up error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
