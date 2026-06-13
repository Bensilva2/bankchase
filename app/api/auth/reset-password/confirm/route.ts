import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase environment variables not configured')
  }

  return createClient(url, key)
}

/**
 * Hash token with SHA256
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Validate password strength
 */
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain number')
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain special character')
  }

  return { valid: errors.length === 0, errors }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword, confirmPassword } = body

    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Validate password strength
    const validation = validatePassword(newPassword)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Password is too weak', details: validation.errors },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Hash the token
    const hashedToken = hashToken(token)

    // Find and validate reset token
    const { data: resetData, error: resetError } = await supabase
      .from('password_resets')
      .select('id, user_id')
      .eq('token_hash', hashedToken)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (resetError || !resetData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 401 }
      )
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Update user password in transaction
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq('id', resetData.user_id)

    if (updateError) {
      console.error('[v0] Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      )
    }

    // Mark reset token as used
    const { error: markError } = await supabase
      .from('password_resets')
      .update({ used: true })
      .eq('id', resetData.id)

    if (markError) {
      console.error('[v0] Error marking token as used:', markError)
    }

    return NextResponse.json(
      { message: 'Password reset successful. Please log in with your new password.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Password reset confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
