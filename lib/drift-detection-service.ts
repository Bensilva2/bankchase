/**
 * Behavioral Drift Detection Service
 * 
 * Implements drift detection algorithms for voice behavioral biometrics:
 * - EMA (Exponential Moving Average) with confidence weighting
 * - CUSUM (Cumulative Sum) for statistical process control
 * - Distance-based detection using Mahalanobis distance
 * 
 * Designed for banking voice agent security to distinguish legitimate
 * behavioral changes from potential fraud (coercion, deepfakes, impersonation).
 */

// Types for behavioral features
export interface BehavioralFeatures {
  avg_pause_duration: number      // Average pause between words/phrases (seconds)
  pitch_variation: number         // Standard deviation of pitch (normalized 0-1)
  response_latency_mean: number   // Average time to respond (seconds)
  tempo_wpm: number              // Speaking tempo (words per minute)
  disfluency_rate: number        // Rate of ums, ahs, repetitions (0-1)
}

export interface BehavioralBaseline {
  id: string
  user_id: string
  org_id: string
  avg_pause_duration: number
  pitch_variation: number
  response_latency_mean: number
  tempo_wpm: number
  disfluency_rate: number
  sample_count: number
  confidence_score: number
  update_alpha: number
  drift_score: number
  recent_drift_score?: number
  last_drift_action: string
  recent_deviations: DeviationRecord[]
  cusum_positive: number
  cusum_negative: number
  cusum_threshold: number
  feature_vector: number[]
  consecutive_drift_count?: number
  rolling_risk_multiplier?: number
  adaptive_alpha?: boolean
  last_successful_update?: string
  created_at: string
  updated_at: string
  last_session_at: string
  baseline_version: number
}

export interface DeviationRecord {
  timestamp: string
  key: string
  deviation: number
  old_value: number
  new_value: number
}

export interface DriftDetectionResult {
  drift_detected: boolean
  drift_score: number
  recent_drift_score?: number
  consecutive_drift_count?: number
  action: 'enroll' | 'normal_update' | 'adaptive_update' | 'flag_review' | 'escalate'
  deviations: Record<string, number>
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  algorithm_used: string
  risk_multiplier?: number
  risk_adjustment?: number
  details?: {
    ema_score?: number
    cusum_alert?: boolean
    distance_score?: number
  }
}

export interface DriftDetectionConfig {
  // EMA Configuration
  ema_alpha: number                    // EMA smoothing factor (0.08-0.15 recommended)
  deviation_threshold: number          // Relative deviation threshold (0.3-0.5)
  drift_score_threshold: number        // Overall drift score threshold (0.7)
  max_drift_threshold?: number         // Maximum drift threshold before escalation (0.75)
  
  // CUSUM Configuration
  cusum_threshold: number              // CUSUM alert threshold (5.0)
  cusum_drift: number                  // Allowable drift per sample (0.1)
  
  // Distance Configuration
  mahalanobis_threshold: number        // Mahalanobis distance threshold (3.0)
  
  // Cold start
  cold_start_samples: number           // Minimum samples before detection (5)
  
  // Adaptation
  max_alpha: number                    // Maximum alpha for adaptive updates (0.25)
  alpha_increase_factor: number        // Factor to increase alpha on drift (1.2)
  
  // Risk thresholds
  high_confidence_threshold: number    // Confidence threshold for high trust (0.8)
  low_risk_threshold: number           // Overall risk threshold for updates (0.45)
  
  // Risk adjustment
  consecutive_drift_escalation?: number // Escalate risk after N consecutive drifts (3)
  risk_boost_multiplier?: number        // Multiplier to boost overall risk (1.25)
  consecutive_drift_decay?: number      // Decay rate for consecutive count (1)
}

