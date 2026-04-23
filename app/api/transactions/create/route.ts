import { NextRequest, NextResponse } from 'next/server'

interface TransactionRequest {
  fromAccountNumber: string
  toAccountNumber: string
  amount: number
  description: string
  transactionType: 'transfer' | 'payment' | 'deposit' | 'withdrawal'
  adminId?: string
}

interface Transaction {
  id: string
  fromAccountNumber: string
  toAccountNumber: string
  amount: number
  description: string
  transactionType: string
  status: 'completed' | 'pending' | 'failed'
  createdAt: string
  updatedAt: string
  timestamp: number
  adminInitiated?: boolean
  adminId?: string
}

function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export async function POST(request: NextRequest) {
  try {
    const body: TransactionRequest = await request.json()
    const {
      fromAccountNumber,
      toAccountNumber,
      amount,
      description,
      transactionType = 'transfer',
      adminId
    } = body

    // Validation
    if (!fromAccountNumber || !toAccountNumber) {
      return NextResponse.json(
        { error: 'From and To account numbers are required' },
        { status: 400 }
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Get accounts from local storage (simulated)
    const fromAccountKey = `account_${fromAccountNumber.replace('****', '')}`
    const toAccountKey = `account_${toAccountNumber.replace('****', '')}`

    // Load accounts from accounts list
    const allAccounts = JSON.parse(localStorage.getItem('chase_user_accounts') || '[]')
    const fromAccount = allAccounts.find((acc: any) => 
      acc.accountNumber === fromAccountNumber || acc.maskedAccountNumber === fromAccountNumber
    )
    const toAccount = allAccounts.find((acc: any) => 
      acc.accountNumber === toAccountNumber || acc.maskedAccountNumber === toAccountNumber
    )

    if (!fromAccount) {
      return NextResponse.json(
        { error: 'From account not found' },
        { status: 404 }
      )
    }

    if (!toAccount) {
      return NextResponse.json(
        { error: 'To account not found' },
        { status: 404 }
      )
    }

    // Check sufficient balance
    if (fromAccount.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient funds' },
        { status: 400 }
      )
    }

    // Create transaction
    const transactionId = generateTransactionId()
    const transaction: Transaction = {
      id: transactionId,
      fromAccountNumber: fromAccount.accountNumber,
      toAccountNumber: toAccount.accountNumber,
      amount,
      description: description || `${transactionType} to ${toAccount.maskedAccountNumber}`,
      transactionType,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timestamp: Date.now(),
      adminInitiated: !!adminId,
      adminId
    }

    // Update account balances
    fromAccount.balance -= amount
    fromAccount.availableBalance -= amount
    fromAccount.updatedAt = new Date().toISOString()

    toAccount.balance += amount
    toAccount.availableBalance += amount
    toAccount.updatedAt = new Date().toISOString()

    // Save updated accounts
    const updatedAccounts = allAccounts.map((acc: any) => {
      if (acc.accountNumber === fromAccount.accountNumber) return fromAccount
      if (acc.accountNumber === toAccount.accountNumber) return toAccount
      return acc
    })

    // Store transaction history
    const transactions = JSON.parse(localStorage.getItem('chase_transactions') || '[]')
    transactions.push(transaction)
    
    // Keep only last 100 transactions per browser memory
    const trimmedTransactions = transactions.slice(-100)

    // Persistent storage (in browser)
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('chase_user_accounts', JSON.stringify(updatedAccounts))
        localStorage.setItem('chase_transactions', JSON.stringify(trimmedTransactions))
        
        // Update individual account records
        localStorage.setItem(`account_${fromAccount.accountNumber}`, JSON.stringify(fromAccount))
        localStorage.setItem(`account_${toAccount.accountNumber}`, JSON.stringify(toAccount))
      } catch (e) {
        console.error('[v0] Storage error:', e)
      }
    }

    console.log('[v0] Transaction completed:', {
      transactionId,
      fromAccount: fromAccount.maskedAccountNumber,
      toAccount: toAccount.maskedAccountNumber,
      amount,
      type: transactionType
    })

    return NextResponse.json({
      success: true,
      transaction,
      fromAccountBalance: fromAccount.balance,
      toAccountBalance: toAccount.balance,
      message: `Transaction of $${amount.toLocaleString()} completed successfully`
    })
  } catch (error) {
    console.error('[v0] Transaction creation error:', error instanceof Error ? error.message : String(error))

    return NextResponse.json(
      { error: 'Failed to create transaction. Please try again.' },
      { status: 500 }
    )
  }
}
