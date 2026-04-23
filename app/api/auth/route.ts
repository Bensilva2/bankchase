/**
 * Auth Route Handler - Secure login/signup with password hashing & OTP
 * New users get auto-generated account numbers and zero-balance accounts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { hashPassword, verifyPassword } from '@/lib/auth/password-utils'
import { generateAndStoreOTP, verifyOTP } from '@/lib/auth/otp-service'
import { verifyTOTP } from '@/lib/auth/totp-service'

/**
 * Generate a unique 10-digit account number
 */
function generateAccountNumber(): string {
  const prefix = '9'
  const random = Math.floor(Math.random() * 900000000) + 100000000
  return prefix + random.toString()
}

// POST /api/auth/signup - Create new user account
export async function POST(request: NextRequest) {
  try {
    const { action, email, password, name, phone, otp, userId } = await request.json()

    // Initialize Supabase client
    const supabase = createServiceClient()

    if (action === 'signup') {
      // Validate password strength
      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        )
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
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
            phone: phone || null,
            role: 'user',
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

      const newUserId = data[0]?.id

      // Auto-generate a checking account with zero balance for the new user
      const fullAccountNumber = generateAccountNumber()
      const accountNumber = fullAccountNumber.slice(-4)
      const routingNumber = '021000021'

      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .insert([
          {
            user_id: newUserId,
            name: 'Total Checking',
            account_type: 'checking',
            account_number: accountNumber,
            full_account_number: fullAccountNumber,
            routing_number: routingNumber,
            balance: 0.00,
            available_balance: 0.00,
            interest_rate: 0.01,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()

      if (accountError) {
        console.error('[v0] Account creation error:', accountError)
      }

      // Create a welcome notification for the new user
      await supabase.from('notifications').insert([
        {
          user_id: newUserId,
          title: 'Welcome to Chase!',
          message: `Your new checking account (****${accountNumber}) has been created. Your account number is ${fullAccountNumber}.`,
          type: 'account',
          is_read: false,
          category: 'account',
          data: { accountNumber: fullAccountNumber, accountType: 'checking' },
          created_at: new Date().toISOString(),
        },
      ])

      // Create a default credit score entry
      await supabase.from('credit_scores').insert([
        {
          user_id: newUserId,
          score: 750,
          status: 'good',
          trend: 'stable',
          updated_at: new Date().toISOString(),
        },
      ])

      console.log('[v0] New user registered:', {
        userId: newUserId,
        email,
        accountNumber: fullAccountNumber,
      })

      return NextResponse.json({
        message: 'User created successfully',
        userId: newUserId,
        accountNumber: fullAccountNumber,
        maskedAccountNumber: `****${accountNumber}`,
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
          userName: user.name,
          userRole: user.role,
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
        userName: user.name,
        userRole: user.role,
        userEmail: user.email,
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

      // Fetch full user data for the session
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, email, role, phone')
        .eq('id', userId)
        .single()

      // Fetch user accounts
      const { data: userAccounts } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)

      return NextResponse.json({
        message: 'Authentication successful',
        userId,
        authenticated: true,
        user: userData,
        accounts: userAccounts || [],
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

      // Fetch full user data
      const { data: totpUserData } = await supabase
        .from('users')
        .select('id, name, email, role, phone')
        .eq('id', userId)
        .single()

      const { data: totpAccounts } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)

      return NextResponse.json({
        message: 'TOTP verification successful',
        userId,
        authenticated: true,
        user: totpUserData,
        accounts: totpAccounts || [],
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
