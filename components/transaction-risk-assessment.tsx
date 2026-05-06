'use client'

import { AlertTriangle, AlertCircle, CheckCircle, TrendingDown } from 'lucide-react'

interface RiskAssessmentProps {
  customerRisk: number
  bankRisk: number
  recommendation: 'ACCEPT' | 'REROUTE' | 'REVIEW'
  availableBalance: number
  amount: number
  warnings?: Array<{
    warning_type: string
    warning_code: string
    warning_message: string
  }>
}

export function TransactionRiskAssessment({
  customerRisk,
  bankRisk,
  recommendation,
  availableBalance,
  amount,
  warnings = [],
}: RiskAssessmentProps) {
  const overallRisk = Math.max(customerRisk, bankRisk)
  const getRiskLevel = (score: number): 'low' | 'medium' | 'high' => {
    if (score < 30) return 'low'
    if (score < 70) return 'medium'
    return 'high'
  }

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900'
      case 'medium':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900'
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900'
    }
  }

  const riskLevel = getRiskLevel(overallRisk)
  const canProceed = availableBalance >= amount

  const getRecommendationIcon = () => {
    switch (recommendation) {
      case 'ACCEPT':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
      case 'REROUTE':
        return <TrendingDown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
      case 'REVIEW':
        return <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
    }
  }

  const getRecommendationText = () => {
    switch (recommendation) {
      case 'ACCEPT':
        return 'Transaction appears safe to process'
      case 'REROUTE':
        return 'Consider using alternative payment method'
      case 'REVIEW':
        return 'Transaction requires manual review'
    }
  }

  return (
    <div className="space-y-4">
      {/* Overall Risk Assessment */}
      <div className={`border rounded-lg p-4 ${getRiskColor(riskLevel)}`}>
        <div className="flex items-start gap-3">
          {riskLevel === 'low' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {riskLevel === 'medium' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {riskLevel === 'high' && <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <div className="flex-1">
            <h3 className="font-semibold mb-1">
              Risk Level: {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
            </h3>
            <p className="text-sm opacity-90">
              Overall transaction risk score: {overallRisk}/99
            </p>
          </div>
        </div>
      </div>

      {/* Risk Scores */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Customer Risk</p>
          <p className="text-lg font-bold text-foreground">{customerRisk}</p>
          <p className="text-xs text-muted-foreground mt-1">Unauthorized debit risk</p>
        </div>
        <div className="border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Bank Risk</p>
          <p className="text-lg font-bold text-foreground">{bankRisk}</p>
          <p className="text-xs text-muted-foreground mt-1">Account/overdraft risk</p>
        </div>
      </div>

      {/* Recommendation */}
      <div className="border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
        <div className="flex items-start gap-3">
          {getRecommendationIcon()}
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              {recommendation}
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {getRecommendationText()}
            </p>
          </div>
        </div>
      </div>

      {/* Balance Check */}
      <div className={`border rounded-lg p-3 ${
        canProceed
          ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950'
          : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950'
      }`}>
        <p className={`text-sm ${
          canProceed
            ? 'text-green-700 dark:text-green-300'
            : 'text-red-700 dark:text-red-300'
        }`}>
          {canProceed ? (
            <>Sufficient balance available for this transaction</>
          ) : (
            <>Insufficient balance - transaction cannot be processed</>
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Available: ${availableBalance.toFixed(2)} | Required: ${amount.toFixed(2)}
        </p>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 rounded-lg p-3">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">
            Warnings
          </p>
          <ul className="space-y-1">
            {warnings.map((warning, idx) => (
              <li key={idx} className="text-xs text-amber-700 dark:text-amber-300">
                • {warning.warning_message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
