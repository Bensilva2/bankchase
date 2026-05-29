# Risk Adjustment System for Behavioral Drift Detection

## Overview

The Enhanced Risk Adjustment System integrates behavioral drift detection with overall banking system risk scoring. It implements a sophisticated approach that combines EWMA (Exponential Weighted Moving Average), CUSUM-style deviation scoring, and confidence-gating to detect both gradual legitimate changes and sudden fraudulent shifts in user behavior.

## Key Components

### 1. Drift Detection Service (`lib/drift-detection-service.ts`)

Core algorithms for detecting behavioral changes:

- **EMA-based Detection**: Tracks smoothed baseline for each signal
- **CUSUM Statistical Control**: Detects sudden mean shifts
- **Distance-based Detection**: Mahalanobis-like distance for multi-signal changes
- **Hybrid Approach**: Combines all three methods for robust detection

### 2. Risk Adjustment Functions

#### `adjustRiskForDrift()`
Main function for computing risk impact:
- Tracks consecutive drift events
- Applies rolling risk multiplier
- Enables adaptive learning for legitimate changes
- Escalates on suspicious patterns

```typescript
const riskAdjustment = adjustRiskForDrift(
  currentRisk,           // Base risk score (0-1)
  baseline,              // User behavioral baseline
  driftResult,           // Drift detection result
  DEFAULT_CONFIG         // Configuration with thresholds
)

// Returns:
// - adjusted_risk: Final risk score with multiplier applied
// - risk_multiplier: Current multiplier (1.0 = no adjustment, 1.25 = 25% boost)
// - consecutive_drift_count: Number of consecutive drift events
// - should_escalate: Whether to escalate for manual review
```

### 3. Risk Integration (`lib/risk-integration.ts`)

Helper functions for multi-signal risk fusion:

#### `computeOverallRisk()`
Combines multiple security signals:

```typescript
const assessment = computeOverallRisk(
  voiceMatchConfidence,   // 0-1, higher = better match
  livenessScore,          // 0-1, higher = more alive
  baseline,               // User behavioral baseline
  driftResult,            // Drift detection result
  historicalFraudRisk     // 0-1, risk from fraud history
)

// Weights:
// - Voice: 25%
// - Liveness: 25%
// - Drift: 35%  ← Most important
// - Fraud History: 15%
```

#### `getAuthDecision()`
Maps risk scores to authentication decisions:

```typescript
const decision = getAuthDecision(overallRisk, driftEscalated)
// Returns: { decision: 'accept' | 'challenge' | 'deny', reason, recommended_challenge }

// Risk thresholds:
// - 0.85+:  DENY (automatic)
// - 0.65-0.84:  CHALLENGE with MFA
// - 0.45-0.64:  CHALLENGE with verification
// - 0.25-0.44:  Enhanced monitoring
// - 0-0.24:  ACCEPT
```

## Risk Adjustment Logic

### Consecutive Drift Tracking

```
Normal behavior → Baseline matches well → consecutive_drift_count = 0, multiplier = 1.0

Session 1: Large deviation detected
  ├─ If high confidence → adaptive_update (gradual rebaseline)
  │  └─ consecutive_drift_count = 1, multiplier = 1.1
  ├─ If moderate confidence → flag_review
  │  └─ consecutive_drift_count = 1, multiplier = 1.2
  └─ If low confidence → escalate
     └─ consecutive_drift_count = 1, multiplier = 1.25

Session 2: Another deviation
  ├─ If still adaptive learning → multiplier += 10%
  │  └─ consecutive_drift_count = 2, multiplier = 1.2
  └─ If not adaptive → multiplier *= 1.25
     └─ consecutive_drift_count = 2, multiplier = 1.5

Session 3+: Exceeds escalation threshold (default: 3)
  ├─ If not adaptive → ESCALATE
  │  └─ consecutive_drift_count ≥ 3, multiplier capped at 2.0
  └─ Manual review required
```

### Adaptive Learning vs. Escalation

The system distinguishes between:

1. **Legitimate Drift** (Adaptive Learning)
   - High confidence voice matches (>0.85)
   - Gradual changes (aging, habits, recovery)
   - Limited consecutive drift count (<3)
   - **Action**: Increase `update_alpha` for faster rebaseline

2. **Suspicious Drift** (Escalation)
   - Low confidence (<0.5)
   - Sudden changes (>0.75 drift score)
   - Multiple consecutive events (≥3)
   - **Action**: Boost risk multiplier, flag for manual review

## Configuration

Default thresholds in `DEFAULT_CONFIG`:

```typescript
{
  // Drift detection
  ema_alpha: 0.1,                    // EMA smoothing (0.08-0.15)
  drift_score_threshold: 0.7,        // Trigger threshold
  max_drift_threshold: 0.75,         // Escalation threshold
  
  // Risk adjustment
  consecutive_drift_escalation: 3,   // Escalate after N consecutive
  risk_boost_multiplier: 1.25,       // Multiplier on suspicious drift
  consecutive_drift_decay: 1,        // Decay rate per normal session
}
```

### Tuning Recommendations

| Parameter | Range | Effect |
|-----------|-------|--------|
| `max_drift_threshold` | 0.6-0.8 | Lower = stricter, fewer false alarms → escalation |
| `consecutive_drift_escalation` | 2-5 | Lower = faster escalation, higher = more tolerance |
| `risk_boost_multiplier` | 1.15-1.5 | Higher = more aggressive risk boost |
| `update_alpha` (adaptive) | 0.15-0.25 | Higher = faster rebaseline on legitimate drift |

