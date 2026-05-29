import { createClient } from '@supabase/supabase-js'
import { hashPassword, validatePassword } from '@/lib/auth'
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
    const { email, password, firstName, lastName, phone } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Password is too weak', details: passwordValidation.errors },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Generate username from email
    const username = email.split('@')[0] + Math.random().toString(36).substr(2, 9)

    // Create user with 'customer' role (regular user, not admin)
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          email,
          username,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          phone,
          email_verified: false,
          role: 'customer', // Regular users get 'customer' role, strictly isolated
        },
      ])
      .select()
      .single()

    if (createError || !newUser) {
      console.error('User creation error:', createError)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create default checking account with $0.00 balance
    try {
      await supabase
        .from('accounts')
        .insert([
          {
            user_id: newUser.id,
            account_type: 'Checking',
            account_number: generateAccountNumber(),
            routing_number: '021000021',
            balance: 0.00,
            bank_name: 'Chase Bank',
            is_external: false,
          },
        ])
    } catch (err) {
      console.error('Account creation error:', err)
    }

    // Send OTP for email verification
    try {
      await otpService.createOTP(email)
    } catch (err) {
      console.error('Failed to send OTP:', err)
      // Don't fail registration if OTP fails
    }

    // Create temporary session cookie
    const cookieStore = await cookies()
    cookieStore.set('auth_user', JSON.stringify({
      id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: 'customer',
          emailVerified: false,
        }), {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour for OTP verification
    })

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: 'customer',
          emailVerified: false,
        },
        message: 'Registration successful. Please verify your email with the OTP sent.',
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

function generateAccountNumber(): string {
  return Math.random().toString().slice(2, 12).padEnd(10, '0')
}
