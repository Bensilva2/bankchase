import { createClient } from '@supabase/supabase-js'
import { comparePassword, generateToken } from '@/lib/auth'
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
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password required' },
      { status: 400 }
    )
  }

  try {
    const supabase = getSupabase()

    // Get user by email
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1)

    if (queryError || !users || users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const user = users[0]

    // Verify password
    const passwordValid = await comparePassword(password, user.password_hash)

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const tokenObj = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
    })

    return NextResponse.json(
      {
        access_token: tokenObj.token,
        expiresIn: tokenObj.expiresIn,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Login error:', error.message)
    return NextResponse.json(
      { error: 'Login failed - please try again' },
      { status: 500 }
    )
  }
}
