import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  verifyTOTPCode,
  verifyBackupCodeAgainstHash,
} from '@/lib/auth/totp-service'

export async function POST(request: NextRequest) {
  try {
    const { email, code, secret, action } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      )
    }

    // Validate code format
    if (!/^\d{6}$/.test(code) && !code.includes('-')) {
      return NextResponse.json(
        { error: 'Invalid code format' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Action 1: Verify during setup
    if (action === 'verify-setup') {
      if (!secret) {
        return NextResponse.json(
          { error: 'Secret is required for verification' },
          { status: 400 }
        )
      }

      // Verify TOTP code
      const isValid = verifyTOTPCode(secret, code)

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Code verified successfully',
      })
    }

    // Action 2: Verify during login
    if (action === 'verify-login') {
      // Find user by email
      const { data: users, error: findError } = await supabase
        .from('users')
        .select('id, totp_secret, two_factor_enabled')
        .eq('email', email)

      if (findError || !users || users.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      const user = users[0]

      // Check if 2FA is enabled
      if (!user.two_factor_enabled || !user.totp_secret) {
        return NextResponse.json(
          { error: '2FA not enabled for this account' },
          { status: 400 }
        )
      }

      // Verify TOTP code
      const isValid = verifyTOTPCode(user.totp_secret, code)

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Code verified successfully',
        userId: user.id,
      })
    }

    // Action 3: Verify backup code
    if (action === 'verify-backup') {
      // Find user by email
      const { data: users, error: findError } = await supabase
        .from('users')
        .select('id, totp_backup_codes, two_factor_enabled')
        .eq('email', email)

      if (findError || !users || users.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      const user = users[0]

      // Check if 2FA is enabled
      if (!user.two_factor_enabled || !user.totp_backup_codes) {
        return NextResponse.json(
          { error: '2FA not enabled for this account' },
          { status: 400 }
        )
      }

      // Verify backup code
      const isValid = verifyBackupCodeAgainstHash(code, user.totp_backup_codes)

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid backup code' },
          { status: 401 }
        )
      }

      // TODO: In production, mark this backup code as used
      // For now, just verify it exists

      return NextResponse.json({
        success: true,
        message: 'Backup code verified successfully',
        userId: user.id,
        warning: 'This backup code can only be used once. Update your backup codes after use.',
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[v0] 2FA verify endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
