import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      phone: user.phone || '',
      profilePicture: user.profile_picture || null,
      twoFactorEnabled: user.two_factor_enabled || false,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    })
  } catch (error) {
    console.error('[v0] Profile GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, firstName, lastName, phone, profilePicture, twoFactorEnabled } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Find user first
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (findError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user profile
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (firstName !== undefined) updateData.first_name = firstName
    if (lastName !== undefined) updateData.last_name = lastName
    if (phone !== undefined) updateData.phone = phone
    if (profilePicture !== undefined) updateData.profile_picture = profilePicture
    if (twoFactorEnabled !== undefined) updateData.two_factor_enabled = twoFactorEnabled

    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: updated.id,
        email: updated.email,
        firstName: updated.first_name || '',
        lastName: updated.last_name || '',
        phone: updated.phone || '',
        profilePicture: updated.profile_picture || null,
        twoFactorEnabled: updated.two_factor_enabled || false,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
    })
  } catch (error) {
    console.error('[v0] Profile PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
