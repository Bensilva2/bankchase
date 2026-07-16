import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

interface AppSettings {
  notifications: {
    emailNotifications: boolean
    smsNotifications: boolean
    pushNotifications: boolean
    marketingEmails: boolean
    paperStatements: boolean
    soundAlerts: boolean
    transactionAlerts: boolean
    largeTransactionThreshold: number
    lowBalanceAlert: boolean
    lowBalanceAmount: number
  }
  display: {
    darkMode: boolean
    theme: string
    showBalance: boolean
  }
  security: {
    autoLogout: boolean
    autoLogoutMinutes: number
    biometricLogin: boolean
    twoFactorEnabled: boolean
  }
  preferences: {
    language: string
    currency: string
    timezone: string
  }
}

// In-memory storage for demo (use database in production)
const settingsStore = new Map<string, AppSettings>()

/**
 * GET /api/user/settings
 * Retrieve user's settings
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    const searchParams = request.nextUrl.searchParams
    const paramUserId = searchParams.get('userId')

    if (!userId || (paramUserId && paramUserId !== userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userSettings = settingsStore.get(userId) || {
      notifications: {
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        marketingEmails: false,
        paperStatements: false,
        soundAlerts: true,
        transactionAlerts: true,
        largeTransactionThreshold: 500,
        lowBalanceAlert: true,
        lowBalanceAmount: 100,
      },
      display: {
        darkMode: false,
        theme: 'auto',
        showBalance: true,
      },
      security: {
        autoLogout: true,
        autoLogoutMinutes: 15,
        biometricLogin: true,
        twoFactorEnabled: false,
      },
      preferences: {
        language: 'English',
        currency: 'USD',
        timezone: 'America/New_York',
      },
    }

    console.log('[v0] Retrieved settings for user:', userId)

    return NextResponse.json({
      success: true,
      settings: userSettings,
    })
  } catch (error: any) {
    console.error('[v0] Error fetching settings:', error.message)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/settings
 * Save user's settings
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { settings } = body

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings are required' },
        { status: 400 }
      )
    }

    // Validate settings structure
    if (
      !settings.notifications ||
      !settings.display ||
      !settings.security ||
      !settings.preferences
    ) {
      return NextResponse.json(
        { error: 'Invalid settings structure' },
        { status: 400 }
      )
    }

    // Save settings
    settingsStore.set(userId, settings)

    console.log('[v0] Saved settings for user:', userId)

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings,
    })
  } catch (error: any) {
    console.error('[v0] Error saving settings:', error.message)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/user/settings
 * Update specific setting
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { path, value } = body

    if (!path || value === undefined) {
      return NextResponse.json(
        { error: 'Path and value are required' },
        { status: 400 }
      )
    }

    // Get current settings
    let userSettings = settingsStore.get(userId) || {
      notifications: {
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        marketingEmails: false,
        paperStatements: false,
        soundAlerts: true,
        transactionAlerts: true,
        largeTransactionThreshold: 500,
        lowBalanceAlert: true,
        lowBalanceAmount: 100,
      },
      display: {
        darkMode: false,
        theme: 'auto',
        showBalance: true,
      },
      security: {
        autoLogout: true,
        autoLogoutMinutes: 15,
        biometricLogin: true,
        twoFactorEnabled: false,
      },
      preferences: {
        language: 'English',
        currency: 'USD',
        timezone: 'America/New_York',
      },
    }

    // Update nested property using path (e.g., "notifications.emailNotifications")
    const keys = path.split('.')
    let current: any = userSettings

    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value

    // Save updated settings
    settingsStore.set(userId, userSettings)

    console.log('[v0] Updated setting:', path, '=', value)

    return NextResponse.json({
      success: true,
      message: 'Setting updated successfully',
      settings: userSettings,
    })
  } catch (error: any) {
    console.error('[v0] Error updating setting:', error.message)
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    )
  }
}
