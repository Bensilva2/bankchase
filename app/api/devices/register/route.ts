/**
 * Device Registration API - Register devices for push notifications
 * Allows users to receive notifications on multiple devices
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const userId = request.headers.get('x-user-id')
    const {
      action,
      deviceId,
      deviceName,
      deviceType,
      pushToken,
      fcmToken,
      apnsToken,
      notificationPreferences,
    } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (action === 'register') {
      // Register or update device
      if (!deviceId || !deviceType || (!pushToken && !fcmToken && !apnsToken)) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        )
      }

      const deviceRegistration = {
        device_id: deviceId,
        user_id: userId,
        device_name: deviceName || `Device-${deviceType}`,
        device_type: deviceType, // 'web' | 'ios' | 'android'
        push_token: pushToken || null,
        fcm_token: fcmToken || null,
        apns_token: apnsToken || null,
        is_active: true,
        last_seen: new Date().toISOString(),
      }

      // Upsert device registration
      const { data: device, error } = await supabase
        .from('device_registrations')
        .upsert([deviceRegistration], {
          onConflict: 'device_id,user_id',
        })
        .select()

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }

      console.log('[v0] Device registered:', {
        userId,
        deviceId,
        deviceType,
      })

      return NextResponse.json({
        success: true,
        message: 'Device registered successfully',
        device: device[0],
      })
    }

    if (action === 'list') {
      // Get all registered devices for user
      const { data: devices, error } = await supabase
        .from('device_registrations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_seen', { ascending: false })

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        devices,
        total: devices.length,
      })
    }

    if (action === 'update-last-seen') {
      // Update device last seen timestamp
      if (!deviceId) {
        return NextResponse.json(
          { error: 'Device ID required' },
          { status: 400 }
        )
      }

      const { error } = await supabase
        .from('device_registrations')
        .update({
          last_seen: new Date().toISOString(),
        })
        .eq('device_id', deviceId)
        .eq('user_id', userId)

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Device activity updated',
      })
    }

    if (action === 'unregister') {
      // Unregister device
      if (!deviceId) {
        return NextResponse.json(
          { error: 'Device ID required' },
          { status: 400 }
        )
      }

      const { error } = await supabase
        .from('device_registrations')
        .update({
          is_active: false,
        })
        .eq('device_id', deviceId)
        .eq('user_id', userId)

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Device unregistered',
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[v0] Device registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register device' },
      { status: 500 }
    )
  }
}
