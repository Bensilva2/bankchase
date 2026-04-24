import { createClient } from '@supabase/supabase-js'
import { verifyToken, getTokenFromHeader } from '@/lib/auth'
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
    const token = getTokenFromHeader(request.headers.get('Authorization'))

    if (!token) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      )
    }

    // Verify token
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Get fresh user data from database
    let user: any = null
    let dbError: any = null

    try {
      const supabase = getSupabase()
      const { data, error: err } = await supabase
        .from('users')
        .select('*')
        .eq('id', payload.userId)
        .single()

      user = data
      dbError = err
    } catch (err: any) {
      dbError = err
    }

    if (dbError || !user) {
      // If table doesn't exist, return user data from token (JWT is valid)
      if (dbError?.message?.includes('relation')) {
        return NextResponse.json(
          {
            success: true,
            user: {
              id: payload.userId,
              username: payload.username,
              email: payload.email,
              firstName: payload.firstName,
              lastName: payload.lastName,
            },
          },
          { status: 200 }
        )
      }
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          ssn: user.ssn,
          dateOfBirth: user.date_of_birth,
          address: user.address,
          city: user.city,
          state: user.state,
          zipCode: user.zip_code,
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