const DEFAULT_CONFIG: DriftDetectionConfig = {
  ema_alpha: 0.1,
  deviation_threshold: 0.5,
  drift_score_threshold: 0.7,
  max_drift_threshold: 0.75,
  cusum_threshold: 5.0,
  cusum_drift: 0.1,
  mahalanobis_threshold: 3.0,
  cold_start_samples: 5,
  max_alpha: 0.25,
  alpha_increase_factor: 1.2,
  high_confidence_threshold: 0.8,
  low_risk_threshold: 0.45,
  consecutive_drift_escalation: 3,
  risk_boost_multiplier: 1.25,
  consecutive_drift_decay: 1,
}

/**
 * Feature keys used for drift detection
 */
const FEATURE_KEYS: (keyof BehavioralFeatures)[] = [
  'avg_pause_duration',
  'pitch_variation',
  'response_latency_mean',
  'tempo_wpm',
  'disfluency_rate',
]

/**
 * Feature weights for drift scoring
 */
const FEATURE_WEIGHTS: Record<keyof BehavioralFeatures, number> = {
  avg_pause_duration: 0.25,
  pitch_variation: 0.20,
  response_latency_mean: 0.20,
  tempo_wpm: 0.20,
  disfluency_rate: 0.15,
}

/**
 * Calculate relative deviation between two values
 */
function calculateRelativeDeviation(newValue: number, oldValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 1 : 0
  return Math.abs(newValue - oldValue) / (Math.abs(oldValue) + 1e-6)
}

/**
 * Calculate Mahalanobis-like distance between feature vectors
 * Simplified version using weighted Euclidean distance with variance normalization
 */
function calculateFeatureDistance(
  newFeatures: number[],
  baselineFeatures: number[],
  variances: number[] = [0.1, 0.05, 0.3, 20, 0.02] // Default variances
): number {
  if (newFeatures.length !== baselineFeatures.length) {
    throw new Error('Feature vectors must have same length')
  }
  
  let sumSquared = 0
  for (let i = 0; i < newFeatures.length; i++) {
    const diff = newFeatures[i] - baselineFeatures[i]
    const variance = variances[i] || 1
    sumSquared += (diff * diff) / variance
  }
  
  return Math.sqrt(sumSquared)
}

/**
 * Convert BehavioralFeatures to array for distance calculations
 */
function featuresToArray(features: BehavioralFeatures): number[] {
  return FEATURE_KEYS.map(key => features[key])
}

/**
 * EMA (Exponential Moving Average) Drift Detection
 * 
 * Tracks a smoothed baseline for each signal and detects drift when
 * current values deviate significantly from the smoothed baseline.
 */
export function detectDriftEMA(
  baseline: BehavioralBaseline,
  newFeatures: BehavioralFeatures,
  confidence: number,
  config: DriftDetectionConfig = DEFAULT_CONFIG
): DriftDetectionResult {
  const deviations: Record<string, number> = {}
  let driftScore = 0
  
  // Cold start period - use neutral thresholds
  if (baseline.sample_count < config.cold_start_samples) {
    return {
      drift_detected: false,
      drift_score: 0,
      action: 'enroll',
      deviations: {},
      risk_level: 'low',
      algorithm_used: 'ema',
      details: { ema_score: 0 }
    }
  }
  
  // Calculate deviations for each feature
  for (const key of FEATURE_KEYS) {
    const oldValue = baseline[key] ?? newFeatures[key]
    const newValue = newFeatures[key]
    const deviation = calculateRelativeDeviation(newValue, oldValue)
    
    deviations[key] = deviation
    
    // Accumulate weighted drift score
    if (deviation > config.deviation_threshold) {
      const weight = FEATURE_WEIGHTS[key]
      driftScore += weight * Math.min(deviation / config.deviation_threshold, 2)
    }
  }
  
  // Determine drift detection and action
  const driftDetected = driftScore > config.drift_score_threshold
  let action: DriftDetectionResult['action'] = 'normal_update'
  let riskLevel: DriftDetectionResult['risk_level'] = 'low'
  
  if (driftDetected) {
    if (confidence > config.high_confidence_threshold) {
      // Large but confident change → gradual re-baseline
      action = 'adaptive_update'
      riskLevel = 'medium'
    } else if (confidence > 0.5) {
      // Moderate drift with moderate confidence → flag for review
      action = 'flag_review'
      riskLevel = 'high'
    } else {
      // Low confidence drift → escalate, do not update
      action = 'escalate'
      riskLevel = 'critical'
    }
  } else if (driftScore > config.drift_score_threshold * 0.5) {
    riskLevel = 'medium'
  }
  
  return {
    drift_detected: driftDetected,
    drift_score: driftScore,
    action,
    deviations,
    risk_level: riskLevel,
    algorithm_used: 'ema',
    details: { ema_score: driftScore }
  }
}

