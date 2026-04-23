import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyTOTP } from '@/lib/auth/totp-service'

export async function POST(request: NextRequest) {
  try {
    const { email, code, sessionToken, isBackupCode } = await request.json()

    if (!email || !code || !sessionToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get user with TOTP secret
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, totp_secret, backup_codes, two_factor_enabled')
      .eq('email', email)
      .single()

    if (userError || !user || !user.two_factor_enabled) {
      return NextResponse.json(
        { error: 'User not found or 2FA not enabled' },
        { status: 401 }
      )
    }

    if (!user.totp_secret) {
      return NextResponse.json(
        { error: '2FA is not properly configured' },
        { status: 401 }
      )
    }

    let isValid = false

    if (isBackupCode) {
      // Verify backup code
      if (!user.backup_codes) {
        return NextResponse.json(
          { error: 'No backup codes available' },
          { status: 401 }
        )
      }

      const backupCodes = JSON.parse(user.backup_codes)
      const codeIndex = backupCodes.indexOf(code.toUpperCase())

      if (codeIndex === -1) {
        return NextResponse.json(
          { error: 'Invalid backup code' },
          { status: 401 }
        )
      }

      isValid = true

      // Remove used backup code
      backupCodes.splice(codeIndex, 1)
      await supabase
        .from('users')
        .update({ backup_codes: JSON.stringify(backupCodes) })
        .eq('id', user.id)
    } else {
      // Verify TOTP code
      isValid = verifyTOTP(user.totp_secret, code)
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid code' },
        { status: 401 }
      )
    }

    // Update session with 2FA verified flag
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .update({ two_factor_verified: true, updated_at: new Date().toISOString() })
      .eq('token', sessionToken)
      .select()
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '2FA verification successful',
    })
  } catch (error) {
    console.error('[v0] Login 2FA verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
