import { NextRequest, NextResponse } from 'next/server'
import { adminDemoTransfer } from '@/lib/demo-transfer-service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()

    const result = await adminDemoTransfer(user.id, {
      to_account_number: body.to_account_number,
      amount: parseFloat(body.amount),
      days_to_refund: body.days_to_refund || 7,
      notes: body.notes,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('Demo transfer error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
