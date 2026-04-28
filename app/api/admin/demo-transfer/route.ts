import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  adminDemoTransfer,
  bulkDemoToAllUsers,
  processDemoRefunds,
  type DemoTransferRequest,
  type BulkTransferRequest,
} from '@/lib/demo-transfer-service'

/**
 * POST /api/admin/demo-transfer
 * Send demo money to a specific account
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

    const body: DemoTransferRequest = await request.json()

    const result = await adminDemoTransfer(user.id, body)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Demo transfer error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}