/**
 * CUSUM (Cumulative Sum) Drift Detection
 * 
 * Statistical process control method that detects shifts in the mean
 * by accumulating deviations from expected values.
 */
export function detectDriftCUSUM(
  baseline: BehavioralBaseline,
  newFeatures: BehavioralFeatures,
  config: DriftDetectionConfig = DEFAULT_CONFIG
): { alert: boolean; cusum_positive: number; cusum_negative: number } {
  // Calculate overall deviation from baseline
  let totalDeviation = 0
  
  for (const key of FEATURE_KEYS) {
    const oldValue = baseline[key] ?? newFeatures[key]
    const newValue = newFeatures[key]
    const deviation = calculateRelativeDeviation(newValue, oldValue)
    totalDeviation += deviation * FEATURE_WEIGHTS[key]
  }
  
  // Update CUSUM statistics
  const deviation = totalDeviation - config.cusum_drift
  
  let cusumPositive = Math.max(0, baseline.cusum_positive + deviation)
  let cusumNegative = Math.max(0, baseline.cusum_negative - deviation)
  
  // Check for alert
  const alert = cusumPositive > config.cusum_threshold || cusumNegative > config.cusum_threshold
  
  return {
    alert,
    cusum_positive: cusumPositive,
    cusum_negative: cusumNegative
  }
}

/**
 * Distance-based Drift Detection using Mahalanobis-like distance
 */
export function detectDriftDistance(
  baseline: BehavioralBaseline,
  newFeatures: BehavioralFeatures,
  config: DriftDetectionConfig = DEFAULT_CONFIG
): { alert: boolean; distance: number } {
  const newVector = featuresToArray(newFeatures)
  const baselineVector = baseline.feature_vector || featuresToArray({
    avg_pause_duration: baseline.avg_pause_duration,
    pitch_variation: baseline.pitch_variation,
    response_latency_mean: baseline.response_latency_mean,
    tempo_wpm: baseline.tempo_wpm,
    disfluency_rate: baseline.disfluency_rate,
  })
  
  const distance = calculateFeatureDistance(newVector, baselineVector)
  const alert = distance > config.mahalanobis_threshold
  
  return { alert, distance }
}

/**
 * Hybrid Drift Detection
 * 
 * Combines EMA, CUSUM, and distance-based methods for robust detection.
 * Primary: EMA with confidence weighting
 * Secondary: CUSUM for SPC guardrails
 * Tertiary: Distance-based for anomaly detection
 */
