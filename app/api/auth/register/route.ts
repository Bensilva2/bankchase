import { createClient } from '@supabase/supabase-js'
import { hashPassword, generateToken, validatePassword } from '@/lib/auth'
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
    const { username, email, password, firstName, lastName, phone, ssn, dateOfBirth, address, city, state, zipCode } = body

    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Password is too weak', details: passwordValidation.errors },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    let newUser: any = null
    let userError: any = null

    // Try to create user in Supabase
    try {
      const supabase = getSupabase()

      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .or(`username.eq.${username},email.eq.${email}`)
        .single()

      if (checkError && !checkError.message?.includes('No rows')) {
        throw checkError
      }

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username or email already exists' },
          { status: 409 }
        )
      }

      // Create user
      const { data: user, error } = await supabase
        .from('users')
        .insert([
          {
            username,
            email,
            password_hash: passwordHash,
            first_name: firstName,
            last_name: lastName,
            phone,
            ssn,
            date_of_birth: dateOfBirth,
            address,
            city,
            state,
            zip_code: zipCode,
          },
        ])
        .select()
        .single()

      newUser = user
      userError = error
    } catch (err: any) {
      console.error('Supabase error:', err)
      userError = err
    }

    // If Supabase fails due to table not existing, create user object in memory
    if (userError && userError.message?.includes('relation')) {
      newUser = {
        id: Math.random().toString(36).substr(2, 9),
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        ssn,
        date_of_birth: dateOfBirth,
        address,
        city,
        state,
        zip_code: zipCode,
        created_at: new Date().toISOString(),
      }
    } else if (userError) {
      console.error('User creation error:', userError)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create default checking account with $0.00 balance
    let account: any = null
    let accountError: any = null

    try {
      const { data: acc, error: err } = await supabase
        .from('accounts')
        .insert([
          {
            user_id: newUser.id,
            account_type: 'Checking',
            account_number: generateAccountNumber(),
            routing_number: '021000021',
            balance: 0.00,
            bank_name: 'Chase Bank',
            is_external: false,
          },
        ])
        .select()
        .single()

      account = acc
      accountError = err
    } catch (err: any) {
      console.error('Supabase account error:', err)
      accountError = err
    }

    // If account creation fails due to table not existing, create in memory
    if (accountError && accountError.message?.includes('relation')) {
      account = {
        id: Math.random().toString(36).substr(2, 9),
        user_id: newUser.id,
        account_type: 'Checking',
        account_number: generateAccountNumber(),
        routing_number: '021000021',
        balance: 0.00,
        bank_name: 'Chase Bank',
        is_external: false,
        created_at: new Date().toISOString(),
      }
    } else if (accountError) {
      console.error('Account creation error:', accountError)
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    // Generate JWT token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      role: 'viewer',
    })

    // Also trigger Monday.com integration
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/monday/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newUser.id,
          email: newUser.email,
          fullName: `${firstName || ''} ${lastName || ''}`.trim(),
        }),
      })
    } catch (error) {
      console.error('Monday integration error:', error)
      // Don't fail registration if Monday fails
    }

    return NextResponse.json(
      {
        success: true,
        token: token.token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateAccountNumber(): string {
  return Math.random().toString().slice(2, 12).padEnd(10, '0')
}
