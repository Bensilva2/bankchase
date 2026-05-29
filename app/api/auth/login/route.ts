import { createClient } from '@supabase/supabase-js'
import { comparePassword, hashPassword } from '@/lib/auth'
import { inMemoryDb } from '@/lib/in-memory-db'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Default demo credentials
const DEFAULT_USER = {
  id: 'demo-user-1',
  username: 'Lin Huang',
  email: 'linhuang011@gmail.com',
  password: 'Lin1122',
  first_name: 'Lin',
  last_name: 'Huang',
  role: 'viewer',
  email_verified: true,
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return null // Return null if not configured
  }

  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, username, password } = body

    // Accept either email or username for login
    const loginIdentifier = email || username
    
    if (!loginIdentifier) {
      return NextResponse.json(
        { error: 'Email or username is required' },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    let user = null

    // Check default demo user first
    if (
      (loginIdentifier === DEFAULT_USER.username || loginIdentifier === DEFAULT_USER.email) &&
      password === DEFAULT_USER.password
    ) {
      user = DEFAULT_USER
    }

    // Try Supabase if no match yet
    if (!user) {
      const supabase = getSupabase()
      
      if (supabase) {
        try {
          // Try to find by email first
          let { data: supabaseUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', loginIdentifier)
            .single()
          
          // If not found by email, try by username
          if (!supabaseUser) {
            const result = await supabase
              .from('users')
              .select('*')
              .eq('username', loginIdentifier)
              .single()
            supabaseUser = result.data
          }

          if (supabaseUser && supabaseUser.password_hash) {
            const passwordMatch = await comparePassword(password, supabaseUser.password_hash)
            if (passwordMatch) {
              user = supabaseUser
            }
          }
        } catch (err) {
          console.log('[v0] Supabase query failed, trying in-memory db:', err)
        }
      }
    }

    // Try in-memory database as fallback
    if (!user) {
      const memUser = await inMemoryDb.users.findByEmail(loginIdentifier) ||
                      await inMemoryDb.users.findByUsername(loginIdentifier)
      
      if (memUser && memUser.password_hash) {
        const passwordMatch = await comparePassword(password, memUser.password_hash)
        if (passwordMatch) {
          user = memUser
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Create session cookie
    const cookieStore = await cookies()
    const sessionUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role || 'viewer',
      emailVerified: user.email_verified ?? true,
    }

    cookieStore.set('auth_user', JSON.stringify(sessionUser), { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return NextResponse.json(
      {
        success: true,
        token: `session-${user.id}-${Date.now()}`, // Simple session token
        user: sessionUser,
        session: { authenticated: true },
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
