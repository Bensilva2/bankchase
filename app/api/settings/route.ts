/**
 * Settings API - User preferences, security, accessibility
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Get notification preferences
    const { data: notifPrefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Get security settings
    const { data: securitySettings } = await supabase
      .from('security_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    return NextResponse.json({
      display: {
        theme: settings?.theme || 'light',
        textSize: settings?.text_size || 'medium',
        highContrast: settings?.high_contrast || false,
        reduceMotion: settings?.reduce_motion || false,
        language: settings?.language || 'en'
      },
      notifications: notifPrefs || {},
      security: {
        twoFactorEnabled: securitySettings?.two_factor_enabled || false,
        biometricEnabled: securitySettings?.biometric_enabled || false,
        sessionTimeout: securitySettings?.session_timeout || 300,
        autoLogout: securitySettings?.auto_logout || true
      }
    })
  } catch (error) {
    console.error('[v0] Settings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PATCH /api/settings - Update user settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const userId = request.headers.get('x-user-id')
    const {
      theme,
      textSize,
      highContrast,
      reduceMotion,
      language,
      twoFactorEnabled,
      biometricEnabled,
      sessionTimeout,
      autoLogout,
    } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update display settings
    if (theme || textSize !== undefined || highContrast !== undefined || reduceMotion !== undefined || language) {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          theme: theme || 'light',
          text_size: textSize || 'medium',
          high_contrast: highContrast || false,
          reduce_motion: reduceMotion || false,
          language: language || 'en',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    // Update security settings
    if (twoFactorEnabled !== undefined || biometricEnabled !== undefined || sessionTimeout || autoLogout !== undefined) {
      const { error } = await supabase
        .from('security_settings')
        .upsert({
          user_id: userId,
          two_factor_enabled: twoFactorEnabled || false,
          biometric_enabled: biometricEnabled || false,
          session_timeout: sessionTimeout || 300,
          auto_logout: autoLogout !== undefined ? autoLogout : true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json({
      message: 'Settings updated successfully'
    })
  } catch (error) {
    console.error('[v0] Settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

// POST /api/settings/session-timeout - Update auto-logout timeout
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const userId = request.headers.get('x-user-id')
    const { sessionTimeout } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!sessionTimeout || sessionTimeout < 60) {
      return NextResponse.json(
        { error: 'Session timeout must be at least 60 seconds' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('security_settings')
      .upsert({
        user_id: userId,
        session_timeout: sessionTimeout,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      message: 'Session timeout updated',
      sessionTimeout
    })
  } catch (error) {
    console.error('[v0] Session timeout error:', error)
    return NextResponse.json(
      { error: 'Failed to update session timeout' },
      { status: 500 }
    )
  }
}
