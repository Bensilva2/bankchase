import { NextRequest, NextResponse } from 'next/server'

/**
 * DEPRECATED: Use /api/auth/signup instead, which connects to the Python backend
 * This route is kept for backwards compatibility but redirects to the correct endpoint
 */

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use POST /api/auth/signup instead.' },
    { status: 410 } // 410 Gone
  )
}
