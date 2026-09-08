import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const demoAuth = cookieStore.get('demo_auth')?.value
    if (demoAuth === 'admin' || demoAuth === 'customer') {
      const isAdmin = demoAuth === 'admin'
      return NextResponse.json({
        user: {
          id: isAdmin ? 'demo-admin-1' : 'demo-user-1',
          email: isAdmin ? 'admin@bankchase.local' : 'linhuang011@gmail.com',
          user_metadata: { username: isAdmin ? 'admin@bankchase.local' : 'Lin Huang', firstName: isAdmin ? 'Admin' : 'Lin', lastName: isAdmin ? 'User' : 'Huang' },
          app_metadata: { role: isAdmin ? 'admin' : 'customer' },
        },
        session: { access_token: isAdmin ? 'demo-session' : null },
      })
    }

    const supabase = await createClient()
    const [{ data: userData, error: userError }, { data: sessionData }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getSession(),
    ])

    if (userError || !userData.user) {
      return NextResponse.json({ user: null, session: null })
    }

    return NextResponse.json(
      { user: userData.user, session: sessionData.session },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  } catch (error) {
    // Missing preview configuration must behave like an anonymous session,
    // not a server error that can trap the client in an auth redirect loop.
    console.warn('[v0] Session fetch unavailable:', error)
    return NextResponse.json({ user: null, session: null })
  }
}
