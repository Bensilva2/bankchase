import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { getUserAccounts } from '@/lib/supabase-queries'

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

    // Get user's accounts
    const accounts = await getUserAccounts(user.id)

    return NextResponse.json({ accounts }, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Error fetching accounts:', error.message)
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { accountNumber, accountType } = await request.json()

    const { data, error: insertError } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        account_number: accountNumber,
        account_type: accountType || 'savings',
        balance: 0,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    return NextResponse.json({ account: data }, { status: 201 })
  } catch (error: any) {
    console.error('[v0] Error creating account:', error.message)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
