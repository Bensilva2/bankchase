/**
 * Admin Transfer API - Admin can transfer funds to new user accounts
 * Requires OTP verification for security
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateAndStoreOTP, verifyOTP } from '@/lib/auth/otp-service'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const adminId = request.headers.get('x-user-id')
    const role = request.headers.get('x-user-role')
    const {
      action,
      toUserId,
      toAccountId,
      amount,
      description,
      transferId,
      otp,
    } = await request.json()

    // Verify admin access
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    if (action === 'initiate') {
      // Step 1: Initiate transfer and generate OTP
      if (!toUserId || !toAccountId || !amount || amount <= 0) {
        return NextResponse.json(
          { error: 'Missing or invalid required fields' },
          { status: 400 }
        )
      }

      // Get target user and account
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', toUserId)
        .single()

      if (userError || !targetUser) {
        return NextResponse.json(
          { error: 'Target user not found' },
          { status: 404 }
        )
      }

      const { data: targetAccount, error: accountError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', toAccountId)
        .eq('user_id', toUserId)
        .single()

      if (accountError || !targetAccount) {
        return NextResponse.json(
          { error: 'Target account not found' },
          { status: 404 }
        )
      }

      // Create admin transfer record
      const newTransferId = crypto.randomUUID()
      const { data: transfer, error: transferError } = await supabase
        .from('admin_transfers')
        .insert([
          {
            id: newTransferId,
            admin_id: adminId,
            user_id: toUserId,
            account_id: toAccountId,
            amount,
            description: description || `Admin credit - ${new Date().toLocaleDateString()}`,
            status: 'pending_otp',
            created_at: new Date().toISOString(),
          },
        ])
        .select()

      if (transferError) {
        return NextResponse.json(
          { error: transferError.message },
          { status: 400 }
        )
      }

      // Generate OTP for admin confirmation
      const generatedOtp = generateAndStoreOTP(adminId || 'admin')
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

      console.log('[v0] Admin transfer initiated:', {
        transferId: newTransferId,
        admin: adminId,
        recipient: targetUser.name,
        amount,
        otp: generatedOtp,
      })

      return NextResponse.json({
        success: true,
        transferId: newTransferId,
        message: 'Transfer initiated. OTP sent to admin email.',
        otpExpires: expiresAt,
        recipient: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
        },
        amount,
        accountName: targetAccount.name,
      })
    }

    if (action === 'confirm') {
      // Step 2: Confirm transfer with OTP
      if (!transferId || !otp) {
        return NextResponse.json(
          { error: 'Transfer ID and OTP required' },
          { status: 400 }
        )
      }

      // Verify OTP
      const otpValid = verifyOTP(adminId || 'admin', otp)
      if (!otpValid) {
        return NextResponse.json(
          { error: 'Invalid or expired OTP' },
          { status: 401 }
        )
      }

      // Get transfer details
      const { data: transfer, error: getError } = await supabase
        .from('admin_transfers')
        .select('*')
        .eq('id', transferId)
        .eq('admin_id', adminId)
        .single()

      if (getError || !transfer) {
        return NextResponse.json(
          { error: 'Transfer not found' },
          { status: 404 }
        )
      }

      // Update transfer status and process
      const { error: updateError } = await supabase
        .from('admin_transfers')
        .update({
          status: 'completed',
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', transferId)

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        )
      }

      // Add credit to user account
      const { data: account } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', transfer.account_id)
        .single()

      let newBalance = 0

      if (account) {
        newBalance = parseFloat(account.balance) + parseFloat(transfer.amount)

        await supabase
          .from('accounts')
          .update({
            balance: newBalance,
            available_balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transfer.account_id)

        // Create transaction record
        await supabase.from('transactions').insert([
          {
            account_id: transfer.account_id,
            user_id: transfer.user_id,
            description: transfer.description || `Credit from Chase Bank`,
            amount: transfer.amount,
            type: 'credit',
            category: 'admin_credit',
            status: 'completed',
            reference: `ADM-${transferId.slice(0, 8).toUpperCase()}`,
            created_at: new Date().toISOString(),
            transaction_date: new Date().toISOString(),
            settlement_date: new Date().toISOString(),
          },
        ])

        // Create credit alert notification for the user (triggers real-time via Supabase)
        const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(transfer.amount)
        const formattedBalance = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(newBalance)
        
        await supabase.from('notifications').insert([
          {
            user_id: transfer.user_id,
            title: `Credit Alert: ${formattedAmount}`,
            message: `${formattedAmount} has been credited to your ${account.name} (****${account.account_number}). New balance: ${formattedBalance}. Ref: ADM-${transferId.slice(0, 8).toUpperCase()}`,
            type: 'credit',
            is_read: false,
            category: 'Transactions',
            data: {
              amount: transfer.amount,
              newBalance,
              accountId: transfer.account_id,
              accountName: account.name,
              transferId,
              reference: `ADM-${transferId.slice(0, 8).toUpperCase()}`,
              type: 'credit',
            },
            created_at: new Date().toISOString(),
          },
        ])

        // Log audit
        await supabase.from('audit_logs').insert([
          {
            admin_id: adminId,
            action: 'transfer_completed',
            details: {
              transferId,
              userId: transfer.user_id,
              amount: transfer.amount,
              accountId: transfer.account_id,
            },
            timestamp: new Date().toISOString(),
          },
        ])

        // Get user details for alerts
        const { data: userData } = await supabase
          .from('users')
          .select('email, phone')
          .eq('id', transfer.user_id)
          .single()

        // Send real-time alerts via SMS, Push, and Email
        try {
          const alertResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/transfer-alerts`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: transfer.user_id,
                userPhone: userData?.phone,
                userEmail: userData?.email,
                recipientName: 'Chase Bank',
                amount: transfer.amount,
                accountName: account.name,
                transferId,
                broadcastToAllDevices: true,
              }),
            }
          )

          if (alertResponse.ok) {
            console.log('[v0] Transfer alerts sent successfully')
          } else {
            console.error('[v0] Failed to send transfer alerts')
          }
        } catch (alertError) {
          console.error('[v0] Error sending transfer alerts:', alertError)
          // Don't fail the transfer if alerts fail
        }
      }

      console.log('[v0] Admin transfer completed:', {
        transferId,
        amount: transfer.amount,
        recipient: transfer.user_id,
      })

      return NextResponse.json({
        success: true,
        message: 'Transfer completed successfully. Alerts sent to all registered devices.',
        transferId,
        amount: transfer.amount,
        newBalance,
        completedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[v0] Admin transfer error:', error)
    return NextResponse.json(
      { error: 'Failed to process transfer' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const role = request.headers.get('x-user-role')

    // Verify admin access
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Get transfer history
    const { data: transfers, error } = await supabase
      .from('admin_transfers')
      .select(`
        *,
        users(id, email, name),
        accounts(id, name, account_type, account_number, balance)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

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
  } catch (error) {
    console.error('[v0] Admin transfer GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transfers' },
      { status: 500 }
    )
  }
}
