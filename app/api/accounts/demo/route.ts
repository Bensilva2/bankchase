/**
 * Demo Account Opening API
 * Works without Supabase connection for testing/demo mode
 */

import { NextRequest, NextResponse } from 'next/server'

interface AccountRequest {
  userId: string
  accountType?: 'checking' | 'savings' | 'money_market'
  initialDeposit?: number
  accountName?: string
}

function generateAccountNumber(): string {
  return Math.random().toString().slice(2, 14).padStart(12, '0')
}

export async function POST(request: NextRequest) {
  try {
    const body: AccountRequest = await request.json()
    const {
      userId,
      accountType = 'checking',
      initialDeposit = 0,
      accountName = 'My Account'
    } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const accountNumber = generateAccountNumber()
    const maskedAccountNumber = `****${accountNumber.slice(-4)}`
    const routingNumber = '021000021' // Chase routing number

    // Determine interest rate
    let interestRate = 0
    if (accountType === 'savings') interestRate = 4.25
    if (accountType === 'money_market') interestRate = 5.00

    const account = {
      id: `acct_${Date.now()}`,
      accountId: `acct_${Date.now()}`,
      userId,
      accountNumber,
      maskedAccountNumber,
      accountType,
      accountName,
      balance: initialDeposit,
      availableBalance: initialDeposit,
      routingNumber,
      interestRate,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    console.log('[v0] Demo account created:', {
      accountNumber: maskedAccountNumber,
      accountName,
      balance: initialDeposit
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully in demo mode',
      account: {
        ...account,
        accountNumber: maskedAccountNumber
      },
      summary: {
        accountName,
        accountNumber: maskedAccountNumber,
        balance: initialDeposit,
        type: accountType,
        routingNumber
      }
    })
  } catch (error) {
    console.error('[v0] Demo account creation error:', error instanceof Error ? error.message : String(error))

    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}
