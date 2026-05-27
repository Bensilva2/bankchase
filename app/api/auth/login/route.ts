import { createClient } from '@supabase/supabase-js'
import { comparePassword } from '@/lib/auth'
import { otpService } from '@/lib/otp-service'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase environment variables not configured')
  }

  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, otpCode } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const supabase = getSupabase()
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // If OTP code provided, verify it
    if (otpCode) {
      const isValidOTP = await otpService.verifyOTP(email, otpCode)

      if (!isValidOTP) {
        return NextResponse.json(
          { error: 'Invalid or expired OTP' },
          { status: 401 }
        )
      }

      // OTP verified, mark email as verified
      await supabase
        .from('users')
        .update({ email_verified: true })
        .eq('id', user.id)

      // Create session
      const cookieStore = await cookies()
      cookieStore.set('auth_user', JSON.stringify({
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role || 'viewer',
        emailVerified: true,
      }), { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })

      return NextResponse.json(
        {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role || 'viewer',
            emailVerified: true,
          },
          session: { authenticated: true },
        },
        { status: 200 }
      )
    }

    // Password required if OTP not provided
    if (!password) {
      return NextResponse.json(
        { error: 'Password or OTP is required' },
        { status: 400 }
      )
    }

    // Compare passwords
    const passwordMatch = await comparePassword(password, user.password_hash || '')

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if email verified, if not send OTP
    if (!user.email_verified) {
      try {
        await otpService.createOTP(email)
        return NextResponse.json(
          {
            success: false,
            requiresOTP: true,
            message: 'OTP sent to email, please verify',
          },
          { status: 200 }
        )
      } catch (err) {
        console.error('Failed to create OTP:', err)
        return NextResponse.json(
          { error: 'Failed to send OTP' },
          { status: 500 }
        )
      }
    }

    // Create session
    const cookieStore = await cookies()
    cookieStore.set('auth_user', JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role || 'viewer',
      emailVerified: user.email_verified,
    }), { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role || 'viewer',
          emailVerified: user.email_verified,
        },
        session: { authenticated: true },
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
