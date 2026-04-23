'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Check,
  Clock,
  AlertCircle,
  Send,
  Shield,
  Lock,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'

interface WireTransferStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  timestamp?: string
  error?: string
}

interface WireTransferDashboardProps {
  transferId: string
  amount: number
  recipientName: string
  recipientBank: string
  steps: WireTransferStep[]
  progress: number
  currentStatus: string
  isProcessing?: boolean
  onCancel?: () => void
  onRetry?: () => void
}

export function WireTransferDashboard({
  transferId,
  amount,
  recipientName,
  recipientBank,
  steps,
  progress,
  currentStatus,
  isProcessing = false,
  onCancel,
  onRetry,
}: WireTransferDashboardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
      case 'active':
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
      case 'failed':
        return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
      default:
        return 'bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'active':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStepIcon = (stepId: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      form: <FileText className="h-4 w-4" />,
      review: <FileText className="h-4 w-4" />,
      otp: <Shield className="h-4 w-4" />,
      cot: <Lock className="h-4 w-4" />,
      tax: <FileText className="h-4 w-4" />,
      processing: <Send className="h-4 w-4" />,
    }
    return iconMap[stepId] || <FileText className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-[#0a4fa6] to-[#083d80] text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">Wire Transfer in Progress</h2>
            <p className="text-blue-100 text-sm">ID: {transferId}</p>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-900">
            {isProcessing ? 'Processing' : 'Pending'}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-blue-400">
          <div>
            <p className="text-blue-100 text-sm mb-1">Amount</p>
            <p className="text-xl font-bold">${amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm mb-1">To</p>
            <p className="text-lg font-semibold truncate">{recipientName}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm mb-1">Bank</p>
            <p className="text-lg font-semibold truncate">{recipientBank}</p>
          </div>
        </div>
      </Card>

      {/* Progress Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Overall Progress</h3>
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{currentStatus}</p>
      </Card>

      {/* Steps Timeline */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Verification Steps</h3>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-4">
              {/* Timeline line and dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    step.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900'
                      : step.status === 'active'
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : step.status === 'failed'
                          ? 'bg-red-100 dark:bg-red-900'
                          : 'bg-gray-100 dark:bg-gray-900'
                  }`}
                >
                  {getStatusIcon(step.status)}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-1 h-8 mt-1 ${
                      step.status === 'completed' ? 'bg-green-200' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium flex items-center gap-2">
                    {getStepIcon(step.id)}
                    {step.label}
                  </h4>
                  {step.timestamp && (
                    <span className="text-xs text-gray-500">{step.timestamp}</span>
                  )}
                </div>
                {step.error && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {step.error}
                  </p>
                )}
                {step.status === 'active' && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Waiting for verification...
                  </p>
                )}
              </div>

              {/* Status badge */}
              <div>
                {step.status === 'completed' && (
                  <Check className="h-5 w-5 text-green-600" />
                )}
                {step.status === 'failed' && (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                {step.status === 'active' && (
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Action buttons */}
      {(isProcessing || steps.some((s) => s.status === 'failed')) && (
        <Card className="p-4 flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel Transfer
            </Button>
          )}
          {onRetry && steps.some((s) => s.status === 'failed') && (
            <Button
              onClick={onRetry}
              className="flex-1 bg-[#0a4fa6] hover:bg-[#083d80] text-white"
            >
              Retry Verification
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}
