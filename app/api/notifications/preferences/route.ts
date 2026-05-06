import { NextRequest, NextResponse } from 'next/server'

interface NotificationPreferences {
  settings: Array<{
    id: string
    enabled: boolean
  }>
  pushEnabled: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: NotificationPreferences = await request.json()

    // Here you would typically save to database
    // For now, we'll just validate and return success
    console.log('[v0] Saving notification preferences:', body)

    return NextResponse.json({
      success: true,
      message: 'Notification preferences saved',
      preferences: body,
    })
  } catch (error) {
    console.error('[v0] Notification preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Retrieve current user's notification preferences from database
    // For now, return default preferences
    const defaultPreferences = {
      pushEnabled: false,
      settings: [
        { id: 'transactions', enabled: true },
        { id: 'security', enabled: true },
        { id: 'bill_pay', enabled: true },
        { id: 'offers', enabled: false },
        { id: 'balance', enabled: true },
        { id: 'spending', enabled: false },
      ],
    }

    return NextResponse.json(defaultPreferences)
  } catch (error) {
    console.error('[v0] Get preferences error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve preferences' },
      { status: 500 }
    )
  }
}
