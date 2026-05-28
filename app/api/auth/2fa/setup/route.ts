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

    const { method } = await request.json()

    if (!['totp', 'sms'].includes(method)) {
      return NextResponse.json({ error: 'Invalid 2FA method' }, { status: 400 })
    }

    // Generate a random secret for TOTP
    // In production, use a library like 'speakeasy'
    const generateSecret = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
      let result = ''
      for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    const secret = generateSecret()

    // Save temporary 2FA setup (not yet verified)
    // In production, store in database with expiration
    return NextResponse.json(
      {
        secret,
        method,
        qrCodeUrl: `otpauth://totp/Chase:${user.email}?secret=${secret}&issuer=Chase`,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Error setting up 2FA:', error.message)
    return NextResponse.json({ error: 'Failed to setup 2FA' }, { status: 500 })
  }
}