## API Integration

### Detection Endpoint

**POST `/api/drift/detect`**

```json
{
  "user_id": "uuid",
  "org_id": "org-123",
  "features": {
    "avg_pause_duration": 0.52,
    "pitch_variation": 0.18,
    "response_latency_mean": 1.3,
    "tempo_wpm": 145,
    "disfluency_rate": 0.08
  },
  "confidence": 0.92,
  "session_id": "session-xyz"
}
```

**Response:**

```json
{
  "success": true,
  "baseline_id": "baseline-uuid",
  "drift_result": {
    "drift_detected": true,
    "drift_score": 0.68,
    "action": "adaptive_drift_update",
    "risk_level": "medium"
  },
  "consecutive_drift_count": 1,
  "rolling_risk_multiplier": 1.1,
  "risk_penalty": 0.10
}
```

## Audit Logging

Every drift detection event is logged with full context:

```typescript
{
  user_id: "user-123",
  org_id: "org-456",
  drift_detected: true,
  drift_score: 0.68,
  action_taken: "adaptive_drift_update",
  consecutive_drift_count: 1,
  rolling_risk_multiplier: 1.1,
  adjusted_overall_risk: 0.33,  // 0.3 * 1.1
  algorithm_used: "hybrid",
  escalated: false,
  timestamp: "2026-04-28T10:30:00Z"
}
```

## Compliance & Security

### Row-Level Security (RLS)

All behavioral baseline data is protected with RLS policies:
- Users can only access their own baselines
- Org admins can view organization-wide drift statistics
- Audit logs are immutable for compliance

### Data Retention

- Behavioral baselines: 2 years (updated continuously)
- Drift audit logs: 7 years (regulatory requirement)
- Recent deviations: Keep last 20 events for trend analysis

## Monitoring & Alerts

### Dashboard Metrics

The `RiskAdjustmentMetrics` component displays:
- Current adjusted risk score
- Risk multiplier trend (7-day)
- Consecutive drift count
- Escalation indicators

### Alert Conditions

| Condition | Severity | Action |
|-----------|----------|--------|
| consecutive_drift_count ≥ 3 | **HIGH** | Manual review required |
| rolling_risk_multiplier > 1.5 | **MEDIUM** | Enhanced verification |
| drift_score > 0.8 | **MEDIUM** | Monitor closely |

## Implementation Examples

### Example 1: Complete Risk Assessment Flow

```typescript
// 1. Extract voice features
const features = extractBehavioralFeatures(audioFrame)

// 2. Run drift detection
const driftResult = detectDriftHybrid(baseline, features, voiceConfidence)

// 3. Compute overall risk
const riskAssessment = computeOverallRisk(
  voiceConfidence,
  livenessScore,
  baseline,
  driftResult,
  fraudHistory
)

// 4. Get authentication decision
const authDecision = getAuthDecision(
  riskAssessment.overall_risk,
  riskAdjustment.should_escalate
)

// 5. Take action
if (authDecision.decision === 'accept') {
  // Proceed with transaction
} else if (authDecision.decision === 'challenge') {
  // Trigger additional verification
  const challenge = authDecision.recommended_challenge
  // e.g., 'security_questions', 'otp_verification', 'device_verification'
} else {
  // Deny and alert
  logSecurityEvent('authentication_denied', riskAssessment)
}
```

### Example 2: Monitoring Organization-wide Drift

```typescript
// Query escalations requiring manual review
const escalations = await supabase
  .from('drift_audit_log')
  .select('*')
  .eq('escalated', true)
  .eq('org_id', orgId)
  .gte('created_at', sevenDaysAgo)
  .order('created_at', { ascending: false })

// Analyze trends
const driftTrend = escalations.reduce((acc, log) => {
  const date = new Date(log.timestamp).toLocaleDateString()
  acc[date] = (acc[date] || 0) + 1
  return acc
}, {})

// Alert if spike detected
const avgDaily = escalations.length / 7
const todayCount = driftTrend[today] || 0
if (todayCount > avgDaily * 2) {
  notifySecurityTeam('Drift escalation spike detected')
}
```

## Troubleshooting

### High False Positive Rate

- Increase `max_drift_threshold` from 0.75 to 0.80
- Increase `consecutive_drift_escalation` from 3 to 4
- Add more enrollment samples (require 10+ instead of 5)

### Users Getting Escalated Unnecessarily

- Enable adaptive learning more aggressively
- Increase `high_confidence_threshold` (e.g., 0.75 instead of 0.80)
- Review voice confidence scores - may indicate poor audio quality

### Fraud Not Being Caught

- Lower `max_drift_threshold` from 0.75 to 0.70
- Reduce `consecutive_drift_escalation` from 3 to 2
- Increase `risk_boost_multiplier` from 1.25 to 1.40
- Review baseline quality for fraud-prone user segments

## Related Files

- `lib/drift-detection-service.ts` - Core algorithms
- `lib/risk-integration.ts` - Risk fusion utilities
- `app/api/drift/detect/route.ts` - Detection endpoint
- `app/api/drift/baseline/route.ts` - Baseline management
- `app/api/drift/audit/route.ts` - Audit log queries
- `components/risk-adjustment-metrics.tsx` - Dashboard display
- `scripts/005_enhance_behavioral_baselines.sql` - Database schema
