'use client'

import { useParams } from 'next/navigation'
import useSWR from 'swr'
import axios from 'axios'
import { WorkflowStatus } from '@/components/workflows/WorkflowStatus'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const fetcher = (url: string) =>
  axios.get(url, {
    headers: {
      'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
    },
  }).then(res => res.data)

export default function WorkflowDetailPage() {
  const params = useParams()
  const id = params?.id as string

  const { data: workflow, error, isLoading } = useSWR(
    id ? `${API_URL}/api/workflows/${id}` : null,
    fetcher,
    { revalidateInterval: 5000 }
  )

  const { data: events } = useSWR(
    id ? `${API_URL}/api/workflows/${id}/events` : null,
    fetcher,
    { revalidateInterval: 5000 }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error || !workflow) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-medium">Workflow not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-3xl font-bold text-slate-900 capitalize">
            {workflow.workflow_type.replace('_', ' ')}
          </h1>
          <WorkflowStatus status={workflow.status} />
        </div>
        <p className="text-slate-600">Run ID: {workflow.run_id}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <p className="font-medium text-slate-900 capitalize">{workflow.status}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Created</p>
              <p className="font-medium text-slate-900">
                {new Date(workflow.created_at).toLocaleString()}
              </p>
            </div>
            {workflow.completed_at && (
              <div>
                <p className="text-sm text-slate-600">Completed</p>
                <p className="font-medium text-slate-900">
                  {new Date(workflow.completed_at).toLocaleString()}
                </p>
              </div>
            )}
            {workflow.error_message && (
              <div>
                <p className="text-sm text-slate-600">Error</p>
                <p className="font-medium text-red-600">{workflow.error_message}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Input</h2>
          <pre className="bg-slate-50 p-4 rounded text-xs overflow-auto max-h-64 text-slate-700">
            {JSON.stringify(workflow.input, null, 2)}
          </pre>
        </div>
      </div>

      {workflow.output && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Output</h2>
          <pre className="bg-slate-50 p-4 rounded text-xs overflow-auto max-h-64 text-slate-700">
            {JSON.stringify(workflow.output, null, 2)}
          </pre>
        </div>
      )}

      {events && events.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Execution Events</h2>
          <div className="space-y-2">
            {events.map((event: any, idx: number) => (
              <div key={idx} className="border border-slate-200 rounded p-3 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900 capitalize">
                    {event.event_type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(event.created_at).toLocaleTimeString()}
                  </span>
                </div>
                {event.step_name && (
                  <p className="text-sm text-slate-600 mt-1">Step: {event.step_name}</p>
                )}
                {event.duration_ms && (
                  <p className="text-sm text-slate-600">Duration: {event.duration_ms}ms</p>
                )}
                {event.error_message && (
                  <p className="text-sm text-red-600 mt-1">Error: {event.error_message}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
