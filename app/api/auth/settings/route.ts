import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { hashPassword, verifyPassword, generateOTP } from '@/lib/auth/password-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, setting, value, email } = body

    // Handle authentication settings updates
    if (action === undefined && setting) {
      const supabase = createServiceClient()

      // Find user
      const { data: user, error: findError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (findError || !user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Handle setting-specific updates
      const updateData: any = { updated_at: new Date().toISOString() }

      if (setting === 'loginAlerts') {
        updateData.login_alerts_enabled = value
      } else if (setting === 'sessionTimeout') {
        updateData.session_timeout = value
      } else if (setting === 'biometricEnabled') {
        updateData.biometric_enabled = value
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Settings updated successfully',
      })
    }

    // Handle password reset code sending
    if (action === 'send-reset-code') {
      const code = generateOTP(6)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

      // In production, this would be stored in database and sent via email
      console.log(`[v0] Reset code for ${email}: ${code} (expires at ${expiresAt.toISOString()})`)

      return NextResponse.json({
        success: true,
        message: 'Reset code sent to email',
      })
    }

    // Handle reset code verification
    if (action === 'verify-reset-code') {
      const { code } = body
      // In production, verify against database
      // For demo, we'll accept any 6-digit code
      if (code.length !== 6 || !/^\d+$/.test(code)) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Code verified successfully',
      })
    }

    // Handle password reset
    if (action === 'reset-password') {
      const { newPassword, code } = body

      // Validate password strength
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        )
      }

      // In production, update password in database
      const hashedPassword = await hashPassword(newPassword)
      console.log(`[v0] Password reset for ${email}`)

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully',
      })
    }

    // Handle current password verification
    if (action === 'verify-current') {
      const { password } = body
      // In production, fetch user and verify password
      // For demo, accept any non-empty password
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Password verified',
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[v0] Settings endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