export function detectDriftHybrid(
  baseline: BehavioralBaseline,
  newFeatures: BehavioralFeatures,
  confidence: number,
  config: DriftDetectionConfig = DEFAULT_CONFIG
): DriftDetectionResult {
  // Primary: EMA detection
  const emaResult = detectDriftEMA(baseline, newFeatures, confidence, config)
  
  // Cold start - return EMA result directly
  if (emaResult.action === 'enroll') {
    return emaResult
  }
  
  // Secondary: CUSUM detection
  const cusumResult = detectDriftCUSUM(baseline, newFeatures, config)
  
  // Tertiary: Distance-based detection
  const distanceResult = detectDriftDistance(baseline, newFeatures, config)
  
  // Combine results
  let finalAction = emaResult.action
  let finalRiskLevel = emaResult.risk_level
  
  // Escalate if multiple methods detect drift
  const driftSignals = [
    emaResult.drift_detected,
    cusumResult.alert,
    distanceResult.alert
  ].filter(Boolean).length
  
  if (driftSignals >= 2) {
    // Multiple detection methods agree - increase severity
    if (finalRiskLevel === 'low') finalRiskLevel = 'medium'
    else if (finalRiskLevel === 'medium') finalRiskLevel = 'high'
    else if (finalRiskLevel === 'high') finalRiskLevel = 'critical'
    
    if (finalAction === 'normal_update') finalAction = 'adaptive_update'
    else if (finalAction === 'adaptive_update') finalAction = 'flag_review'
  }
  
  // Single anomaly detection by distance can also trigger review
  if (distanceResult.alert && !emaResult.drift_detected) {
    if (finalAction === 'normal_update') {
      finalAction = 'flag_review'
      finalRiskLevel = 'medium'
    }
  }
  
  return {
    ...emaResult,
    action: finalAction,
    risk_level: finalRiskLevel,
    drift_score: emaResult.drift_score + (cusumResult.alert ? 0.2 : 0) + (distanceResult.alert ? 0.2 : 0),
    details: {
      ema_score: emaResult.drift_score,
      cusum_alert: cusumResult.alert,
      distance_score: distanceResult.distance
    }
  }
}

/**
 * Update baseline with new features using EMA smoothing
 */
export function updateBaselineEMA(
  baseline: BehavioralBaseline,
  newFeatures: BehavioralFeatures,
  confidence: number,
  driftResult: DriftDetectionResult,
  config: DriftDetectionConfig = DEFAULT_CONFIG
): Partial<BehavioralBaseline> {
  // Determine update alpha based on drift detection result
  let alpha = baseline.update_alpha
  
  if (driftResult.action === 'adaptive_update') {
    // Temporarily increase adaptation rate for large confident changes
    alpha = Math.min(alpha * config.alpha_increase_factor, config.max_alpha)
  } else if (driftResult.action === 'escalate' || driftResult.action === 'flag_review') {
    // Do not update baseline for suspicious drift
    return {
      drift_score: driftResult.drift_score,
      last_drift_action: driftResult.action,
    }
  }
  
  // Weight update by confidence
  const effectiveAlpha = alpha * confidence
  
  // Update feature values using EMA
  const updates: Partial<BehavioralBaseline> = {
    avg_pause_duration: (1 - effectiveAlpha) * baseline.avg_pause_duration + effectiveAlpha * newFeatures.avg_pause_duration,
    pitch_variation: (1 - effectiveAlpha) * baseline.pitch_variation + effectiveAlpha * newFeatures.pitch_variation,
    response_latency_mean: (1 - effectiveAlpha) * baseline.response_latency_mean + effectiveAlpha * newFeatures.response_latency_mean,
    tempo_wpm: (1 - effectiveAlpha) * baseline.tempo_wpm + effectiveAlpha * newFeatures.tempo_wpm,
    disfluency_rate: (1 - effectiveAlpha) * baseline.disfluency_rate + effectiveAlpha * newFeatures.disfluency_rate,
    sample_count: baseline.sample_count + 1,
    update_alpha: alpha,
    drift_score: driftResult.drift_score,
    last_drift_action: driftResult.action,
    last_session_at: new Date().toISOString(),
  }
  
  // Update feature vector
  updates.feature_vector = featuresToArray({
    avg_pause_duration: updates.avg_pause_duration!,
    pitch_variation: updates.pitch_variation!,
    response_latency_mean: updates.response_latency_mean!,
    tempo_wpm: updates.tempo_wpm!,
    disfluency_rate: updates.disfluency_rate!,
  })
  
  // Update CUSUM statistics
  const cusumResult = detectDriftCUSUM(baseline, newFeatures, config)
  updates.cusum_positive = cusumResult.cusum_positive
  updates.cusum_negative = cusumResult.cusum_negative
  
  // Update recent deviations (keep last 10)
  const newDeviations: DeviationRecord[] = []
  for (const key of FEATURE_KEYS) {
    if (driftResult.deviations[key] > config.deviation_threshold * 0.5) {
      newDeviations.push({
        timestamp: new Date().toISOString(),
        key,
        deviation: driftResult.deviations[key],
        old_value: baseline[key],
        new_value: newFeatures[key],
      })
    }
  }
  
  updates.recent_deviations = [
    ...newDeviations,
    ...(baseline.recent_deviations || []).slice(0, 10 - newDeviations.length)
  ]
  
  return updates
}

