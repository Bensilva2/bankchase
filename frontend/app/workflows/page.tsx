'use client'

import { useState } from 'react'
import useSWR from 'swr'
import axios from 'axios'
import { WorkflowList } from '@/components/workflows/WorkflowList'
import { WorkflowStart } from '@/components/workflows/WorkflowStart'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const fetcher = (url: string) =>
  axios.get(url, {
    headers: {
      'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
    },
  }).then(res => res.data)

export default function WorkflowsPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const { data: workflows, error, isLoading } = useSWR(
    `${API_URL}/api/workflows?limit=50&offset=0&key=${refreshKey}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  )

  const handleWorkflowStarted = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Workflows</h1>
        <p className="text-slate-600 mt-2">Manage your banking workflows and transactions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WorkflowList 
            workflows={workflows}
            isLoading={isLoading}
            error={error}
          />
        </div>
        <div>
          <WorkflowStart onWorkflowStarted={handleWorkflowStarted} />
        </div>
      </div>
    </div>
  )
}
