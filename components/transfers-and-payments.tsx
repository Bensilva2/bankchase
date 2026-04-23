'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Send, Plus, Calendar } from 'lucide-react'
import type { AccountWithBalance } from '@/hooks/use-account-management'

interface TransfersAndPaymentsProps {
  accounts: AccountWithBalance[]
  userId: string
  onTransferSuccess?: () => void
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function TransfersAndPayments({
  accounts,
  userId,
  onTransferSuccess,
}: TransfersAndPaymentsProps) {
  const [activeTab, setActiveTab] = useState('internal')
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '')
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const selectedFromAccount = accounts.find((a) => a.id === fromAccountId)

  const handleInternalTransfer = async () => {
    if (!fromAccountId || !toAccountId || !amount) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    if (Number(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Amount must be greater than 0',
        variant: 'destructive',
      })
      return
    }

    if (Number(amount) > (selectedFromAccount?.balance || 0)) {
      toast({
        title: 'Insufficient Balance',
        description: `Available balance: ${formatCurrency(selectedFromAccount?.balance || 0)}`,
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          action: 'transfer',
          fromAccountId,
          toAccountId,
          amount: Number(amount),
          description: `Transfer to ${accounts.find((a) => a.id === toAccountId)?.name}`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: 'Transfer Failed',
          description: data.error || 'Failed to process transfer',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Success',
        description: `Transferred ${formatCurrency(Number(amount))} successfully`,
      })

      setAmount('')
      onTransferSuccess?.()
    } catch (error) {
      console.error('[v0] Transfer error:', error)
      toast({
        title: 'Error',
        description: 'Failed to process transfer',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExternalTransfer = async () => {
    if (!fromAccountId || !amount || !description) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          action: 'external',
          fromAccountId,
          amount: Number(amount),
          description,
          recipientEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: 'Transfer Failed',
          description: data.error || 'Failed to process transfer',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Success',
        description: 'External transfer initiated. It may take 1-3 business days to complete.',
      })

      setAmount('')
      setDescription('')
      setRecipientEmail('')
      onTransferSuccess?.()
    } catch (error) {
      console.error('[v0] External transfer error:', error)
      toast({
        title: 'Error',
        description: 'Failed to process transfer',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSchedulePayment = async () => {
    if (!fromAccountId || !amount || !description || !scheduledDate) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          action: 'scheduled',
          fromAccountId,
          amount: Number(amount),
          description,
          scheduledDate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: 'Failed',
          description: data.error || 'Failed to schedule payment',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Success',
        description: `Payment scheduled for ${new Date(scheduledDate).toLocaleDateString()}`,
      })

      setAmount('')
      setDescription('')
      setScheduledDate('')
      onTransferSuccess?.()
    } catch (error) {
      console.error('[v0] Schedule payment error:', error)
      toast({
        title: 'Error',
        description: 'Failed to schedule payment',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="internal" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Transfer
          </TabsTrigger>
          <TabsTrigger value="external" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            External
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Schedule
          </TabsTrigger>
        </TabsList>

        {/* Internal Transfer Tab */}
        <TabsContent value="internal">
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Transfer Between Accounts</h3>

            <div>
              <Label htmlFor="from-account" className="text-sm font-medium text-gray-700">
                From Account
              </Label>
              <select
                id="from-account"
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} - Balance: {formatCurrency(account.balance)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="to-account" className="text-sm font-medium text-gray-700">
                To Account
              </Label>
              <select
                id="to-account"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {accounts
                  .filter((a) => a.id !== fromAccountId)
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <Label htmlFor="transfer-amount" className="text-sm font-medium text-gray-700">
                Amount
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="transfer-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="pl-6"
                />
              </div>
              {selectedFromAccount && (
                <p className="text-xs text-gray-500 mt-1">
                  Available: {formatCurrency(selectedFromAccount.availableBalance)}
                </p>
              )}
            </div>

            <Button
              onClick={handleInternalTransfer}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isProcessing ? 'Processing...' : 'Transfer Now'}
            </Button>
          </Card>
        </TabsContent>

        {/* External Transfer Tab */}
        <TabsContent value="external">
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Send Money Externally</h3>

            <div>
              <Label htmlFor="from-account-ext" className="text-sm font-medium text-gray-700">
                From Account
              </Label>
              <select
                id="from-account-ext"
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {formatCurrency(account.balance)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="recipient-email" className="text-sm font-medium text-gray-700">
                Recipient Email
              </Label>
              <Input
                id="recipient-email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="ext-amount" className="text-sm font-medium text-gray-700">
                Amount
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="ext-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="pl-6"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Payment for..."
                className="mt-1"
              />
            </div>

            <Button
              onClick={handleExternalTransfer}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isProcessing ? 'Processing...' : 'Send Money'}
            </Button>
          </Card>
        </TabsContent>

        {/* Scheduled Payment Tab */}
        <TabsContent value="scheduled">
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Schedule Payment</h3>

            <div>
              <Label htmlFor="from-account-sch" className="text-sm font-medium text-gray-700">
                From Account
              </Label>
              <select
                id="from-account-sch"
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {formatCurrency(account.balance)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="scheduled-date" className="text-sm font-medium text-gray-700">
                Payment Date
              </Label>
              <Input
                id="scheduled-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="sch-amount" className="text-sm font-medium text-gray-700">
                Amount
              </Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="sch-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="pl-6"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="sch-description" className="text-sm font-medium text-gray-700">
                Bill / Payment Description
              </Label>
              <Input
                id="sch-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Electric Bill"
                className="mt-1"
              />
            </div>

            <Button
              onClick={handleSchedulePayment}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isProcessing ? 'Scheduling...' : 'Schedule Payment'}
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
