/**
 * Notification Preferences API
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      // Return default preferences if none exist
      return NextResponse.json({
        user_id: userId,
        enable_email: true,
        enable_sms: false,
        enable_push: true,
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('[v0] Error fetching preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const {
      enable_email,
      enable_sms,
      enable_push,
      phone_number,
      email_address,
    } = await request.json()

    // Upsert preferences (create if not exists, update if exists)
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: userId,
          enable_email,
          enable_sms,
          enable_push,
          phone_number,
          email_address,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()

    if (error) {
      console.error('[v0] Database error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.log('[v0] Preferences saved for user:', userId)

    return NextResponse.json({
      message: 'Preferences updated successfully',
      preferences: preferences?.[0],
    })
  } catch (error) {
    console.error('[v0] Error saving preferences:', error)
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    )
  }
}
