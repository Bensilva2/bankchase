/**
 * Auth Route Handler - Secure login/signup with password hashing & OTP
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hashPassword, verifyPassword } from '@/lib/auth/password-utils'
import { generateAndStoreOTP, verifyOTP } from '@/lib/auth/otp-service'
import { verifyTOTP } from '@/lib/auth/totp-service'

// POST /api/auth/signup - Create new user account
export async function POST(request: NextRequest) {
  try {
    const { action, email, password, name, otp, userId } = await request.json()

    // Initialize Supabase client
    const supabase = await createClient()

    if (action === 'signup') {
      // Validate password strength
      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        )
      }

      // Hash password
      const hashedPassword = await hashPassword(password)

      // Create user in database
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            email,
            name,
            password_hash: hashedPassword,
            created_at: new Date().toISOString(),
            last_login: null,
            two_factor_enabled: false,
          },
        ])
        .select()

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        message: 'User created successfully',
        userId: data[0]?.id,
      })
    }

    if (action === 'login') {
      // Find user by email
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)

      if (error || !users || users.length === 0) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      const user = users[0]

      // Verify password
      const passwordValid = await verifyPassword(password, user.password_hash)
      if (!passwordValid) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      // Check if TOTP 2FA is enabled
      if (user.two_factor_enabled && user.totp_secret) {
        return NextResponse.json({
          message: 'TOTP verification required',
          userId: user.id,
          requiresTOTP: true,
          requiresOTP: false,
        })
      }

      // Generate OTP
      const otpCode = generateAndStoreOTP(user.id)

      // In production, send via SMS/Email
      console.log(`[v0] OTP sent to ${email}: ${otpCode}`)

      return NextResponse.json({
        message: 'OTP sent',
        userId: user.id,
        requiresOTP: true,
      })
    }

    if (action === 'verify-otp') {
      // Verify OTP code
      const isValid = verifyOTP(userId, otp)

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid or expired OTP' },
          { status: 401 }
        )
      }

      // Update last login
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update login' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Authentication successful',
        userId,
        authenticated: true,
      })
    }

    if (action === 'verify-totp') {
      // Find user
      const { data: users, error } = await supabase
        .from('users')
        .select('totp_secret, backup_codes')
        .eq('id', userId)

      if (error || !users || users.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        )
      }

      const user = users[0]

      if (!user.totp_secret) {
        return NextResponse.json(
          { error: '2FA is not configured' },
          { status: 401 }
        )
      }

      // Verify TOTP code
      const isValid = verifyTOTP(user.totp_secret, otp)

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid TOTP code' },
          { status: 401 }
        )
      }

      // Update last login
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update login' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'TOTP verification successful',
        userId,
        authenticated: true,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[v0] Auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
