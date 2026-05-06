import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

/**
 * Enroll user for biometric authentication
 * This is the first step - user provides credentials and we prepare for biometric enrollment
 */
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

    const { credentialId, publicKey, counter } = await request.json()

    if (!credentialId || !publicKey) {
      return NextResponse.json({ error: 'Missing credential data' }, { status: 400 })
    }

    // Save biometric credential to database
    // In production: await supabase.from('biometric_credentials').insert({
    //   user_id: user.id,
    //   credential_id: credentialId,
    //   public_key: publicKey,
    //   counter: counter || 0,
    //   created_at: new Date(),
    // })

    // For now, just acknowledge the enrollment
    return NextResponse.json(
      {
        success: true,
        message: 'Biometric credentials enrolled successfully',
        credentialId,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Error enrolling biometric:', error.message)
    return NextResponse.json({ error: 'Failed to enroll biometric' }, { status: 500 })
  }
}

/**
 * GET: Check if user has biometric credentials enrolled
 */
export async function GET(request: NextRequest) {
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

    // In production: const credentials = await supabase
    //   .from('biometric_credentials')
    //   .select()
    //   .eq('user_id', user.id)

    // For demo, return mock data
    const enrolled = false

    return NextResponse.json({ enrolled }, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Error checking biometric status:', error.message)
    return NextResponse.json({ error: 'Failed to check biometric status' }, { status: 500 })
  }
}
