/**
 * Risk Integration Utilities
 * 
 * Helper functions for integrating drift detection risk adjustments
 * into the overall banking system risk scoring pipeline
 */

import type { BehavioralBaseline, DriftDetectionResult, DriftDetectionConfig } from './drift-detection-service'
import { adjustRiskForDrift, DEFAULT_CONFIG } from './drift-detection-service'

/**
 * Compute overall risk score by fusing multiple signals
 * 
 * Combines:
 * - Voice biometric matching confidence
 * - Liveness detection score
 * - Behavioral drift assessment
 * - Historical fraud patterns
 */
export function computeOverallRisk(
  voiceMatchConfidence: number,
  livenessScore: number,
  baseline: BehavioralBaseline | null,
  driftResult: DriftDetectionResult,
  historicalFraudRisk: number = 0.1,
  config: DriftDetectionConfig = DEFAULT_CONFIG
): {
  overall_risk: number
  voice_component: number
  liveness_component: number
  drift_component: number
  fraud_history_component: number
  risk_factors: string[]
} {
  // Normalize inputs to 0-1 range
  const normalizedVoice = Math.max(0, Math.min(1, 1 - voiceMatchConfidence))
  const normalizedLiveness = Math.max(0, Math.min(1, 1 - livenessScore))
  const driftRisk = Math.max(0, Math.min(1, driftResult.drift_score))
  const normalizedFraudRisk = Math.max(0, Math.min(1, historicalFraudRisk))

  // Weight components
  const weights = {
    voice: 0.25,
    liveness: 0.25,
    drift: 0.35,
    fraud: 0.15,
  }

  // Base risk computation
  let baseRisk =
    normalizedVoice * weights.voice +
    normalizedLiveness * weights.liveness +
    driftRisk * weights.drift +
    normalizedFraudRisk * weights.fraud

  // Apply drift-based risk adjustment for escalation scenarios
  const riskAdjustment = adjustRiskForDrift(baseRisk, baseline, driftResult, config)
  const adjustedRisk = riskAdjustment.adjusted_risk

  // Identify risk factors for logging and UI
  const riskFactors: string[] = []
  if (normalizedVoice > 0.5) riskFactors.push('voice_mismatch')
  if (normalizedLiveness > 0.5) riskFactors.push('liveness_fail')
  if (driftResult.drift_detected) riskFactors.push('behavioral_drift')
  if (riskAdjustment.should_escalate) riskFactors.push('consecutive_drift_escalation')
  if (normalizedFraudRisk > 0.5) riskFactors.push('fraud_history')

  return {
    overall_risk: adjustedRisk,
    voice_component: normalizedVoice,
    liveness_component: normalizedLiveness,
    drift_component: driftRisk,
    fraud_history_component: normalizedFraudRisk,
    risk_factors: riskFactors,
  }
}

/**
 * Determine authentication outcome based on risk score
 * 
 * Returns authentication decision with recommended action
 */
export function getAuthDecision(
  overallRisk: number,
  driftEscalated: boolean
): {
  decision: 'accept' | 'challenge' | 'deny'
  reason: string
  should_collect_additional_verification: boolean
  recommended_challenge: string | null
} {
  if (driftEscalated) {
    return {
      decision: 'challenge',
      reason: 'Multiple consecutive behavioral changes detected',
      should_collect_additional_verification: true,
      recommended_challenge: 'security_questions',
    }
  }

  if (overallRisk > 0.8) {
    return {
      decision: 'deny',
      reason: 'Overall risk score exceeds threshold',
      should_collect_additional_verification: false,
      recommended_challenge: null,
    }
  }

  if (overallRisk > 0.6) {
    return {
      decision: 'challenge',
      reason: 'High risk score detected',
      should_collect_additional_verification: true,
      recommended_challenge: 'otp_verification',
    }
  }

  if (overallRisk > 0.4) {
    return {
      decision: 'challenge',
      reason: 'Moderate risk detected',
      should_collect_additional_verification: true,
      recommended_challenge: 'device_verification',
    }
  }

  return {
    decision: 'accept',
    reason: 'Risk within acceptable range',
    should_collect_additional_verification: false,
    recommended_challenge: null,
  }
}

/**
 * Log risk assessment for audit trail
 * 
 * Creates structured audit entry for compliance and investigation
 */
export function createRiskAuditLog(
  userId: string,
  orgId: string,
  riskAssessment: ReturnType<typeof computeOverallRisk>,
  authDecision: ReturnType<typeof getAuthDecision>,
  sessionId?: string
) {
  return {
    user_id: userId,
    org_id: orgId,
    session_id: sessionId,
    overall_risk: Number(riskAssessment.overall_risk.toFixed(4)),
    voice_component: Number(riskAssessment.voice_component.toFixed(4)),
    liveness_component: Number(riskAssessment.liveness_component.toFixed(4)),
    drift_component: Number(riskAssessment.drift_component.toFixed(4)),
    fraud_history_component: Number(riskAssessment.fraud_history_component.toFixed(4)),
    risk_factors: riskAssessment.risk_factors,
    auth_decision: authDecision.decision,
    decision_reason: authDecision.reason,
    requires_verification: authDecision.should_collect_additional_verification,
    recommended_challenge: authDecision.recommended_challenge,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Risk thresholds for banking system
 * 
 * Configurable per organization based on risk appetite
 */
export const RISK_THRESHOLDS = {
  CRITICAL: 0.85,      // Automatic denial
  HIGH: 0.65,           // Require MFA/challenge
  MEDIUM: 0.45,         // Require verification
  LOW: 0.25,            // Additional monitoring
  SAFE: 0.0,            // No action required
} as const

/**
 * Get risk level label based on score
 */
export function getRiskLevelLabel(riskScore: number): 'critical' | 'high' | 'medium' | 'low' | 'safe' {
  if (riskScore >= RISK_THRESHOLDS.CRITICAL) return 'critical'
  if (riskScore >= RISK_THRESHOLDS.HIGH) return 'high'
  if (riskScore >= RISK_THRESHOLDS.MEDIUM) return 'medium'
  if (riskScore >= RISK_THRESHOLDS.LOW) return 'low'
  return 'safe'
}
