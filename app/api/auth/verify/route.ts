import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase environment variables not configured')
  }

  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_user')

    if (!authCookie?.value) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = JSON.parse(authCookie.value)

    // Get fresh user data from database
    const supabase = getSupabase()
    const { data: freshUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error || !freshUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: freshUser.id,
          username: freshUser.username,
          email: freshUser.email,
          firstName: freshUser.first_name,
          lastName: freshUser.last_name,
          phone: freshUser.phone,
          ssn: freshUser.ssn,
          dateOfBirth: freshUser.date_of_birth,
          address: freshUser.address,
          city: freshUser.city,
          state: freshUser.state,
          zipCode: freshUser.zip_code,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
