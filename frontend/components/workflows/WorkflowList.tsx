'use client'

import { Workflow } from '@/types/workflow'
import { WorkflowStatus } from './WorkflowStatus'
import Link from 'next/link'

interface WorkflowListProps {
  workflows?: Workflow[]
  isLoading: boolean
  error?: Error
}

export function WorkflowList({ workflows, isLoading, error }: WorkflowListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 flex items-center justify-center h-96">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-medium">Failed to load workflows</p>
        <p className="text-red-600 text-sm mt-2">{error.message}</p>
      </div>
    )
  }

  if (!workflows || workflows.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-600">No workflows yet</p>
        <p className="text-slate-500 text-sm mt-2">Start a workflow from the right panel</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-slate-900">Recent Workflows</h2>
      <div className="space-y-2">
        {workflows.map((workflow) => (
          <Link
            key={workflow.run_id}
            href={`/workflows/${workflow.run_id}`}
          >
            <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 capitalize">
                    {workflow.workflow_type.replace('_', ' ')}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Run ID: {workflow.run_id.substring(0, 8)}...
                  </p>
                </div>
                <WorkflowStatus status={workflow.status} />
              </div>
              <p className="text-xs text-slate-400 mt-3">
                {new Date(workflow.created_at).toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
