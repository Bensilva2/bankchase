import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { getUserTransactions } from '@/lib/supabase-queries'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Verify token and get user
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Get user's transactions
    const transactions = await getUserTransactions(user.id, limit)

    return NextResponse.json({ transactions }, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Error fetching transactions:', error.message)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
