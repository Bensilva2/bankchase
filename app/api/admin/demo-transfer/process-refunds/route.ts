import { NextRequest, NextResponse } from 'next/server'
import { processDemoRefunds } from '@/lib/demo-transfer-service'

/**
 * POST /api/admin/demo-transfer/process-refunds
 * Process expired demo transfers (call this from a scheduled job)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization header (basic protection)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await processDemoRefunds()

    return NextResponse.json({
      success: true,
      message: 'Refund processing completed',
    })
  } catch (error) {
    console.error('Refund processing error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
