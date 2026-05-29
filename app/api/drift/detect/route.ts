import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  detectDriftHybrid,
  updateBaselineEMA,
  createInitialBaseline,
  adjustRiskForDrift,
  prepareDriftAuditEntry,
  type BehavioralFeatures,
  type BehavioralBaseline,
  type DriftDetectionResult,
  DEFAULT_CONFIG,
} from '@/lib/drift-detection-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      org_id = 'default',
      features,
      confidence = 0.8,
      session_id,
    } = body as {
      user_id: string
      org_id?: string
      features: BehavioralFeatures
      confidence?: number
      session_id?: string
    }

    if (!user_id || !features) {
      return NextResponse.json(
        { error: 'user_id and features are required' },
        { status: 400 }
      )
    }

    // Validate features
    const requiredKeys = ['avg_pause_duration', 'pitch_variation', 'response_latency_mean', 'tempo_wpm', 'disfluency_rate']
    for (const key of requiredKeys) {
      if (typeof features[key as keyof BehavioralFeatures] !== 'number') {
        return NextResponse.json(
          { error: `Missing or invalid feature: ${key}` },
          { status: 400 }
        )
      }
    }

    const supabase = await createClient()

    // Fetch existing baseline
    const { data: existingBaseline, error: fetchError } = await supabase
      .from('behavioral_baselines')
      .select('*')
      .eq('user_id', user_id)
      .eq('org_id', org_id)
      .single()

    let baseline: BehavioralBaseline
    let driftResult: DriftDetectionResult
    let isNewUser = false

    if (fetchError || !existingBaseline) {
      // Create new baseline for first-time user
      isNewUser = true
      const initialBaseline = createInitialBaseline(user_id, org_id, features)
      
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

      baseline = newBaseline as BehavioralBaseline
      driftResult = {
        drift_detected: false,
        drift_score: 0,
        action: 'enroll',
        deviations: {},
        risk_level: 'low',
        algorithm_used: 'ema',
      }
    } else {
      baseline = existingBaseline as BehavioralBaseline
      
      // Run drift detection
      driftResult = detectDriftHybrid(baseline, features, confidence, DEFAULT_CONFIG)
      
      // Compute risk adjustment based on drift detection
      const currentOverallRisk = 0.3 // Default low risk baseline (caller can override)
      const riskAdjustment = adjustRiskForDrift(
        currentOverallRisk,
        baseline,
        driftResult,
        DEFAULT_CONFIG
      )
      
      // Update baseline if appropriate
      if (driftResult.action !== 'escalate' && driftResult.action !== 'flag_review') {
        const updates = updateBaselineEMA(baseline, features, confidence, driftResult, DEFAULT_CONFIG)
        
        // Add drift tracking updates
        updates.consecutive_drift_count = riskAdjustment.consecutive_drift_count
        updates.rolling_risk_multiplier = riskAdjustment.risk_multiplier
        updates.recent_drift_score = (baseline.recent_drift_score ?? 0) * 0.7 + driftResult.drift_score * 0.3
        updates.last_successful_update = new Date().toISOString()
        
        const { error: updateError } = await supabase
          .from('behavioral_baselines')
          .update(updates)
          .eq('id', baseline.id)

        if (updateError) {
          console.error('Error updating baseline:', updateError)
        }
      } else {
        // For escalation/review cases, still update the drift counts
        const { error: updateError } = await supabase
          .from('behavioral_baselines')
          .update({
            consecutive_drift_count: riskAdjustment.consecutive_drift_count,
            rolling_risk_multiplier: riskAdjustment.risk_multiplier,
            recent_drift_score: (baseline.recent_drift_score ?? 0) * 0.7 + driftResult.drift_score * 0.3,
          })
          .eq('id', baseline.id)

        if (updateError) {
          console.error('Error updating drift counts:', updateError)
        }
      }
    }

    // Log drift detection event with risk adjustment
    const auditEntry = {
      user_id,
      org_id,
      session_id,
      drift_detected: driftResult.drift_detected,
      drift_score: driftResult.drift_score,
      action_taken: driftResult.action,
      voice_confidence: confidence,
      overall_confidence: confidence,
      deviations: driftResult.deviations,
      session_features: features,
      detection_algorithm: driftResult.algorithm_used,
      risk_level: driftResult.risk_level,
      escalated: driftResult.action === 'escalate',
      client_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    }

    await supabase.from('drift_audit_log').insert(auditEntry)

    return NextResponse.json({
      success: true,
      is_new_user: isNewUser,
      baseline_id: baseline.id,
      sample_count: baseline.sample_count,
      drift_result: driftResult,
      risk_penalty: driftResult.drift_score * 0.15,
      consecutive_drift_count: baseline.consecutive_drift_count ?? 0,
      rolling_risk_multiplier: baseline.rolling_risk_multiplier ?? 1.0,
    })
  } catch (error) {
    console.error('Drift detection error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}
