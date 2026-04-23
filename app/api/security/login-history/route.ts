/**
 * Login History API
 * Retrieves and manages user login history with IP and location data
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const suspicious = searchParams.get('suspicious') === 'true'

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Fetch login history
    let query = supabase
      .from('login_history')
      .select('*')
      .eq('user_id', userId)
      .eq('login_success', true)

    if (suspicious) {
      query = query.neq('suspicious_flags', '[]')
    }

    const { data: records, error } = await query
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[v0] Failed to fetch login history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch login history' },
        { status: 500 }
      )
    }

    // Transform for frontend
    const transformedRecords = (records || []).map((record: any) => ({
      id: record.id,
      timestamp: record.timestamp,
      deviceName: record.device_name || 'Unknown Device',
      location: record.location_data
        ? `${record.location_data.city}, ${record.location_data.country}`
        : 'Unknown Location',
      ip: record.ip,
      os: record.location_data?.isp || 'Unknown',
      browser: record.user_agent?.split(' ')[0] || 'Unknown',
      twoFactorVerified: record.two_factor_verified,
      suspiciousFlags: record.suspicious_flags || [],
      loginSuccess: record.login_success,
    }))

    return NextResponse.json(transformedRecords)
  } catch (error) {
    console.error('[v0] Login history API error:', error)
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
      suspiciousFlags = [],
    } = body

    // Insert login record
    const { data, error } = await supabase
      .from('login_history')
      .insert([
        {
          user_id: userId,
          email,
          ip,
          user_agent: userAgent,
          device_name: deviceName,
          location_data: locationData,
          two_factor_verified: twoFactorVerified,
          suspicious_flags: suspiciousFlags,
          login_success: true,
          timestamp: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error('[v0] Failed to create login record:', error)
      return NextResponse.json(
        { error: 'Failed to create login record' },
        { status: 500 }
      )
    }

    // Trigger notifications if suspicious
    if (suspiciousFlags.length > 0) {
      await triggerSuspiciousLoginAlert(
        userId,
        email,
        locationData,
        ip,
        suspiciousFlags
      )
    }

    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error) {
    console.error('[v0] Login history POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function triggerSuspiciousLoginAlert(
  userId: string,
  email: string,
  locationData: any,
  ip: string,
  flags: string[]
) {
  try {
    // Log security event
    await supabase.from('security_events').insert([
      {
        user_id: userId,
        event_type: 'suspicious_login',
        severity: flags.length > 2 ? 'high' : 'medium',
        description: `Suspicious login detected from ${locationData?.city}, ${locationData?.country}`,
        ip_address: ip,
        metadata: {
          flags,
          locationData,
        },
        created_at: new Date().toISOString(),
      },
    ])

    // Send email notification
    await fetch('/api/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        subject: '🚨 Suspicious Login Activity Detected',
        template: 'security-alert',
        data: {
          riskLevel: flags.length > 2 ? 'high' : 'medium',
          location: `${locationData?.city}, ${locationData?.country}`,
          ip,
          timestamp: new Date().toLocaleString(),
          flags: flags.map(f => f.replace(/_/g, ' ').toUpperCase()),
        },
      }),
    }).catch(error => console.error('[v0] Failed to send alert:', error))
  } catch (error) {
    console.error('[v0] Failed to trigger suspicious login alert:', error)
  }
}
