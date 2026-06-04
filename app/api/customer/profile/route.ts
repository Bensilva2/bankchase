import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase environment variables not configured')
  }

  return createClient(url, key)
}

/**
 * Extract user ID from JWT token
 */
function extractUserIdFromToken(authHeader?: string): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
    return decoded.userId
  } catch {
    return null
  }
}

/**
 * GET /api/customer/profile - Get current user's profile and account details
 * Only accessible to authenticated customers
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const userId = extractUserIdFromToken(authHeader)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      )
    }

    const supabase = getSupabase()

    // Fetch user profile - STRICTLY ISOLATED by user_id from token
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, phone_number, role, created_at')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Fetch user's account - STRICTLY ISOLATED by user_id from token
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .select('id, account_number, routing_number, account_type, currency, balance, status, created_at')
      .eq('user_id', userId)
      .single()

    if (accountError) {
      console.error('[v0] Error fetching account:', accountError)
      // Account may not exist yet
      return NextResponse.json(
        {
          profile: {
            id: userData.id,
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            phone: userData.phone_number,
            role: userData.role,
            createdAt: userData.created_at,
          },
          account: null,
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        profile: {
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          phone: userData.phone_number,
          role: userData.role,
          createdAt: userData.created_at,
        },
        account: {
          id: accountData.id,
          accountNumber: accountData.account_number,
          routingNumber: accountData.routing_number,
          accountType: accountData.account_type,
          currency: accountData.currency,
          balance: accountData.balance,
          status: accountData.status,
          createdAt: accountData.created_at,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/customer/profile - Update user's own profile
 * Only accessible to authenticated customers
 */
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const userId = extractUserIdFromToken(authHeader)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, phoneNumber } = body

    const supabase = getSupabase()

    // Update only the user's own profile
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError || !updatedUser) {
      console.error('[v0] Profile update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        profile: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          phone: updatedUser.phone_number,
          updatedAt: updatedUser.updated_at,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
