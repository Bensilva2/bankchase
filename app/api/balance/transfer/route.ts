import { NextRequest, NextResponse } from 'next/server'
import { transferFunds } from '@/lib/balance-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fromAccountId, toAccountId, amount, description } = body

    if (!fromAccountId || !toAccountId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: fromAccountId, toAccountId, amount' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    const result = await transferFunds({
      fromAccountId,
      toAccountId,
      amount,
      description: description || 'Balance transfer',
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    console.log('[v0] Balance transfer completed:', {
      from: fromAccountId,
      to: toAccountId,
      amount,
      transactionId: result.transactionId,
    })

    return NextResponse.json(
      {
        success: true,
        transactionId: result.transactionId,
        message: `Successfully transferred $${amount} to ${toAccountId}`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Balance transfer error:', error)
    return NextResponse.json(
      { error: 'Failed to transfer balance' },
      { status: 500 }
    )
  }
}
