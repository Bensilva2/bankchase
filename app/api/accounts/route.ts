import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// In-memory account store
const accountsStore = new Map<string, any[]>()

// Generate demo accounts for a user
function generateDemoAccounts(userId: string): any[] {
  if (!accountsStore.has(userId)) {
    const accounts = [
      {
        id: 1,
        account_number: '****2341',
        account_type: 'Checking',
        balance: 5234.56,
        is_demo_account: true,
        last_updated: new Date().toISOString(),
      },
      {
        id: 2,
        account_number: '****7890',
        account_type: 'Savings',
        balance: 12450.00,
        is_demo_account: true,
        last_updated: new Date().toISOString(),
      },
      {
        id: 3,
        account_number: '****5678',
        account_type: 'Money Market',
        balance: 8900.75,
        is_demo_account: true,
        last_updated: new Date().toISOString(),
      },
    ]
    accountsStore.set(userId, accounts)
  }
  return accountsStore.get(userId) || []
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create demo accounts
    const accounts = generateDemoAccounts(userId)
    const total_balance = accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0)

    return NextResponse.json({
      accounts,
      total_balance,
      message: 'Accounts retrieved successfully',
    }, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Error fetching accounts:', error.message)
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accountNumber, accountType } = await request.json()

    // For demo purposes, add account to store
    const accounts = generateDemoAccounts(userId)
    const newAccount = {
      id: accounts.length + 1,
      account_number: accountNumber || `****${Math.random().toString().slice(2, 6)}`,
      account_type: accountType || 'savings',
      balance: 0,
      is_demo_account: true,
      last_updated: new Date().toISOString(),
    }

    accounts.push(newAccount)
    accountsStore.set(userId, accounts)

    return NextResponse.json({ account: newAccount }, { status: 201 })
  } catch (error: any) {
    console.error('[v0] Error creating account:', error.message)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
