import { otpService } from '@/lib/otp-service'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    // Verify email exists in database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (!user) {
      // Don't reveal whether email exists for security
      return NextResponse.json(
        { success: true, message: 'If email exists, OTP will be sent' },
        { status: 200 }
      )
    }

    // Create and send OTP
    const { code, expiresAt } = await otpService.createOTP(email)

    return NextResponse.json(
      {
        success: true,
        message: 'OTP sent to email',
        expiresAt,
        // Dev only: remove in production
        ...(process.env.NODE_ENV === 'development' && { code }),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('OTP request error:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
