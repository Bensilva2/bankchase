import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' })

  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (error) {
    // Demo-only sessions and unconfigured preview auth can still be cleared below.
    console.warn('[v0] Supabase logout skipped:', error)
  }

  for (const name of ['demo_auth', 'auth_user', 'auth_token', 'access_token', 'sb-access-token', 'sb-auth-token']) {
    response.cookies.set(name, '', { expires: new Date(0), path: '/' })
  }

  return response
}
