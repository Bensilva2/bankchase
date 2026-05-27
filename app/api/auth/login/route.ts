import { createClient } from '@supabase/supabase-js'
import { comparePassword, generateToken } from '@/lib/auth'
import { inMemoryDb } from '@/lib/in-memory-db'
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
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find user by username or email
    let user: any = null

    // First, try in-memory database (preferred for development)
    user = await inMemoryDb.users.findByUsername(username)
    if (!user) {
      user = await inMemoryDb.users.findByEmail(username)
    }

    // If not found in memory DB, try Supabase
    if (!user) {
      try {
        const supabase = getSupabase()
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .or(`username.eq.${username},email.eq.${username}`)
          .single()

        if (!error && data) {
          user = data
        }
      } catch (err: any) {
        // Supabase unavailable, continue with memory DB check
        console.warn('[v0] Supabase lookup failed:', err?.message)
      }
    }

    // If still no user found
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Compare passwords
    const passwordMatch = await comparePassword(password, user.password_hash)

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
    })

    return NextResponse.json(
      {
        success: true,
        token: token.token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role || 'viewer',
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
