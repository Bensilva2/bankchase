import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authUserCookie = cookieStore.get('auth_user')
    const authTokenCookie = cookieStore.get('auth_token')

    // Check for authentication
    if (!authUserCookie?.value && !authTokenCookie?.value) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    let user = null
    try {
      if (authUserCookie?.value) {
        user = JSON.parse(authUserCookie.value)
      }
    } catch (e) {
      console.error('Error parsing auth_user cookie:', e)
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid authentication data' },
        { status: 401 }
      )
    }

    // Return verified user data
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Verify error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