/**
 * Create initial baseline for a new user
 */
export function createInitialBaseline(
  userId: string,
  orgId: string,
  initialFeatures?: Partial<BehavioralFeatures>
): Omit<BehavioralBaseline, 'id' | 'created_at' | 'updated_at'> {
  const defaults: BehavioralFeatures = {
    avg_pause_duration: 0.5,
    pitch_variation: 0.15,
    response_latency_mean: 1.2,
    tempo_wpm: 150.0,
    disfluency_rate: 0.05,
  }
  
  const features = { ...defaults, ...initialFeatures }
  
  return {
    user_id: userId,
    org_id: orgId,
    ...features,
    sample_count: initialFeatures ? 1 : 0,
    confidence_score: 0.5,
    update_alpha: DEFAULT_CONFIG.ema_alpha,
    drift_score: 0,
    last_drift_action: 'enroll',
    recent_deviations: [],
    cusum_positive: 0,
    cusum_negative: 0,
    cusum_threshold: DEFAULT_CONFIG.cusum_threshold,
    feature_vector: featuresToArray(features),
    last_session_at: new Date().toISOString(),
    baseline_version: 1,
  }
}

/**
 * Calculate risk score for fusion with other security signals
 */
export function calculateDriftRiskPenalty(
  baseline: BehavioralBaseline,
  driftResult: DriftDetectionResult
): number {
  // Base penalty from drift score
  let penalty = driftResult.drift_score * 0.15
  
  // Add penalty for recent large deviations
  const recentLargeDeviations = (baseline.recent_deviations || [])
    .filter(d => d.deviation > 0.5)
    .length
  
  if (recentLargeDeviations >= 3) {
    penalty += 0.1
  }
  
  // Add penalty for CUSUM alerts
  if (driftResult.details?.cusum_alert) {
    penalty += 0.05
  }
  
  // Cap penalty
  return Math.min(penalty, 0.3)
}

/**
 * Adjust overall risk based on drift detection result
 * 
 * Implements the hybrid risk adjustment from the advanced algorithms:
 * - Tracks consecutive drift events
 * - Applies risk multiplier for suspected fraud/coercion
 * - Enables adaptive baseline learning for legitimate changes
 * 
 * @param currentRisk Overall risk score (0-1)
 * @param baseline User behavioral baseline with drift metadata
 * @param driftResult Result from drift detection
 * @param config Configuration with risk adjustment parameters
 * @returns Adjusted risk score and action details
 */
