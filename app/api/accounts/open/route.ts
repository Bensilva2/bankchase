/**
 * Account Opening API - Complete account creation with real-time banking features
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

interface OpenAccountRequest {
  userId: string
  accountType: 'checking' | 'savings' | 'money_market'
  initialDeposit: number
  accountName: string
}

// POST /api/accounts/open - Open a new Chase account
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body: OpenAccountRequest = await request.json()

    const { userId, accountType, initialDeposit, accountName } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      )
    }

    // Validate account type
    const validTypes = ['checking', 'savings', 'money_market']
    if (!validTypes.includes(accountType)) {
      return NextResponse.json(
        { error: 'Invalid account type' },
        { status: 400 }
      )
    }

    // Validate initial deposit
    if (initialDeposit < 0) {
      return NextResponse.json(
        { error: 'Initial deposit cannot be negative' },
        { status: 400 }
      )
    }

    // Generate account number (masked for security)
    const accountNumber = generateAccountNumber()
    const routingNumber = '011000015' // Chase routing number

    // Determine interest rate based on account type
    let interestRate = 0
    if (accountType === 'savings') interestRate = 0.0425 // 4.25% APY
    if (accountType === 'money_market') interestRate = 0.0500 // 5.00% APY

    // Create account in database
    const { data: account, error: createError } = await supabase
      .from('accounts')
      .insert([
        {
          user_id: userId,
          account_type: accountType,
          account_number: accountNumber.slice(-4),
          full_account_number: accountNumber,
          routing_number: routingNumber,
          balance: initialDeposit,
          available_balance: initialDeposit,
          interest_rate: interestRate,
          status: 'active',
          name: accountName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()

    if (createError || !account) {
      console.error('[v0] Account creation error:', createError)
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    // If there's an initial deposit, create a transaction record
    if (initialDeposit > 0) {
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([
          {
            account_id: account[0].id,
            amount: initialDeposit,
            type: 'deposit',
            status: 'completed',
            description: 'Initial deposit - Account opening',
            transaction_date: new Date().toISOString(),
            settlement_date: new Date().toISOString(),
          },
        ])

      if (transactionError) {
        console.error('[v0] Transaction creation error:', transactionError)
      }
    }

    // Create notification for account opening
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          type: 'account',
          title: `${accountType.charAt(0).toUpperCase() + accountType.slice(1)} Account Opened`,
          message: `Your new ${accountType} account (${accountNumber.slice(-4)}) has been successfully created.`,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ])

    if (notificationError) {
      console.error('[v0] Notification error:', notificationError)
    }

    console.log('[v0] Account created successfully:', account[0].id)

    return NextResponse.json({
      message: 'Account opened successfully',
      account: {
        id: account[0].id,
        type: accountType,
        accountNumber: accountNumber.slice(-4),
        fullAccountNumber: accountNumber,
        routingNumber,
        balance: initialDeposit,
        interestRate,
        status: 'active',
        createdAt: account[0].created_at,
      },
      success: true,
    })
  } catch (error) {
    console.error('[v0] Account opening error:', error)
    return NextResponse.json(
      { error: 'Failed to open account' },
      { status: 500 }
    )
  }
}

/**
 * Generate a realistic Chase account number
 * Format: 10 digits starting with 9
 */
function generateAccountNumber(): string {
  const prefix = '9' // Chase accounts often start with 9
  const random = Math.floor(Math.random() * 9000000000) + 1000000000
  return prefix + random.toString().slice(1)
}
