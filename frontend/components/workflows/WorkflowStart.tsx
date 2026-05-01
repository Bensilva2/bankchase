'use client'

import { useState } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const workflows = [
  {
    type: 'transfer',
    name: 'Money Transfer',
    description: 'Send money between accounts',
    fields: [
      { name: 'from_account_id', label: 'From Account', type: 'text' },
      { name: 'to_account_id', label: 'To Account', type: 'text' },
      { name: 'amount', label: 'Amount', type: 'number' },
    ]
  },
  {
    type: 'loan-application',
    name: 'Loan Application',
    description: 'Apply for a loan',
    fields: [
      { name: 'loan_amount', label: 'Loan Amount', type: 'number' },
      { name: 'loan_term_months', label: 'Term (Months)', type: 'number' },
    ]
  },
  {
    type: 'dispute',
    name: 'Payment Dispute',
    description: 'Dispute a transaction',
    fields: [
      { name: 'transaction_id', label: 'Transaction ID', type: 'text' },
      { name: 'disputed_amount', label: 'Amount', type: 'number' },
      { name: 'dispute_reason', label: 'Reason', type: 'text' },
    ]
  },
  {
    type: 'bill-payment',
    name: 'Bill Payment',
    description: 'Schedule a bill payment',
    fields: [
      { name: 'payee_name', label: 'Payee', type: 'text' },
      { name: 'amount', label: 'Amount', type: 'number' },
      { name: 'scheduled_date', label: 'Date', type: 'datetime-local' },
    ]
  },
  {
    type: 'account-opening',
    name: 'Open Account',
    description: 'Apply for a new account',
    fields: [
      { name: 'account_type', label: 'Account Type', type: 'text' },
      { name: 'phone_number', label: 'Phone', type: 'tel' },
      { name: 'email', label: 'Email', type: 'email' },
    ]
  },
]

interface WorkflowStartProps {
  onWorkflowStarted: () => void
}

export function WorkflowStart({ onWorkflowStarted }: WorkflowStartProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string | number>>({})

  const workflow = workflows.find(w => w.type === selectedWorkflow)

  const handleStartWorkflow = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
      
      const payload: Record<string, any> = { workflow_type: selectedWorkflow }
      workflow?.fields.forEach(field => {
        if (field.type === 'number') {
          payload[field.name] = parseFloat(String(formData[field.name]))
        } else {
          payload[field.name] = formData[field.name]
        }
      })

      await axios.post(
        `${API_URL}/api/workflows/${selectedWorkflow}`,
        { payload },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      setSelectedWorkflow(null)
      setFormData({})
      onWorkflowStarted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start workflow')
    } finally {
      setLoading(false)
    }
  }

  if (selectedWorkflow) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <button
          onClick={() => {
            setSelectedWorkflow(null)
            setFormData({})
          }}
          className="text-sm text-blue-600 hover:text-blue-700 mb-4"
        >
          ← Back
        </button>

        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {workflow?.name}
        </h2>
        <p className="text-slate-600 text-sm mb-6">{workflow?.description}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleStartWorkflow} className="space-y-4">
          {workflow?.fields.map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {field.label}
              </label>
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  [field.name]: e.target.value
                }))}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition"
          >
            {loading ? 'Starting...' : 'Start Workflow'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-4">Start Workflow</h2>
      
      <div className="space-y-2">
        {workflows.map(w => (
          <button
            key={w.type}
            onClick={() => setSelectedWorkflow(w.type)}
            className="w-full text-left p-4 border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition"
          >
            <h3 className="font-medium text-slate-900">{w.name}</h3>
            <p className="text-sm text-slate-600 mt-1">{w.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
