import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Default demo credentials
const DEFAULT_USER = {
  id: 'demo-user-1',
  username: 'Lin Huang',
  email: 'linhuang011@gmail.com',
  password: 'Lin1122',
  first_name: 'Lin',
  last_name: 'Huang',
  role: 'customer',
  email_verified: true,
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return null
  }

  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, username, password } = body

    const loginIdentifier = email || username
    
    if (!loginIdentifier || !password) {
      return NextResponse.json(
        { error: 'Email/username and password are required' },
        { status: 400 }
      )
    }

    let user = null

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

    // Create session cookie
    const cookieStore = await cookies()
    cookieStore.set('auth_user', JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      emailVerified: user.email_verified,
    }), {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
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
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
