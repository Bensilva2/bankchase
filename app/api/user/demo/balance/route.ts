import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return demo balance for user
    return NextResponse.json({
      account_number: '****2341',
      balance: 5234.56,
      is_demo: true,
    })
  } catch (error) {
    console.error('[v0] Error fetching demo balance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch demo balance' },
      { status: 500 }
    )
  }
}
