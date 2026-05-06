import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { getUserProfile } from '@/lib/supabase-queries'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 })
  }

  try {
    // Verify the token with Supabase
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user profile
    const profile = await getUserProfile(user.id)

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          roles: profile?.roles,
          demo_balance: profile?.demo_balance,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Token verification error:', error.message)
    return NextResponse.json({ error: 'Verification failed' }, { status: 401 })
  }
}
