'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { useBanking, type ScheduledPayment } from '@/lib/banking-context'
import { Calendar, DollarSign, Trash2, Edit2, CheckCircle, Clock } from 'lucide-react'

interface BillPaymentForm {
  payeeName: string
  amount: string
  dueDate: string
  frequency: 'once' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
  fromAccountId: string
  setupAutopay: boolean
  memo: string
}

export function BillManagement() {
  const { accounts, payees, addPayee, scheduledPayments, addScheduledPayment, cancelScheduledPayment } = useBanking()
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<BillPaymentForm>({
    payeeName: '',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    frequency: 'monthly',
    fromAccountId: accounts[0]?.id || '',
    setupAutopay: false,
    memo: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!form.payeeName.trim()) {
      toast({ title: 'Error', description: 'Please enter payee name', variant: 'destructive' })
      return
    }

    if (!form.amount || Number(form.amount) <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'destructive' })
      return
    }

    if (!form.dueDate) {
      toast({ title: 'Error', description: 'Please select a due date', variant: 'destructive' })
      return
    }

    // Add payee if needed
    if (form.setupAutopay && !payees.some((p) => p.name === form.payeeName)) {
      addPayee({
        name: form.payeeName,
        category: 'Bills',
        accountNumber: '****' + Math.random().toString().slice(2, 6),
        autopay: true,
        nextDueDate: form.dueDate,
        amount: Number(form.amount),
      })
    }

    // Schedule payment
    const scheduledPayment = addScheduledPayment({
      payee: form.payeeName,
      amount: Number(form.amount),
      scheduledDate: form.dueDate,
      frequency: form.frequency,
      accountId: form.fromAccountId,
      category: 'Bills',
      memo: form.memo,
    })

    toast({
      title: 'Success',
      description: `${form.payeeName} bill scheduled for ${new Date(form.dueDate).toLocaleDateString()}`,
    })

    // Reset form
    setForm({
      payeeName: '',
      amount: '',
      dueDate: new Date().toISOString().split('T')[0],
      frequency: 'monthly',
      fromAccountId: accounts[0]?.id || '',
      setupAutopay: false,
      memo: '',
    })
    setShowForm(false)
  }

  const handleCancel = (paymentId: string) => {
    cancelScheduledPayment(paymentId)
    toast({
      title: 'Cancelled',
      description: 'Scheduled payment cancelled',
    })
  }

  const formatFrequency = (freq: string) => {
    const frequencies: Record<string, string> = {
      once: 'One-time',
      weekly: 'Weekly',
      biweekly: 'Biweekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly',
    }
    return frequencies[freq] || freq
  }

  const getNextPaymentDate = (payment: ScheduledPayment) => {
    const date = new Date(payment.nextPaymentDate || payment.scheduledDate)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const upcomingPayments = scheduledPayments.filter((p) => p.status === 'scheduled').sort((a, b) => {
    const aDate = new Date(a.scheduledDate).getTime()
    const bDate = new Date(b.scheduledDate).getTime()
    return aDate - bDate
  })

  return (
    <div className="space-y-6">
      {/* Header with Add Bill Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bill Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage and schedule your bills and payments</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          {showForm ? 'Cancel' : '+ Schedule Bill'}
        </Button>
      </div>

      {/* Add Bill Form */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Schedule New Bill</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payee Name *</Label>
                <Input
                  placeholder="e.g. Con Edison"
                  value={form.payeeName}
                  onChange={(e) => setForm({ ...form, payeeName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Amount *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="pl-8"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>From Account *</Label>
                <Select value={form.fromAccountId} onValueChange={(v) => setForm({ ...form, fromAccountId: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter((a) => a.type === 'checking' || a.type === 'savings')
                      .map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} (${acc.balance.toLocaleString()})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Due Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    type="date"
                    className="pl-10"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">One-time Payment</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Biweekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Memo</Label>
                <Input
                  placeholder="Optional note"
                  value={form.memo}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="autopay"
                checked={form.setupAutopay}
                onCheckedChange={(c) => setForm({ ...form, setupAutopay: c as boolean })}
              />
              <Label htmlFor="autopay" className="cursor-pointer">
                Set up AutoPay for this bill
              </Label>
            </div>

            <Button type="submit" className="w-full">
              Schedule Bill Payment
            </Button>
          </form>
        </div>
      )}

      {/* Upcoming Payments */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Upcoming Payments ({upcomingPayments.length})
        </h3>

        {upcomingPayments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No scheduled bills</p>
            <p className="text-sm text-gray-500 mt-1">Create your first bill schedule to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{payment.payee}</div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                    <span>Due: {getNextPaymentDate(payment)}</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                      {formatFrequency(payment.frequency)}
                    </span>
                    {payment.memo && (
                      <>
                        <span>•</span>
                        <span>{payment.memo}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right flex items-center gap-4">
                  <div>
                    <div className="font-semibold text-gray-900">${payment.amount.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">From {accounts.find((a) => a.id === payment.accountId)?.name}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(payment.id)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleCancel(payment.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Payment History
        </h3>

        {scheduledPayments.filter((p) => p.status === 'completed').length === 0 ? (
          <p className="text-sm text-gray-600 py-4">No completed payments yet</p>
        ) : (
          <div className="space-y-2">
            {scheduledPayments
              .filter((p) => p.status === 'completed')
              .slice(0, 5)
              .map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded text-sm">
                  <div>
                    <span className="font-medium text-gray-900">{payment.payee}</span>
                    <span className="text-gray-600 ml-2">Completed on {new Date(payment.scheduledDate).toLocaleDateString()}</span>
                  </div>
                  <span className="font-medium text-gray-900">${payment.amount.toFixed(2)}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
