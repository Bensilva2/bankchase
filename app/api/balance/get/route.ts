import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateBalance } from '@/lib/balance-service'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get('accountId')

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId query parameter is required' },
        { status: 400 }
      )
    }

    const balance = await getOrCreateBalance(accountId)

    return NextResponse.json(balance, { status: 200 })
  } catch (error) {
    console.error('[v0] Balance query error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve balance' },
      { status: 500 }
    )
  }
}
