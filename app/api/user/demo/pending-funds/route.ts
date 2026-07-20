import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const userId = 'demo-user'

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return pending funds for user
    return NextResponse.json({
      pending_funds: [],
    })
  } catch (error) {
    console.error('[v0] Error fetching pending funds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending funds' },
      { status: 500 }
    )
  }
}
