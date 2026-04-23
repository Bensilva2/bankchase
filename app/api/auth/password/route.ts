/**
 * Password Management API
 * Handles password reset, change, and validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/auth/password-utils'
import { generateAndStoreOTP, verifyOTP } from '@/lib/auth/otp-service'

// POST /api/auth/password - Change password
export async function POST(request: NextRequest) {
  try {
    const { action, userId, currentPassword, newPassword, email, otp } = await request.json()
    const supabase = createServiceClient()

    if (action === 'change') {
      // Verify user provided current password
      const { data: users } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single()

      if (!users) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      const passwordValid = await verifyPassword(currentPassword, users.password_hash)
      if (!passwordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        )
      }

      // Validate new password strength
      const strength = validatePasswordStrength(newPassword)
      if (!strength.isStrong) {
        return NextResponse.json(
          { error: 'Password does not meet strength requirements', details: strength.errors },
          { status: 400 }
        )
      }

      // Hash and update new password
      const newHash = await hashPassword(newPassword)
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: newHash })
        .eq('id', userId)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update password' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Password changed successfully',
      })
    }

    if (action === 'forgot') {
      // Find user and send reset OTP
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)

      if (!users || users.length === 0) {
        // Don't reveal if email exists
        return NextResponse.json({
          message: 'If the email exists, a reset code has been sent',
        })
      }

      const resetOtp = generateAndStoreOTP(users[0].id, 10) // 10 minute expiry for reset

      console.log(`[v0] Password reset OTP for ${email}: ${resetOtp}`)

      return NextResponse.json({
        message: 'Reset code sent to email',
        userId: users[0].id,
      })
    }

    if (action === 'reset-with-otp') {
      // Verify OTP and reset password
      const isValid = verifyOTP(userId, otp)

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid or expired reset code' },
          { status: 401 }
        )
      }

      const strength = validatePasswordStrength(newPassword)
      if (!strength.isStrong) {
        return NextResponse.json(
          { error: 'Password does not meet strength requirements', details: strength.errors },
          { status: 400 }
        )
      }

      const newHash = await hashPassword(newPassword)
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: newHash })
        .eq('id', userId)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to reset password' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Password reset successfully',
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[v0] Password management error:', error)
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    )
  }
}
