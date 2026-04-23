/**
 * Admin Users API - Manage new users and view user accounts
 * Only accessible to admin users
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const adminId = request.headers.get('x-user-id')
    const role = request.headers.get('x-user-role')

    // Verify admin access
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Get all users with their account information
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        phone,
        role,
        created_at,
        accounts(id, name, account_type, account_number, full_account_number, balance, available_balance, status)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
    })
  } catch (error) {
    console.error('[v0] Admin users API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const adminId = request.headers.get('x-user-id')
    const role = request.headers.get('x-user-role')
    const { action } = await request.json()

    // Verify admin access
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    if (action === 'get-new-users') {
      // Get users created in last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const { data: newUsers, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          created_at,
          accounts(id, name, type, balance)
        `)
        .gt('created_at', yesterday)
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        newUsers,
        total: newUsers.length,
      })
    }

    if (action === 'get-pending-transfers') {
      // Get pending admin transfers
      const { data: transfers, error } = await supabase
        .from('admin_transfers')
        .select(`
          *,
          users(id, email, name),
          accounts(id, name, account_type, account_number, balance)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        transfers,
        total: transfers.length,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[v0] Admin users POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
