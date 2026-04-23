import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

interface Device {
  id: string
  name: string
  lastUsed: string
  isCurrentDevice: boolean
}

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')
    const deviceId = request.nextUrl.searchParams.get('deviceId')

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get user's devices
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('id, totp_devices')
      .eq('email', email)

    if (findError || !users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = users[0]
    let devices: Device[] = []

    if (user.totp_devices) {
      try {
        devices = JSON.parse(user.totp_devices)
      } catch (error) {
        console.error('[v0] Failed to parse devices:', error)
      }
    }

    // Mark current device if deviceId provided
    if (deviceId) {
      devices = devices.map(d => ({
        ...d,
        isCurrentDevice: d.id === deviceId,
      }))
    }

    return NextResponse.json({
      success: true,
      devices,
    })
  } catch (error) {
    console.error('[v0] Devices endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, deviceId, deviceName } = await request.json()

    if (!email || !deviceId || !deviceName) {
      return NextResponse.json(
        { error: 'Email, deviceId, and deviceName are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get user
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('id, totp_devices')
      .eq('email', email)

    if (findError || !users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = users[0]
    let devices: Device[] = []

    if (user.totp_devices) {
      try {
        devices = JSON.parse(user.totp_devices)
      } catch (error) {
        console.error('[v0] Failed to parse existing devices:', error)
      }
    }

    // Check if device already exists
    const existingDeviceIndex = devices.findIndex(d => d.id === deviceId)

    if (existingDeviceIndex >= 0) {
      // Update last used time
      devices[existingDeviceIndex].lastUsed = new Date().toISOString()
    } else {
      // Add new device
      devices.push({
        id: deviceId,
        name: deviceName,
        lastUsed: new Date().toISOString(),
        isCurrentDevice: false,
      })
    }

    // Update user record
    const { error: updateError } = await supabase
      .from('users')
      .update({
        totp_devices: JSON.stringify(devices),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      devices,
      message: 'Device registered successfully',
    })
  } catch (error) {
    console.error('[v0] Register device error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { email, deviceId } = await request.json()

    if (!email || !deviceId) {
      return NextResponse.json(
        { error: 'Email and deviceId are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get user
    const { data: users, error: findError } = await supabase
      .from('users')
      .select('id, totp_devices')
      .eq('email', email)

    if (findError || !users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = users[0]
    let devices: Device[] = []

    if (user.totp_devices) {
      try {
        devices = JSON.parse(user.totp_devices)
      } catch (error) {
        console.error('[v0] Failed to parse devices:', error)
      }
    }

    // Remove device
    devices = devices.filter(d => d.id !== deviceId)

    // Update user record
    const { error: updateError } = await supabase
      .from('users')
      .update({
        totp_devices: JSON.stringify(devices),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      devices,
      message: 'Device removed successfully',
    })
  } catch (error) {
    console.error('[v0] Remove device error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
