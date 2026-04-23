/**
 * Security Alerts API
 * Handles fetching and managing security alerts
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
    const status = searchParams.get('status') || 'active'
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Fetch security alerts
    let query = supabase
      .from('security_events')
      .select('*')
      .eq('user_id', userId)

    if (status) {
      query = query.eq('severity', status)
    }

    const { data: alerts, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[v0] Failed to fetch alerts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch alerts' },
        { status: 500 }
      )
    }

    // Transform for frontend
    const transformedAlerts = (alerts || []).map((alert: any) => ({
      id: alert.id,
      type: alert.event_type,
      severity: alert.severity,
      title: formatAlertTitle(alert.event_type),
      description: alert.description,
      location: alert.metadata?.locationData?.city,
      ip: alert.ip_address,
      deviceName: alert.metadata?.device?.name,
      timestamp: alert.created_at,
      status: 'active',
      actionRequired: alert.severity === 'high',
    }))

    return NextResponse.json(transformedAlerts)
  } catch (error) {
    console.error('[v0] Alerts API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const alertId = searchParams.get('id')
    const body = await request.json()

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      )
    }

    // Update alert status
    const { error } = await supabase
      .from('security_events')
      .update({ resolved: body.status === 'resolved' })
      .eq('id', alertId)

    if (error) {
      console.error('[v0] Failed to update alert:', error)
      return NextResponse.json(
        { error: 'Failed to update alert' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Alerts PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function formatAlertTitle(eventType: string): string {
  const titles: { [key: string]: string } = {
    'suspicious_login': 'Suspicious Login Detected',
    'new_device': 'New Device Login',
    'impossible_travel': 'Impossible Travel Detected',
    'high_risk_ip': 'High-Risk IP Access',
    'backup_code_used': 'Backup Code Used',
    '2fa_disabled': '2FA Disabled',
    '2fa_enabled': '2FA Enabled',
  }

  return titles[eventType] || 'Security Event'
}
