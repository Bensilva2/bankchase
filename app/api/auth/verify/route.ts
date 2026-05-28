import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 })
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.admin.getUserById(
      token.split('.')[0].replace(/[^a-zA-Z0-9-_]/g, '')
    )

    if (error || !user) {
      // Try to get user from current session
      const anonSupabase = createClient(
        supabaseUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      )
      const { data: { user: authUser }, error: authError } = await anonSupabase.auth.getUser(token)

      if (authError || !authUser) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      return NextResponse.json(
        {
          user: {
            id: authUser.id,
            email: authUser.email,
            first_name: profile?.first_name,
            last_name: profile?.last_name,
            roles: profile?.roles || ['user'],
          },
        },
        { status: 200 }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          roles: profile?.roles || ['user'],
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Token verification error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 401 })
  }
}
