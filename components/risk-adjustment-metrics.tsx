"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts"
import { AlertTriangle, TrendingUp, Shield, AlertCircle } from "lucide-react"
import { getRiskLevelLabel, RISK_THRESHOLDS } from "@/lib/risk-integration"

interface RiskAdjustmentMetrics {
  user_id: string
  consecutive_drift_count: number
  rolling_risk_multiplier: number
  recent_drift_score: number
  last_successful_update: string
  adaptive_alpha: boolean
}

interface RiskHistory {
  date: string
  risk_multiplier: number
  consecutive_drifts: number
  adjusted_risk: number
}

interface RiskAdjustmentMetricsProps {
  metrics: RiskAdjustmentMetrics
  history?: RiskHistory[]
  baselineRisk?: number
}

/**
 * Risk Adjustment Metrics Dashboard Component
 * 
 * Displays drift detection impact on overall risk scoring:
 * - Consecutive drift count tracking
 * - Rolling risk multiplier trend
 * - Recent drift score history
 * - Risk escalation indicators
 */
export function RiskAdjustmentMetrics({
  metrics,
  history = [],
  baselineRisk = 0.3,
}: RiskAdjustmentMetricsProps) {
  const adjustedRisk = baselineRisk * metrics.rolling_risk_multiplier
  const riskLevel = getRiskLevelLabel(adjustedRisk)
  const riskColor = {
    critical: "text-red-600",
    high: "text-orange-600",
    medium: "text-yellow-600",
    low: "text-blue-600",
    safe: "text-green-600",
  }[riskLevel]

  const riskBgColor = {
    critical: "bg-red-50",
    high: "bg-orange-50",
    medium: "bg-yellow-50",
    low: "bg-blue-50",
    safe: "bg-green-50",
  }[riskLevel]

  return (
    <div className="grid gap-6">
      {/* Risk Summary Card */}
      <Card className={riskBgColor}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Risk Adjustment Summary
              </CardTitle>
              <CardDescription>Based on behavioral drift detection</CardDescription>
            </div>
            <Badge variant="outline" className={riskColor}>
              {riskLevel.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Adjusted Risk Score */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Overall Adjusted Risk</span>
              <span className={`font-bold ${riskColor}`}>
                {(adjustedRisk * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={adjustedRisk * 100} className="h-3" />
            <p className="text-xs text-gray-600">
              Base: {(baselineRisk * 100).toFixed(1)}% → Adjusted: {(adjustedRisk * 100).toFixed(1)}%
            </p>
          </div>

          {/* Risk Multiplier */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Risk Multiplier</p>
              <p className="text-2xl font-bold">
                {metrics.rolling_risk_multiplier.toFixed(2)}x
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Consecutive Drifts</p>
              <p className="text-2xl font-bold">{metrics.consecutive_drift_count}</p>
            </div>
          </div>

          {/* Recent Drift Score */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Recent Drift Score (EMA)</span>
              <span className="font-mono font-bold">
                {(metrics.recent_drift_score * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={metrics.recent_drift_score * 100} className="h-2" />
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  metrics.adaptive_alpha ? "bg-green-500" : "bg-gray-300"
                }`}
              />
              <span>Adaptive Learning {metrics.adaptive_alpha ? "Active" : "Inactive"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  metrics.consecutive_drift_count >= 3 ? "bg-red-500" : "bg-gray-300"
                }`}
              />
              <span>
                {metrics.consecutive_drift_count >= 3
                  ? "Escalation Triggered"
                  : "Normal Operation"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Escalation Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Risk Thresholds</CardTitle>
          <CardDescription>Decision boundaries for authentication</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: "Critical", threshold: RISK_THRESHOLDS.CRITICAL, action: "Deny" },
              { label: "High", threshold: RISK_THRESHOLDS.HIGH, action: "Challenge with MFA" },
              { label: "Medium", threshold: RISK_THRESHOLDS.MEDIUM, action: "Verify Device" },
              { label: "Low", threshold: RISK_THRESHOLDS.LOW, action: "Monitor" },
            ].map((tier) => (
              <div key={tier.label} className="flex items-center justify-between text-sm">
                <span className="font-medium">{tier.label}</span>
                <span className="text-gray-600">{(tier.threshold * 100).toFixed(0)}%</span>
                <span className="text-xs text-gray-500">→ {tier.action}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Trend Chart */}
      {history.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk Multiplier Trend</CardTitle>
            <CardDescription>7-day rolling average</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const d = new Date(value)
                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  }}
                />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} domain={[0, 2]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}
                  formatter={(value) => {
                    if (typeof value === "number") {
                      return value.toFixed(2)
                    }
                    return value
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="risk_multiplier"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  name="Risk Multiplier"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="consecutive_drifts"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  name="Consecutive Drifts"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {metrics.consecutive_drift_count >= 3 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Escalation Alert:</strong> User has {metrics.consecutive_drift_count} consecutive
            drift detections. Manual review recommended.
          </AlertDescription>
        </Alert>
      )}

      {metrics.rolling_risk_multiplier > 1.5 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>High Risk Multiplier:</strong> Current multiplier is {metrics.rolling_risk_multiplier.toFixed(2)}x.
            Enhanced verification recommended.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
