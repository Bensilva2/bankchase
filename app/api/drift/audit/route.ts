import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET - Fetch drift audit logs with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const org_id = searchParams.get('org_id')
    const drift_only = searchParams.get('drift_only') === 'true'
    const risk_level = searchParams.get('risk_level')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    const supabase = await createClient()

    let query = supabase
      .from('drift_audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    if (org_id) {
      query = query.eq('org_id', org_id)
    }

    if (drift_only) {
      query = query.eq('drift_detected', true)
    }

    if (risk_level) {
      query = query.eq('risk_level', risk_level)
    }

    if (start_date) {
      query = query.gte('created_at', start_date)
    }

    if (end_date) {
      query = query.lte('created_at', end_date)
    }

    const { data: logs, error, count } = await query

    if (error) {
      console.error('Fetch audit logs error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch audit logs', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        total: count,
        limit,
        offset,
        has_more: (count || 0) > offset + limit,
      },
    })
  } catch (error) {
    console.error('Fetch audit logs error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * GET statistics and trends from audit logs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, user_id, org_id, days = 30 } = body

    const supabase = await createClient()

    if (action === 'stats') {
      // Get drift detection statistics
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      let query = supabase
        .from('drift_audit_log')
        .select('drift_detected, risk_level, action_taken, created_at')
        .gte('created_at', startDate.toISOString())

      if (user_id) query = query.eq('user_id', user_id)
      if (org_id) query = query.eq('org_id', org_id)

      const { data: logs, error } = await query

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch stats', details: error.message },
          { status: 500 }
        )
      }

      const stats = {
        total_sessions: logs.length,
        drift_detected_count: logs.filter(l => l.drift_detected).length,
        risk_distribution: {
          low: logs.filter(l => l.risk_level === 'low').length,
          medium: logs.filter(l => l.risk_level === 'medium').length,
          high: logs.filter(l => l.risk_level === 'high').length,
          critical: logs.filter(l => l.risk_level === 'critical').length,
        },
        action_distribution: {
          enroll: logs.filter(l => l.action_taken === 'enroll').length,
          normal_update: logs.filter(l => l.action_taken === 'normal_update').length,
          adaptive_update: logs.filter(l => l.action_taken === 'adaptive_update').length,
          flag_review: logs.filter(l => l.action_taken === 'flag_review').length,
          escalate: logs.filter(l => l.action_taken === 'escalate').length,
        },
        drift_rate: logs.length > 0 
          ? (logs.filter(l => l.drift_detected).length / logs.length * 100).toFixed(2) + '%'
          : '0%',
      }

      return NextResponse.json({ success: true, stats, period_days: days })
    }

    if (action === 'trends') {
      // Get daily drift trends
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      let query = supabase
        .from('drift_audit_log')
        .select('drift_detected, drift_score, risk_level, created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      if (user_id) query = query.eq('user_id', user_id)
      if (org_id) query = query.eq('org_id', org_id)

      const { data: logs, error } = await query

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch trends', details: error.message },
          { status: 500 }
        )
      }

      // Group by day
      const dailyTrends: Record<string, {
        date: string
        total: number
        drift_count: number
        avg_drift_score: number
        high_risk_count: number
      }> = {}

      for (const log of logs || []) {
        const date = new Date(log.created_at).toISOString().split('T')[0]
        if (!dailyTrends[date]) {
          dailyTrends[date] = {
            date,
            total: 0,
            drift_count: 0,
            avg_drift_score: 0,
            high_risk_count: 0,
          }
        }
        dailyTrends[date].total++
        if (log.drift_detected) dailyTrends[date].drift_count++
        dailyTrends[date].avg_drift_score += log.drift_score || 0
        if (log.risk_level === 'high' || log.risk_level === 'critical') {
          dailyTrends[date].high_risk_count++
        }
      }

      // Calculate averages
      const trends = Object.values(dailyTrends).map(day => ({
        ...day,
        avg_drift_score: day.total > 0 ? day.avg_drift_score / day.total : 0,
        drift_rate: day.total > 0 ? (day.drift_count / day.total * 100) : 0,
      }))

      return NextResponse.json({ success: true, trends, period_days: days })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "stats" or "trends".' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Audit stats/trends error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}
