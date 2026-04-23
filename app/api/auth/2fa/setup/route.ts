import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import {
  generateTOTPSecret,
  generateQRCodeURL,
  generateQRCode,
  generateBackupCodes,
  hashBackupCodes,
} from '@/lib/auth/totp-service'
import { TwoFactorNotificationService } from '@/lib/security/2fa-notification-service'

export async function POST(request: NextRequest) {
  try {
    const { email, action, secret, backupCodes } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Action 1: Generate TOTP setup
    if (action === 'generate') {
      const newSecret = generateTOTPSecret()
      const otpauthURL = generateQRCodeURL(newSecret, email)
      const qrCodeURL = await generateQRCode(otpauthURL)
      const newBackupCodes = generateBackupCodes(10)

      return NextResponse.json({
        success: true,
        secret: newSecret,
        qrCode: qrCodeURL,
        backupCodes: newBackupCodes,
        message: 'TOTP setup generated',
      })
    }

    // Action 2: Enable 2FA (save to database)
    if (action === 'enable') {
      if (!secret || !backupCodes || backupCodes.length === 0) {
        return NextResponse.json(
          { error: 'Secret and backup codes are required' },
          { status: 400 }
        )
      }

      // Find user by email
      const { data: users, error: findError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)

      if (findError || !users || users.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      const userId = users[0].id

      // Hash backup codes before storing
      const hashedBackupCodes = hashBackupCodes(backupCodes)

      // Update user with TOTP settings
      const { error: updateError } = await supabase
        .from('users')
        .update({
          totp_secret: secret,
          totp_backup_codes: hashedBackupCodes,
          two_factor_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        )
      }

      // Send 2FA enabled notification via Resend
      await TwoFactorNotificationService.sendTwoFactorEnabled(
        email,
        {
          name: 'Browser',
          os: 'Unknown',
          browser: 'Unknown',
        },
        new Date().toISOString()
      ).catch(err => console.error('[v0] Failed to send 2FA enabled notification:', err))

      return NextResponse.json({
        success: true,
        message: '2FA enabled successfully',
        userId,
        notificationSent: true,
      })
    }

    // Action 3: Disable 2FA
    if (action === 'disable') {
      // Find user by email
      const { data: users, error: findError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)

      if (findError || !users || users.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      const userId = users[0].id

      // Clear TOTP settings
      const { error: updateError } = await supabase
        .from('users')
        .update({
          totp_secret: null,
          totp_backup_codes: null,
          two_factor_enabled: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        )
      }

      // Send 2FA disabled notification via Resend
      await TwoFactorNotificationService.sendTwoFactorDisabled(
        email,
        {
          name: 'Browser',
          os: 'Unknown',
          browser: 'Unknown',
        },
        new Date().toISOString(),
        true
      ).catch(err => console.error('[v0] Failed to send 2FA disabled notification:', err))

      return NextResponse.json({
        success: true,
        message: '2FA disabled successfully',
        notificationSent: true,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[v0] 2FA setup endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
