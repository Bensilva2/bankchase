import { NextRequest, NextResponse } from 'next/server'
import { seedAdminUser } from '@/lib/seed-admin'

/**
 * Initialize admin user - DISABLED IN PRODUCTION
 * This endpoint is PROTECTED and should only be called during initial setup
 * Requires SETUP_TOKEN env var to match for security
 */
export async function POST(request: NextRequest) {
  try {
    // CRITICAL: Require setup token to prevent unauthorized admin creation
    const setupToken = request.headers.get('x-setup-token')
    const expectedToken = process.env.SETUP_TOKEN

    if (!setupToken || !expectedToken || setupToken !== expectedToken) {
      console.warn('[v0] Unauthorized admin setup attempt')
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing setup token' },
        { status: 403 }
      )
    }

    const result = await seedAdminUser()

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        admin: result.admin,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Admin initialization error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to initialize admin user',
      },
      { status: 500 }
    )
  }
}
