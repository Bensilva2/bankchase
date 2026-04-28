import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/demo-transfer/history
 * Get transfer history with optional filters
 */
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') ?? '50')
    const status = searchParams.get('status')
    const transferType = searchParams.get('type')

    // Build query
    let query = supabase
      .from('demo_transfers')
      .select('*, from_account:accounts(account_number, balance)')
      .eq('admin_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    if (transferType) {
      query = query.eq('transfer_type', transferType)
    }

    const { data: transfers, error: queryError } = await query

    if (queryError) {
      throw queryError
    }

    return NextResponse.json({
      success: true,
      data: transfers,
      count: transfers?.length ?? 0,
    })
  } catch (error) {
    console.error('History fetch error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}
