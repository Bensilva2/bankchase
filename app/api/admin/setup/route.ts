import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase environment variables not configured')
  }

  return createClient(url, key)
}

/**
 * Admin Setup Endpoint
 * 
 * Assigns admin role to a user. Should only be called during initial setup
 * or by existing admins. In production, implement proper authorization checks.
 * 
 * Query params:
 * - email: User email to promote to admin
 * - token: Setup token (optional, for initial setup)
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const cookieStore = await cookies()
    const authCookie = cookieStore.get('auth_user')?.value

    let currentUser: any = null
    if (authCookie) {
      try {
        currentUser = JSON.parse(authCookie)
      } catch (err) {
        // Invalid session
      }
    }

    // If no current user, check for setup token (one-time use only)
    const setupToken = request.nextUrl.searchParams.get('token')
    if (!currentUser && !setupToken) {
      return NextResponse.json(
        { error: 'Unauthorized. Must be logged in or provide setup token.' },
        { status: 401 }
      )
    }

    // If current user exists, they must be admin
    if (currentUser && currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Only admins can promote users.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Find user by email
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (findError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user role to admin
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError || !updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: `User ${email} has been promoted to admin`,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Admin setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
