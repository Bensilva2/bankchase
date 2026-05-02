import { NextRequest, NextResponse } from 'next/server'
import { seedAdminUser } from '@/lib/seed-admin'

/**
 * Initialize admin user - Call this endpoint once after deployment
 * POST /api/setup/init-admin
 * 
 * IMPORTANT: Disable or remove this endpoint in production after setup
 */
export async function POST(request: NextRequest) {
  try {
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
    console.error('Admin initialization error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to initialize admin user',
      },
      { status: 500 }
    )
  }
}
