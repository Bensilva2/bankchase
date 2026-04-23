/**
 * Credit API - Credit score, credit cards, credit journey
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/credit - Get credit score and card information
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get credit score
    const { data: creditScore } = await supabase
      .from('credit_scores')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Get credit cards
    const { data: creditCards } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Get credit utilization
    const { data: utilization } = await supabase
      .from('credit_utilization')
      .select('*')
      .eq('user_id', userId)
      .single()

    return NextResponse.json({
      creditScore: {
        score: creditScore?.score || 750,
        range: `${creditScore?.score || 750}/850`,
        lastUpdated: creditScore?.updated_at || new Date().toISOString(),
        trend: creditScore?.trend || 'stable',
        status: creditScore?.status || 'good'
      },
      creditCards: creditCards || [],
      utilization: {
        used: utilization?.used || 0,
        limit: utilization?.limit || 0,
        percentage: utilization ? (utilization.used / utilization.limit * 100).toFixed(1) : 0
      }
    })
  } catch (error) {
    console.error('[v0] Credit fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit information' },
      { status: 500 }
    )
  }
}

// POST /api/credit/cards - Add or update credit card
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const userId = request.headers.get('x-user-id')
    const {
      cardName,
      cardType, // 'visa' | 'mastercard' | 'amex' | 'discover'
      lastFourDigits,
      creditLimit,
      currentBalance,
      minimumPayment,
      dueDate,
      apr,
    } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!cardName || !cardType || !creditLimit) {
      return NextResponse.json(
        { error: 'Card name, type, and limit are required' },
        { status: 400 }
      )
    }

    // Create or update credit card
    const { data: card, error } = await supabase
      .from('credit_cards')
      .insert([
        {
          user_id: userId,
          name: cardName,
          type: cardType,
          last_four: lastFourDigits,
          credit_limit: creditLimit,
          current_balance: currentBalance || 0,
          minimum_payment: minimumPayment || 0,
          due_date: dueDate,
          apr: apr || 0,
          status: 'active',
          created_at: new Date().toISOString(),
        }
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      message: 'Credit card added successfully',
      card: card[0],
      creditLimit
    })
  } catch (error) {
    console.error('[v0] Create card error:', error)
    return NextResponse.json(
      { error: 'Failed to add credit card' },
      { status: 500 }
    )
  }
}

// GET /api/credit/journey - Get credit journey and tips
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
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
