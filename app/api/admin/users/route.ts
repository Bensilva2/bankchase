import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { logAdminAction } from '@/lib/rbac'

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
 * Extract and verify admin token
 */
async function verifyAdminToken(
  authHeader?: string
): Promise<{ userId: string; role: string } | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string
      role: string
    }

    // Verify user is actually admin in database
    if (decoded.role !== 'admin') {
      return null
    }

    return decoded
  } catch {
    return null
  }
}

/**
 * GET /api/admin/users - List all users (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const adminUser = await verifyAdminToken(authHeader)

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const supabase = getSupabase()
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Log admin action
    await logAdminAction(
      adminUser.userId,
      'VIEW_ALL_USERS',
      'all_users',
      undefined,
      ip,
      userAgent
    )

    // Fetch all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(
        'id, email, first_name, last_name, role, created_at, updated_at'
      )
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('[v0] Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        users: users?.map((u) => ({
          id: u.id,
          email: u.email,
          firstName: u.first_name,
          lastName: u.last_name,
          role: u.role,
          createdAt: u.created_at,
        })),
        total: users?.length || 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Admin users list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/users/:userId - Update user role (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const adminUser = await verifyAdminToken(authHeader)

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, role } = body

    if (!userId || !role || !['customer', 'admin', 'auditor'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid user ID or role' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Update user role
    const { error: updateError } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (updateError) {
      console.error('[v0] Error updating user role:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    // Log admin action
    await logAdminAction(
      adminUser.userId,
      'UPDATE_USER_ROLE',
      `user_id: ${userId}`,
      userId,
      ip,
      userAgent,
      { newRole: role }
    )

    return NextResponse.json(
      { message: 'User role updated successfully', userId, role },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Admin user update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/:userId - Delete user (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const adminUser = await verifyAdminToken(authHeader)

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Delete user (cascade deletes accounts and other data)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error('[v0] Error deleting user:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      )
    }

    // Log admin action
    await logAdminAction(
      adminUser.userId,
      'DELETE_USER',
      `user_id: ${userId}`,
      userId,
      ip,
      userAgent
    )

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Admin user delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
