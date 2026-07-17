import { NextRequest, NextResponse } from 'next/server'
import { createBankTransfer } from '@/lib/stripe-connect-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { connectedAccountId, amountInCents, bankAccountId, currency } = body

    if (!connectedAccountId || !amountInCents || !bankAccountId) {
      return NextResponse.json(
        { error: 'Missing required fields: connectedAccountId, amountInCents, bankAccountId' },
        { status: 400 }
      )
    }

    const transfer = await createBankTransfer(
      connectedAccountId,
      amountInCents,
      bankAccountId,
      currency || 'usd'
    )

    console.log('[v0] Bank transfer created:', transfer.transferId)

    return NextResponse.json(transfer, { status: 201 })
  } catch (error) {
    console.error('[v0] Bank transfer error:', error)
    return NextResponse.json(
      { error: 'Failed to create bank transfer' },
      { status: 500 }
    )
  }
}
