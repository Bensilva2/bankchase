/**
 * Accounts API Route - Real-time account management
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/accounts - Fetch user accounts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('[v0] Accounts fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}

// POST /api/accounts - Create new account
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = request.headers.get('x-user-id')
    const { name, type, accountNumber, routingNumber } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('accounts')
      .insert([
        {
          user_id: userId,
          name,
          type,
          account_number: accountNumber,
          routing_number: routingNumber,
          balance: 0,
          available_balance: 0,
        },
      ])
      .select()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Account created successfully',
      account: data[0],
    })
  } catch (error) {
    console.error('[v0] Account creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
