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
 * Verify admin or auditor token
 */
async function verifyAuditAccess(
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

    // Allow admin and auditor roles
    if (!['admin', 'auditor'].includes(decoded.role)) {
      return null
    }

    return decoded
  } catch {
    return null
  }
}

/**
 * GET /api/admin/audit-logs - Get audit logs (admin and auditor only)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = await verifyAuditAccess(authHeader)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Audit access required' },
        { status: 403 }
      )
    }

    const supabase = getSupabase()

    // Get pagination parameters
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
    const offset = (page - 1) * limit

    // Get filter parameters
    const adminId = url.searchParams.get('adminId')
    const actionType = url.searchParams.get('actionType')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    // Build query
    let query = supabase
      .from('admin_audit_logs')
      .select(
        `
        id,
        admin_id,
        action_type,
        target_resource,
        target_user_id,
        ip_address,
        details,
        created_at,
        users!admin_audit_logs_admin_id_fkey(email, first_name, last_name)
      `,
        { count: 'exact' }
      )

    // Apply filters
    if (adminId) {
      query = query.eq('admin_id', adminId)
    }

    if (actionType) {
      query = query.eq('action_type', actionType)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // Order by date descending and paginate
    const { data: logs, error: logsError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (logsError) {
      console.error('[v0] Error fetching audit logs:', logsError)
      return NextResponse.json(
        { error: 'Failed to fetch audit logs' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        logs: logs?.map((log) => ({
          id: log.id,
          adminId: log.admin_id,
          adminEmail: log.users?.email,
          adminName: `${log.users?.first_name} ${log.users?.last_name}`,
          actionType: log.action_type,
          targetResource: log.target_resource,
          targetUserId: log.target_user_id,
          ipAddress: log.ip_address,
          details: log.details,
          createdAt: log.created_at,
        })),
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Audit logs fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
