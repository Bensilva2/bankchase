import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function generateAccountNumber(): string {
  return Math.random().toString().slice(2, 12).padEnd(10, '0')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('[v0] Missing Supabase credentials')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Create user in Supabase Auth
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !data.user) {
      return NextResponse.json(
        { error: authError?.message || 'Registration failed' },
        { status: 400 }
      )
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: data.user.id,
          email,
          first_name: firstName || '',
          last_name: lastName || '',
          roles: ['user'],
        },
      ])

    if (profileError) {
      console.error('[v0] Profile creation error:', profileError)
      // Don't fail registration if profile creation fails
    }

    // Create default checking account
    await supabase
      .from('accounts')
      .insert([
        {
          user_id: data.user.id,
          account_type: 'Checking',
          account_number: generateAccountNumber(),
          balance: 0.0,
          is_demo_account: true,
        },
      ])
      .catch((err) => console.error('[v0] Account creation error:', err))

    // Sign in to get session
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !sessionData.session) {
      return NextResponse.json(
        { error: 'Registration successful but login failed' },
        { status: 201 }
      )
    }

    return NextResponse.json(
      {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          first_name: firstName,
          last_name: lastName,
          roles: ['user'],
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[v0] Register error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}

function generateAccountNumber(): string {
  return Math.random().toString().slice(2, 12).padEnd(10, '0')
}
