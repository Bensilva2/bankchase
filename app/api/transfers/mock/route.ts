import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// In-memory store for demo purposes
const mockTransactions = new Map<string, any>()

/**
 * POST /api/transfers/mock
 * Mock transfer endpoint that works without database
 * Ideal for testing and development
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      fromAccountId = 'mock-account-1',
      toAccountNumber = '1234567890',
      toBankCode = 'MOCK',
      amount = 100,
      currency = 'USD',
      narration = 'Mock transfer'
    } = body

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    const transactionId = uuidv4()
    const now = new Date().toISOString()

    // Create mock transaction
    const transaction = {
      id: transactionId,
      user_id: 'mock-user',
      from_account_id: fromAccountId,
      to_account_number: toAccountNumber,
      to_bank_code: toBankCode,
      amount,
      currency,
      narration,
      status: 'completed',
      reference_id: `REF-${Date.now()}`,
      initiated_at: now,
      processing_at: new Date(Date.now() + 1000).toISOString(),
      completed_at: new Date(Date.now() + 2000).toISOString(),
      failure_reason: null,
      created_at: now,
      updated_at: now
    }

    // Store in memory
    mockTransactions.set(transactionId, transaction)

    return NextResponse.json(
      {
        success: true,
        status: 'completed',
        transaction: {
          id: transactionId,
          status: 'completed',
          amount,
          currency,
          reference: transaction.reference_id,
          timestamp: now
        },
        _links: {
          status: `/api/transfers/status/${transactionId}`
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[v0] Mock transfer error:', error)
    return NextResponse.json(
      { error: 'Transfer failed', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/transfers/mock/history
 * Get mock transfer history
 */
export async function GET(request: NextRequest) {
  try {
    const transactions = Array.from(mockTransactions.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)

    return NextResponse.json(
      {
        success: true,
        count: transactions.length,
        transactions
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Mock history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/transfers/mock/clear
 * Clear mock transaction history (dev only)
 */
export async function DELETE(request: NextRequest) {
  try {
    mockTransactions.clear()
    return NextResponse.json(
      { success: true, message: 'Mock history cleared' },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to clear history' },
      { status: 500 }
    )
  }
}
