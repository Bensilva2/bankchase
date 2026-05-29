import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createInitialBaseline } from '@/lib/drift-detection-service'

/**
 * GET - Fetch user's behavioral baseline
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const org_id = searchParams.get('org_id') || 'default'

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: baseline, error } = await supabase
      .from('behavioral_baselines')
      .select('*')
      .eq('user_id', user_id)
      .eq('org_id', org_id)
      .single()

    if (error || !baseline) {
      return NextResponse.json(
        { error: 'Baseline not found', exists: false },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      exists: true,
      baseline,
    })
  } catch (error) {
    console.error('Fetch baseline error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * POST - Create or reset user's behavioral baseline
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, org_id = 'default', initial_features, reset = false } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check for existing baseline
    const { data: existing } = await supabase
      .from('behavioral_baselines')
      .select('id')
      .eq('user_id', user_id)
      .eq('org_id', org_id)
      .single()

    if (existing && !reset) {
      return NextResponse.json(
        { error: 'Baseline already exists. Set reset=true to overwrite.' },
        { status: 409 }
      )
    }

    // Create new baseline
    const initialBaseline = createInitialBaseline(user_id, org_id, initial_features)

    if (existing && reset) {
      // Delete existing baseline
      await supabase
        .from('behavioral_baselines')
        .delete()
        .eq('id', existing.id)
    }

    const { data: newBaseline, error: insertError } = await supabase
      .from('behavioral_baselines')
      .insert(initialBaseline)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating baseline:', insertError)
      return NextResponse.json(
        { error: 'Failed to create baseline', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      reset: reset && !!existing,
      baseline: newBaseline,
    })
  } catch (error) {
    console.error('Create baseline error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete user's behavioral baseline
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const org_id = searchParams.get('org_id') || 'default'

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('behavioral_baselines')
      .delete()
      .eq('user_id', user_id)
      .eq('org_id', org_id)

    if (error) {
      console.error('Delete baseline error:', error)
      return NextResponse.json(
        { error: 'Failed to delete baseline', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Baseline deleted successfully',
    })
  } catch (error) {
    console.error('Delete baseline error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}
