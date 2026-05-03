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
  const supabase = getSupabase()
  
  try {
    const body = await request.json()
    const { username, email, password, firstName, lastName, phone, ssn, dateOfBirth, address, city, state, zipCode } = body

    console.log(`[v0] Registration attempt for email: ${email}`)

    // Validate required fields
    if (!username || !email || !password) {
      console.log('[v0] Missing required fields')
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log(`[v0] Invalid email format: ${email}`)
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      console.log(`[v0] Weak password for ${email}: ${passwordValidation.errors.join(', ')}`)
      return NextResponse.json(
        { error: 'Password is too weak', details: passwordValidation.errors },
        { status: 400 }
      )
    }

    // Check if user already exists (crucial check)
    console.log(`[v0] Checking for existing user with email: ${email}`)
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, username')
      .or(`username.eq.${username},email.eq.${email}`)

    if (checkError) {
      console.error('[v0] Error checking existing user:', checkError)
      throw checkError
    }

    if (existingUser && existingUser.length > 0) {
      const existing = existingUser[0]
      let duplicateField = ''
      if (existing.email === email) duplicateField = 'email'
      if (existing.username === username) duplicateField = duplicateField ? 'email and username' : 'username'
      
      console.log(`[v0] Duplicate ${duplicateField} detected`)
      return NextResponse.json(
        { error: `An account with this ${duplicateField} already exists` },
        { status: 409 }
      )
    }

    // Hash password
    console.log(`[v0] Hashing password for ${email}`)
    const passwordHash = await hashPassword(password)

    // Create user in Supabase
    console.log(`[v0] Creating user: ${email}`)
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([
        {
          username,
          email,
          password_hash: passwordHash,
          first_name: firstName || username,
          last_name: lastName || '',
          phone,
          ssn,
          date_of_birth: dateOfBirth,
          address,
          city,
          state,
          zip_code: zipCode,
          role: 'viewer',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (userError) {
      console.error('[v0] User creation failed:', userError)
      return NextResponse.json(
        { error: 'Failed to create user: ' + (userError.message || 'Unknown error') },
        { status: 500 }
      )
    }

    if (!user) {
      console.error('[v0] User creation returned null')
      return NextResponse.json(
        { error: 'Failed to create user: No data returned' },
        { status: 500 }
      )
    }

    console.log(`[v0] User created successfully: ${user.id}`)
    const newUser = user

    // Create default checking account with $0.00 balance
    console.log(`[v0] Creating default checking account for user: ${newUser.id}`)
    const { data: account, error: accountError } = await supabase
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
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (accountError) {
      console.error('[v0] Account creation failed:', accountError)
      // Don't fail the entire registration if account creation fails
      // The user is already created and can access the app
      console.log('[v0] Continuing with registration despite account creation failure')
    } else {
      console.log(`[v0] Account created successfully: ${account?.id}`)
    }

    // Generate JWT token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      role: newUser.role || 'viewer',
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
