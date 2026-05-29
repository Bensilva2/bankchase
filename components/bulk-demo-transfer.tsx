'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Users, AlertCircle, CheckCircle } from 'lucide-react'

interface BulkTransferProps {
  onTransferComplete?: () => void
}

export function BulkDemoTransfer({ onTransferComplete }: BulkTransferProps) {
  const [amount, setAmount] = useState('')
  const [days, setDays] = useState('7')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleBulkTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/demo-transfer/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          days_to_refund: parseInt(days),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Bulk transfer failed')
      }

      setMessage({
        type: 'success',
        text: `${result.data.message} Total: $${result.data.total_amount_sent.toLocaleString()}`,
      })

      setAmount('')
      setDays('7')
      onTransferComplete?.()
    } catch (error) {
      setMessage({
        type: 'error',
        text: (error as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Demo Transfer</CardTitle>
        <CardDescription>Send demo money to all registered users in your organization</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleBulkTransfer} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount per User ($)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund After (days)
              </label>
              <select
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="7">7 days</option>
                <option value="14">14 days</option>
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              This will send demo money to all active users in your organization.
            </p>
          </div>

          {message && (
            <div
              className={`flex items-gap-2 p-3 rounded-md text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              )}
              {message.text}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !amount}
            className="w-full bg-[#0a4fa6] hover:bg-[#003087]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Send to All Users
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
