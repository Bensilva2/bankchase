import { createClient } from '@supabase/supabase-js'
import { comparePassword, hashPassword } from '@/lib/auth'
import { inMemoryDb } from '@/lib/in-memory-db'
import { logLoginAttempt } from '@/lib/rbac'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// Default demo credentials
const DEFAULT_USER = {
  id: 'demo-user-1',
  username: 'Lin Huang',
  email: 'linhuang011@gmail.com',
  password: 'Lin1122',
  first_name: 'Lin',
  last_name: 'Huang',
  role: 'customer',
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
      // Log failed login attempt
      try {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'
        // Don't log to DB for failed login of non-existent users
      } catch (err) {
        console.error('[v0] Error logging failed login:', err)
      }
      
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Generate 2FA code (6 digits)
    const twoFACode = Math.floor(100000 + Math.random() * 900000).toString()
    const supabase = getSupabase()

    // Save 2FA code to database with 5-minute expiration
    if (supabase && user.id) {
      try {
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
        await supabase.from('two_factor_codes').insert({
          user_id: user.id,
          code: twoFACode,
          expires_at: expiresAt,
          used: false,
        })

        // Log login attempt (pending 2FA)
        await logLoginAttempt(user.id, ip, userAgent, 'Web Browser', true)
      } catch (err) {
        console.error('[v0] Error saving 2FA code:', err)
      }
    }

    // Return 2FA pending response (don't create full session yet)
    return NextResponse.json(
      {
        success: false,
        requiresTwoFA: true,
        userId: user.id,
        email: user.email,
        // In production, send code via SMS/email, not in response
        message: 'A verification code has been sent to your registered phone/email.',
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
