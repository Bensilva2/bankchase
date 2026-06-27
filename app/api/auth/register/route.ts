import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
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

    const userId = 'user-' + Math.random().toString(36).substr(2, 9)
    const username = email.split('@')[0] + Math.random().toString(36).substr(2, 5)

    const newUser = {
      id: userId,
      email,
      username,
      firstName: firstName || 'User',
      lastName: lastName || '',
      role: 'customer',
      emailVerified: true,
    }

    // Create session cookie
    const cookieStore = await cookies()
    cookieStore.set('auth_user', JSON.stringify(newUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    // Create a simple JWT-like token
    const token = Buffer.from(JSON.stringify({
      sub: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
      iat: Date.now(),
    })).toString('base64')

    return NextResponse.json(
      {
        success: true,
        token,
        user: newUser,
        message: 'Registration successful.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
