/**
 * Account Creation Endpoint
 * Creates new bank accounts for users with fallback for demo mode
 */

import { NextRequest, NextResponse } from 'next/server'
import { isNetworkError, logSupabaseError } from '@/lib/supabase/error-handler'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, accountType, accountName, initialDeposit } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    console.log(`[v0] Creating account for user ${userId}`)

    // Generate account number
    const accountNumber = Math.random().toString().slice(2, 14).padStart(12, '0')
    const maskedAccountNumber = `****${accountNumber.slice(-4)}`

    // Create account record
    const account = {
      accountId: `acct-${Date.now()}`,
      accountNumber,
      maskedAccountNumber,
      accountType: accountType || 'checking',
      accountName: accountName || 'My Account',
      balance: initialDeposit || 0,
      availableBalance: initialDeposit || 0,
      routingNumber: '021000021', // Chase routing number
      status: 'active',
      createdAt: new Date().toISOString()
    }

    console.log(`[v0] Account created successfully:`, {
      accountNumber: maskedAccountNumber,
      type: account.accountType,
      balance: account.balance
    })

    // Store account in localStorage as well
    const existingAccounts = JSON.parse(
      localStorage.getItem('chase_user_accounts') || '[]'
    )
    existingAccounts.push(account)
    localStorage.setItem('chase_user_accounts', JSON.stringify(existingAccounts))

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      account: {
        ...account,
        fullAccountNumber: accountNumber
      },
      summary: {
        accountName: account.accountName,
        accountNumber: maskedAccountNumber,
        balance: account.balance,
        type: account.accountType
      }
    })
  } catch (error) {
    logSupabaseError('Account Creation', error)

    if (isNetworkError(error)) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}
