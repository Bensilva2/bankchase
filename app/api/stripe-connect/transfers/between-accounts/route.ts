import { NextRequest, NextResponse } from 'next/server'
import { createTransferBetweenAccounts } from '@/lib/stripe-connect-service'

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

    const transfer = await createTransferBetweenAccounts(
      fromAccountId,
      toAccountId,
      amountInCents,
      reason || 'Account transfer',
      currency || 'usd'
    )

    console.log('[v0] Transfer created:', transfer.transferId)

    return NextResponse.json(transfer, { status: 201 })
  } catch (error) {
    console.error('[v0] Transfer creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create transfer' },
      { status: 500 }
    )
  }
}
