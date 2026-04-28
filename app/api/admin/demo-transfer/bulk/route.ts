import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { bulkDemoToAllUsers, type BulkTransferRequest } from '@/lib/demo-transfer-service'

/**
 * POST /api/admin/demo-transfer/bulk
 * Send demo money to all users in organization
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: BulkTransferRequest = await request.json()

    const result = await bulkDemoToAllUsers(user.id, body)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Bulk demo transfer error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}