export function adjustRiskForDrift(
  currentRisk: number,
  baseline: BehavioralBaseline | null,
  driftResult: DriftDetectionResult,
  config: DriftDetectionConfig = DEFAULT_CONFIG
): {
  adjusted_risk: number
  risk_multiplier: number
  consecutive_drift_count: number
  risk_adjustment: number
  should_escalate: boolean
  action: string
} {
  if (!baseline) {
    return {
      adjusted_risk: currentRisk,
      risk_multiplier: 1.0,
      consecutive_drift_count: 0,
      risk_adjustment: 0,
      should_escalate: false,
      action: 'new_user',
    }
  }

  // Initialize drift tracking fields
  let consecutiveDriftCount = baseline.consecutive_drift_count ?? 0
  let rollingRiskMultiplier = baseline.rolling_risk_multiplier ?? 1.0
  let isAdaptiveDrift = false

  // Update rolling drift score (0.7 EMA + 0.3 new)
  const recentDriftScore = (baseline.recent_drift_score ?? 0) * 0.7 + driftResult.drift_score * 0.3

  // Determine if this is a concerning drift
  const isDriftFlagged = 
    driftResult.drift_score > (config.max_drift_threshold ?? 0.75) ||
    recentDriftScore > 0.65

  if (isDriftFlagged) {
    consecutiveDriftCount++

    // Check if we should allow adaptive learning
    const canAdaptivelyLearn =
      driftResult.action === 'adaptive_update' &&
      consecutiveDriftCount < (config.consecutive_drift_escalation ?? 3)

    if (canAdaptivelyLearn) {
      // Gradual legitimate drift (aging, habit changes, recovery)
      isAdaptiveDrift = true
      rollingRiskMultiplier = Math.max(rollingRiskMultiplier * 1.1, 1.3) // Gentle boost
      driftResult.action = 'adaptive_drift_update'
    } else {
      // Suspicious drift - boost risk significantly
      rollingRiskMultiplier = Math.min(
        rollingRiskMultiplier * (config.risk_boost_multiplier ?? 1.25),
        2.0 // Cap multiplier at 2x
      )
    }
  } else {
    // Drift resolved - decay consecutive count and risk multiplier
    const decayRate = config.consecutive_drift_decay ?? 1
    consecutiveDriftCount = Math.max(0, consecutiveDriftCount - decayRate)
    rollingRiskMultiplier = Math.max(1.0, rollingRiskMultiplier * 0.9)
  }

  // Calculate final risk adjustment
  const riskAdjustment = (rollingRiskMultiplier - 1.0) * (currentRisk + 0.2)
  const adjustedRisk = Math.min(currentRisk * rollingRiskMultiplier + riskAdjustment * 0.1, 1.0)

  // Determine if escalation is needed
  const shouldEscalate =
    driftResult.action === 'escalate' ||
    (consecutiveDriftCount >= (config.consecutive_drift_escalation ?? 3) && !isAdaptiveDrift)

  return {
    adjusted_risk: adjustedRisk,
    risk_multiplier: rollingRiskMultiplier,
    consecutive_drift_count: consecutiveDriftCount,
    risk_adjustment: riskAdjustment,
    should_escalate: shouldEscalate,
    action: shouldEscalate ? 'escalate_for_manual_review' : driftResult.action,
  }
}

/**
 * Prepare drift detection results for audit logging and compliance
 */
export function prepareDriftAuditEntry(
  baseline: BehavioralBaseline,
  driftResult: DriftDetectionResult,
  adjustedRisk: number,
  sessionId?: string
) {
  return {
    user_id: baseline.user_id,
    org_id: baseline.org_id,
    session_id: sessionId,
    drift_detected: driftResult.drift_detected,
    drift_score: Number(driftResult.drift_score.toFixed(4)),
    recent_drift_score: Number((baseline.recent_drift_score ?? 0).toFixed(4)),
    action_taken: driftResult.action,
    consecutive_drift_count: baseline.consecutive_drift_count ?? 0,
    rolling_risk_multiplier: baseline.rolling_risk_multiplier ?? 1.0,
    risk_adjustment: Number((driftResult.risk_adjustment ?? 0).toFixed(4)),
    adjusted_overall_risk: Number(adjustedRisk.toFixed(4)),
    algorithm_used: driftResult.algorithm_used,
    risk_level: driftResult.risk_level,
    escalated: driftResult.action === 'escalate',
    timestamp: new Date().toISOString(),
  }
}

export { DEFAULT_CONFIG, FEATURE_KEYS, FEATURE_WEIGHTS }
