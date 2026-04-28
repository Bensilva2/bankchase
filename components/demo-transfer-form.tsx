'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

interface TransferFormProps {
  onTransferComplete?: () => void
}

export function DemoTransferForm({ onTransferComplete }: TransferFormProps) {
  const [toAccount, setToAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [days, setDays] = useState('7')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/demo-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_account_number: toAccount,
          amount: parseFloat(amount),
          days_to_refund: parseInt(days),
          notes,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Transfer failed')
      }

      setMessage({
        type: 'success',
        text: `Transfer successful! Transfer ID: ${result.data.transfer_id}`,
      })

      setToAccount('')
      setAmount('')
      setDays('7')
      setNotes('')
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
        <CardTitle>Send Demo Money</CardTitle>
        <CardDescription>Transfer demo funds to a specific account or external account number</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Account Number
            </label>
            <Input
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value)}
              placeholder="e.g., 1234567890 or EXTERNAL-ACC-001"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount ($)
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                required
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this transfer..."
            />
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
            disabled={loading || !toAccount || !amount}
            className="w-full bg-[#0a4fa6] hover:bg-[#003087]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Demo Money
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
