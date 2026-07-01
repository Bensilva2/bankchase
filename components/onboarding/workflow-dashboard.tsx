'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  Loader,
  Clock,
  AlertCircle,
} from 'lucide-react'

interface WorkflowRun {
  runId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  steps: Array<{
    name: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    duration?: number
  }>
}

interface WorkflowDashboardProps {
  workflowRunId?: string
}

export function WorkflowDashboard({ workflowRunId }: WorkflowDashboardProps) {
  const [runs, setRuns] = useState<WorkflowRun[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null)

  useEffect(() => {
    if (workflowRunId) {
      fetchWorkflowStatus(workflowRunId)
    }
  }, [workflowRunId])

  const fetchWorkflowStatus = async (runId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/onboarding/status?runId=${runId}`)
      const data = await response.json()

      if (data.success) {
        const newRun: WorkflowRun = {
          runId: data.data.runId,
          status: data.data.status as any,
          createdAt: new Date().toISOString(),
          steps: data.data.steps,
        }
        setRuns(prev => [newRun, ...prev])
        setSelectedRun(newRun)
      }
    } catch (error) {
      console.error('[Dashboard] Error fetching status:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'running':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return null
    }
  }

  const getStepDuration = (step: any) => {
    if (step.duration) {
      return `${step.duration}ms`
    }
    return '—'
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Summary */}
      <Card className="bg-card border-border p-6">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Workflow Monitoring
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Total Runs</p>
            <p className="text-2xl font-bold text-foreground">{runs.length}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {runs.filter(r => r.status === 'completed').length}
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">Running</p>
            <p className="text-2xl font-bold text-blue-600">
              {runs.filter(r => r.status === 'running').length}
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-700">Failed</p>
            <p className="text-2xl font-bold text-red-600">
              {runs.filter(r => r.status === 'failed').length}
            </p>
          </div>
        </div>
      </Card>

      {/* Runs List */}
      {runs.length > 0 && (
        <Card className="bg-card border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Recent Workflow Runs
          </h3>
          <div className="space-y-3">
            {runs.map(run => (
              <button
                key={run.runId}
                onClick={() => setSelectedRun(run)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedRun?.runId === run.runId
                    ? 'bg-primary/10 border-primary'
                    : 'bg-muted border-border hover:bg-muted/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(run.status)}
                    <div>
                      <p className="font-medium text-foreground">
                        Run {run.runId.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(run.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    run.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : run.status === 'running'
                      ? 'bg-blue-100 text-blue-700'
                      : run.status === 'failed'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {run.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Selected Run Details */}
      {selectedRun && (
        <Card className="bg-card border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Workflow Steps
          </h3>
          <div className="space-y-3">
            {selectedRun.steps.map((step, idx) => (
              <div
                key={step.name}
                className="flex items-start gap-4 p-4 bg-muted rounded-lg"
              >
                <div className="flex-shrink-0 pt-1">
                  {getStatusIcon(step.status)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {idx + 1}. {step.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Duration: {getStepDuration(step)}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                  step.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : step.status === 'running'
                    ? 'bg-blue-100 text-blue-700'
                    : step.status === 'failed'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {step.status}
                </span>
              </div>
            ))}
          </div>

          {selectedRun.completedAt && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium">
                ✓ Workflow completed successfully
              </p>
              <p className="text-xs text-green-600 mt-1">
                Completed at: {new Date(selectedRun.completedAt).toLocaleString()}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Empty State */}
      {runs.length === 0 && !loading && (
        <Card className="bg-card border-border p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No workflow runs yet. Start an onboarding workflow to see it here.
          </p>
          <Button
            onClick={() => window.location.href = '/onboarding'}
            variant="default"
          >
            Go to Onboarding →
          </Button>
        </Card>
      )}
    </div>
  )
}
