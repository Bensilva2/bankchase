/**
 * Security Sessions API
 * Manages active login sessions and device tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const activeOnly = searchParams.get('active_only') === 'true'

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Fetch active sessions
    let query = supabase
      .from('login_history')
      .select('*')
      .eq('user_id', userId)
      .eq('login_success', true)
      .order('timestamp', { ascending: false })

    if (activeOnly) {
      // Only show sessions from last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      query = query.gte('timestamp', oneDayAgo)
    }

    const { data: sessions, error } = await query.limit(50)

    if (error) {
      console.error('[v0] Failed to fetch sessions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      )
    }

    // Get current device ID from request header
    const currentDeviceId = request.headers.get('x-device-id')

    // Transform for frontend
    const transformedSessions = (sessions || []).map((session: any, index: number) => ({
      id: session.id,
      deviceName: session.device_name || 'Unknown Device',
      ip: session.ip,
      location: `${session.location_data?.city}, ${session.location_data?.country}`,
      lastActive: session.timestamp,
      isCurrent: index === 0 && session.device_name === currentDeviceId,
      twoFactorVerified: session.two_factor_verified,
      os: session.location_data?.isp,
      browser: session.user_agent?.split(' ')[0],
    }))

    return NextResponse.json(transformedSessions)
  } catch (error) {
    console.error('[v0] Sessions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Mark session as logged out
    const { error } = await supabase
      .from('login_history')
      .update({ login_success: false })
      .eq('id', sessionId)

    if (error) {
      console.error('[v0] Failed to logout session:', error)
      return NextResponse.json(
        { error: 'Failed to logout session' },
        { status: 500 }
      )
    }

    // Log audit event
    await supabase.from('security_events').insert([
      {
        event_type: 'session_terminated',
        severity: 'low',
        description: `Session ${sessionId} was terminated by user`,
        created_at: new Date().toISOString(),
      },
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Sessions DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      email,
      ip,
      userAgent,
      deviceName,
      locationData,
      twoFactorVerified,
    } = body

    // Create new session record
    const { error } = await supabase.from('login_history').insert([
      {
        user_id: userId,
        email,
        ip,
        user_agent: userAgent,
        device_name: deviceName,
        location_data: locationData,
        two_factor_verified: twoFactorVerified,
        login_success: true,
        timestamp: new Date().toISOString(),
      },
    ])

    if (error) {
      console.error('[v0] Failed to create session:', error)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Sessions POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
