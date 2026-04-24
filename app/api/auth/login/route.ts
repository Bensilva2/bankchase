import { createClient } from '@supabase/supabase-js'
import { comparePassword, generateToken } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    let userError: any = null

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.eq.${username},email.eq.${username}`)
        .single()

      user = data
      userError = error
    } catch (err: any) {
      // Table doesn't exist
      userError = err
    }

    // If table doesn't exist or user not found
    if (userError || !user) {
      // Check if it's a table not found error
      if (userError?.message?.includes('relation')) {
        return NextResponse.json(
          { error: 'Database not initialized. Please sign up first.' },
          { status: 503 }
        )
      }
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
      role: user.role || 'viewer',
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
