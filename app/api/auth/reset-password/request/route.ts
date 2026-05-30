import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase environment variables not configured')
  }

  return createClient(url, key)
}

/**
 * Generate secure random token
 */
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Hash token with SHA256
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Check if user exists (but don't reveal it)
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    // Always return success to prevent email enumeration
    if (!userData) {
      return NextResponse.json(
        { message: 'If an account exists, a password reset link has been sent.' },
        { status: 200 }
      )
    }

    // Generate secure token
    const rawToken = generateSecureToken()
    const hashedToken = hashToken(rawToken)

    // Set expiration to 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    // Save hashed token to database
    const { error: insertError } = await supabase
      .from('password_resets')
      .insert({
        user_id: userData.id,
        token_hash: hashedToken,
        expires_at: expiresAt,
        used: false,
      })

    if (insertError) {
      console.error('[v0] Error saving reset token:', insertError)
      return NextResponse.json(
        { message: 'If an account exists, a password reset link has been sent.' },
        { status: 200 }
      )
    }

    // In production, send this via email with reset link containing rawToken
    // For now, log it for testing
    console.log(`[v0] Password reset token for ${email}: ${rawToken}`)

    return NextResponse.json(
      { message: 'If an account exists, a password reset link has been sent.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Password reset request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
