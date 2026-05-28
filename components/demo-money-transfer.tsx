'use client'

import { useState } from 'react'
import { Send, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export function DemoMoneyTransfer() {
  const [transferType, setTransferType] = useState<'single' | 'bulk'>('single')
  const [loading, setLoading] = useState(false)
  const [accountNumber, setAccountNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [daysToRefund, setDaysToRefund] = useState(7)
  const [notes, setNotes] = useState('')
  const [successMessage, setSuccessMessage] = useState<any>(null)

  const handleSingleTransfer = async () => {
    if (!accountNumber || !amount) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/demo-transfer/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_account_number: accountNumber,
          amount: parseFloat(amount),
          days_to_refund: daysToRefund,
          notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Transfer failed')
      }

      const data = await response.json()
      setSuccessMessage(data)
      toast.success('Demo money transferred successfully!')
      
      // Reset form
      setAccountNumber('')
      setAmount('')
      setNotes('')
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkTransfer = async () => {
    if (!amount) {
      toast.error('Please enter an amount')
      return
    }

    if (!confirm(`Send $${amount} to ALL users in the organization?`)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/demo-transfer/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          days_to_refund: daysToRefund,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Bulk transfer failed')
      }

      const data = await response.json()
      setSuccessMessage(data.data)
      toast.success(`Successfully sent demo money to ${data.data.total_users} users!`)
      setAmount('')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Demo Money Transfer</h2>
        <p className="text-muted-foreground text-sm">Send virtual funds to test users or external accounts</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-lg">
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900 dark:text-green-100">
                {successMessage.message}
              </p>
              <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                Transfer ID: {successMessage.transfer_id}
              </p>
              {successMessage.will_refund_in && (
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  ⏰ Will auto-refund in {successMessage.will_refund_in}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transfer Type Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          onClick={() => setTransferType('single')}
          className={`py-3 px-4 font-medium border-b-2 transition ${
            transferType === 'single'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Send to Account
        </button>
        <button
          onClick={() => setTransferType('bulk')}
          className={`py-3 px-4 font-medium border-b-2 transition ${
            transferType === 'bulk'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Bulk to All Users
        </button>
      </div>

      {/* Single Transfer Form */}
      {transferType === 'single' && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Account Number
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Enter account number or user ID"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Works for registered users and external accounts
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Amount ($)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Refund Period (days)
              </label>
              <select
                value={daysToRefund}
                onChange={(e) => setDaysToRefund(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">For external accounts only</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this transfer..."
              rows={3}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <button
            onClick={handleSingleTransfer}
            disabled={loading || !accountNumber || !amount}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Processing...' : 'Send Demo Money'}
          </button>
        </div>
      )}

      {/* Bulk Transfer Form */}
      {transferType === 'bulk' && (
        <div className="space-y-4 mb-6">
          <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-semibold mb-1">Admin Only</p>
              <p>This will send demo money to ALL registered users in your organization.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Amount per User ($)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Each user will receive this amount instantly
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Refund Period (days)
            </label>
            <select
              value={daysToRefund}
              onChange={(e) => setDaysToRefund(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
            </select>
          </div>

          <button
            onClick={handleBulkTransfer}
            disabled={loading || !amount}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Processing...' : 'Send to All Users'}
          </button>
        </div>
      )}

      {/* Info */}
      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          <strong>How it works:</strong> Registered users receive demo money instantly. External accounts show it as "Pending" and auto-refund after the specified period unless spent.
        </p>
      </div>
    </div>
  )
}
