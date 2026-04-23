/**
 * Login History API
 * Retrieves and manages user login history with IP and location data
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

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
    const severity = flags.length > 2 ? 'high' : 'medium'
    
    // Log security event
    await supabase.from('security_events').insert([
      {
        user_id: userId,
        event_type: 'suspicious_login',
        severity,
        description: `Suspicious login detected from ${locationData?.city}, ${locationData?.country}`,
        ip_address: ip,
        metadata: {
          flags,
          locationData,
        },
        created_at: new Date().toISOString(),
      },
    ])

    // Build alert HTML
    const alertHTML = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${severity === 'high' ? '#DC2626' : '#EA580C'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">⚠️ ${severity === 'high' ? 'High-Risk' : 'Suspicious'} Login Activity</h1>
        </div>
        <div style="background: #f9fafb; padding: 20px;">
          <p>We detected unusual login activity on your account.</p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${severity === 'high' ? '#DC2626' : '#EA580C'};">
            <h3 style="margin-top: 0;">Login Details</h3>
            <p><strong>Location:</strong> ${locationData?.city}, ${locationData?.country}</p>
            <p><strong>IP Address:</strong> ${ip}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Risk Level:</strong> ${severity.toUpperCase()}</p>
          </div>

          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detected Issues</h3>
            <ul style="margin: 0; padding-left: 20px;">
              ${flags.map(f => `<li>${f.replace(/_/g, ' ').toUpperCase()}</li>`).join('')}
            </ul>
          </div>

          ${severity === 'high' ? `
            <div style="background: #FEE2E2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626;">
              <p><strong>⚠️ Action Required:</strong> Please verify this login was authorized. If it wasn't, secure your account immediately.</p>
            </div>
          ` : ''}

          <p style="margin-top: 20px; text-align: center;">
            <a href="https://yourapp.com/security/verify-device" style="background: #1F2937; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
              Review Activity
            </a>
          </p>
        </div>
        <div style="text-align: center; color: #9ca3af; font-size: 12px; padding: 20px;">
          <p>This is a security notification. Please do not share this email with anyone.</p>
        </div>
      </div>
    `

    // Send via Resend (real-time delivery)
    try {
      const response = await resend.emails.send({
        from: 'security@resend.dev',
        to: email,
        subject: `${severity === 'high' ? '🚨 ' : '⚠️ '}Suspicious Login Activity Detected`,
        html: alertHTML,
        replyTo: 'security@yourdomain.com',
      })

      if (response.error) {
        console.error('[v0] Resend alert failed:', response.error)
      } else {
        console.log('[v0] Security alert sent via Resend:', response.data?.id)
      }
    } catch (resendError) {
      console.error('[v0] Resend delivery error:', resendError)
      // Fallback to regular email endpoint
      await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          subject: `${severity === 'high' ? '🚨 ' : '⚠️ '}Suspicious Login Activity Detected`,
          template: 'security-alert',
          data: {
            riskLevel: severity,
            location: `${locationData?.city}, ${locationData?.country}`,
            ip,
            timestamp: new Date().toLocaleString(),
            flags: flags.map(f => f.replace(/_/g, ' ').toUpperCase()),
          },
        }),
      }).catch(error => console.error('[v0] Fallback alert failed:', error))
    }
  } catch (error) {
    console.error('[v0] Failed to trigger suspicious login alert:', error)
  }
}
