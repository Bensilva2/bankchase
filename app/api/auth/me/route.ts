import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_user')

    if (!authCookie?.value) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    const user = JSON.parse(authCookie.value)

    // Get fresh user data from database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: freshUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!freshUser) {
      // Clear invalid session
      cookieStore.delete('auth_user')
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: freshUser.id,
          email: freshUser.email,
          username: freshUser.username,
          firstName: freshUser.first_name,
          lastName: freshUser.last_name,
          phone: freshUser.phone,
          emailVerified: freshUser.email_verified,
          picture: freshUser.picture,
          auth0_id: freshUser.auth0_id,
        },
        session: { authenticated: true },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
  }
}
