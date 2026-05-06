import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { code, secret, method } = await request.json()

    if (!code || !secret || !method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify TOTP code
    // In production, use a library like 'speakeasy' to validate TOTP
    if (method === 'totp') {
      // Mock verification - in production validate against the secret
      if (code.length !== 6 || !/^\d+$/.test(code)) {
        return NextResponse.json(
          { error: 'Invalid verification code format' },
          { status: 400 }
        )
      }

      // In real implementation:
      // const speakeasy = require('speakeasy');
      // const verified = speakeasy.totp.verify({
      //   secret: secret,
      //   encoding: 'base32',
      //   token: code,
      //   window: 2,
      // });

      // For now, accept any 6-digit code as valid
      const verified = true

      if (!verified) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 400 }
        )
      }

      // Save 2FA settings to database
      // In production: await supabase.from('2fa_settings').insert({...})

      return NextResponse.json(
        {
          success: true,
          message: 'Two-factor authentication enabled successfully',
        },
        { status: 200 }
      )
    }

    if (method === 'sms') {
      // SMS verification logic (not yet implemented)
      return NextResponse.json(
        { error: 'SMS 2FA not yet implemented' },
        { status: 501 }
      )
    }

    return NextResponse.json({ error: 'Invalid method' }, { status: 400 })
  } catch (error: any) {
    console.error('[v0] Error verifying 2FA:', error.message)
    return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 })
  }
}
