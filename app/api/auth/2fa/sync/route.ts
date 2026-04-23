import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')
    const deviceId = request.nextUrl.searchParams.get('deviceId')
    const timestamp = request.nextUrl.searchParams.get('timestamp')

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get user profile and 2FA settings
    const { data: users, error: findError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        two_factor_enabled,
        totp_secret,
        totp_backup_codes,
        totp_devices,
        profile_picture,
        updated_at,
        created_at
      `)
      .eq('email', email)

    if (findError || !users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = users[0]

    // If timestamp provided, only return if there are newer changes
    if (timestamp) {
      const lastUpdate = new Date(user.updated_at).getTime()
      const clientTimestamp = parseInt(timestamp)

      if (lastUpdate < clientTimestamp) {
        return NextResponse.json({
          success: true,
          hasUpdates: false,
          message: 'No updates available',
        })
      }
    }

    // Parse devices if available
    let devices: any[] = []
    if (user.totp_devices) {
      try {
        devices = JSON.parse(user.totp_devices)
      } catch (error) {
        console.error('[v0] Failed to parse devices:', error)
      }
    }

    // Mark current device
    if (deviceId) {
      devices = devices.map(d => ({
        ...d,
        isCurrentDevice: d.id === deviceId,
      }))
    }

    // Don't send TOTP secret or backup codes to client (security)
    // Only confirm they exist
    const backupCodesCount = user.totp_backup_codes
      ? (user.totp_backup_codes.split('|').length)
      : 0

    return NextResponse.json({
      success: true,
      hasUpdates: true,
      sync: {
        email: user.email,
        twoFactorEnabled: user.two_factor_enabled,
        hasBackupCodes: backupCodesCount > 0,
        backupCodesCount,
        deviceCount: devices.length,
        devices,
        profilePicture: user.profile_picture ? user.profile_picture.substring(0, 50) + '...' : null, // Only send URL/hash, not full data
        updatedAt: user.updated_at,
      },
    })
  } catch (error) {
    console.error('[v0] Sync endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, deviceId, settings } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get user
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)

    if (findError || !users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userId = users[0].id

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Only update allowed fields
    if (settings?.twoFactorEnabled !== undefined) {
      updateData.two_factor_enabled = settings.twoFactorEnabled
    }

    // Register device if provided
    if (deviceId && settings?.deviceName) {
      // Device registration handled by separate endpoint
    }

    // Update user
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Settings synced successfully',
      updatedAt: updateData.updated_at,
    })
  } catch (error) {
    console.error('[v0] Sync update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
