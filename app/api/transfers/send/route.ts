import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/transfers/send
 * 
 * Real-time transfer endpoint with immediate balance updates
 * Delegates to /api/transfers/realtime for actual processing
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fromAccountId, toAccountNumber, toBankCode, amount, narration, recipientName } = body

    // Validate required fields
    if (!fromAccountId || !toAccountNumber || !toBankCode || !amount || !recipientName) {
      console.error('[v0] Missing required transfer fields:', { fromAccountId, toAccountNumber, toBankCode, amount, recipientName })
      return NextResponse.json(
        { error: 'Missing required fields: fromAccountId, toAccountNumber, toBankCode, amount, recipientName' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
    }

    console.log('[v0] Transfer send request:', { userId: user.id, fromAccountId, amount, recipientName })

    // Call the real-time transfer endpoint
    const realtimeResponse = await fetch(
      new URL('/api/transfers/realtime', request.url),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${request.headers.get('authorization') || ''}`
        },
        body: JSON.stringify({
          userId: user.id,
          fromAccountId,
          toAccountNumber,
          toBankCode,
          amount: parseFloat(amount.toString()),
          recipientName,
          narration
        })
      }
    )

    const realtimeData = await realtimeResponse.json()

    if (!realtimeResponse.ok) {
      console.error('[v0] Realtime transfer failed:', realtimeData)
      return NextResponse.json(
        { error: realtimeData.error || 'Transfer processing failed', transaction: realtimeData.transaction },
        { status: realtimeResponse.status }
      )
    }

    console.log('[v0] Transfer send successful:', realtimeData.transaction)

    // Return 200 with transfer completion status
    return NextResponse.json(
      {
        success: true,
        status: realtimeData.status,
        transaction: realtimeData.transaction,
        _links: {
          status: `/api/transfers/realtime-status?transactionId=${realtimeData.transaction?.transactionId}`
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Transfer send error:', error.message)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create transfer',
        details: error.message
      },
      { status: 500 }
    )
  }
}
