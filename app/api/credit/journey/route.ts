/**
 * Credit Journey API - Get credit journey and recommendations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/credit/journey - Get credit journey and tips
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get credit journey data
    const { data: journey } = await supabase
      .from('credit_journey')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Provide credit building recommendations
    const recommendations = [
      {
        id: 1,
        title: 'Pay Bills On Time',
        description: 'Payment history accounts for 35% of your credit score',
        status: 'in_progress',
        impact: 'High'
      },
      {
        id: 2,
        title: 'Lower Credit Utilization',
        description: 'Keep your credit card balances below 30% of your limits',
        status: 'in_progress',
        impact: 'High'
      },
      {
        id: 3,
        title: 'Keep Old Accounts Open',
        description: 'Length of credit history accounts for 15% of your score',
        status: 'achieved',
        impact: 'Medium'
      }
    ]

    return NextResponse.json({
      journey: journey || {},
      recommendations,
      score: journey?.score || 750,
      nextUpdate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
  } catch (error) {
    console.error('[v0] Credit journey fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit journey' },
      { status: 500 }
    )
  }
}
