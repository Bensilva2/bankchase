import { NextRequest, NextResponse } from 'next/server'
import { createTransferBetweenAccounts } from '@/lib/stripe-connect-service'
import { transferFunds, createBalanceAlert } from '@/lib/balance-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fromAccountId, toAccountId, amountInCents, reason, currency } = body

    if (!fromAccountId || !toAccountId || !amountInCents) {
      return NextResponse.json(
        { error: 'Missing required fields: fromAccountId, toAccountId, amountInCents' },
        { status: 400 }
      )
    }

    // Convert cents to dollars for balance service
    const amountInDollars = amountInCents / 100

    // Transfer funds and update balances
    const balanceTransfer = await transferFunds({
      fromAccountId,
      toAccountId,
      amount: amountInDollars,
      description: reason || 'Account transfer',
      metadata: { currency: currency || 'usd' },
    })

    if (!balanceTransfer.success) {
      return NextResponse.json(
        { error: balanceTransfer.error },
        { status: 400 }
      )
    }

    // Create Stripe transfer in Connect
    const transfer = await createTransferBetweenAccounts(
      fromAccountId,
      toAccountId,
      amountInCents,
      reason || 'Account transfer',
      currency || 'usd'
    )

    // Check if this was a large transfer and create alert
    if (amountInDollars > 5000) {
      await createBalanceAlert(
        fromAccountId,
        'large_transfer',
        `Large transfer of $${amountInDollars.toFixed(2)} to ${toAccountId}`,
        amountInDollars
      )
    }

    console.log('[v0] Transfer created with balance update:', {
      transferId: transfer.transferId,
      balanceTransactionId: balanceTransfer.transactionId,
    })

    return NextResponse.json(
      {
        ...transfer,
        balanceTransactionId: balanceTransfer.transactionId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[v0] Transfer creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create transfer' },
      { status: 500 }
    )
  }
}
