'use client'

import { useState } from 'react'
import { useTransfer } from '@/hooks/use-transfer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'

export function TransferFormWorking() {
  const transfer = useTransfer()
  const [amount, setAmount] = useState('100')
  const [toAccount, setToAccount] = useState('1234567890')
  const [toBankCode, setToBankCode] = useState('DEMO')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const success = await transfer.sendDemo({
      amount: parseFloat(amount),
      toAccountNumber: toAccount,
      toBankCode: toBankCode,
      narration: 'Test transfer'
    })

    if (success) {
      setAmount('100')
      setToAccount('1234567890')
    }
  }

  const fees = transfer.calculateFees(parseFloat(amount) || 0, toBankCode)

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Money Transfer</h2>

        {transfer.error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{transfer.error}</AlertDescription>
          </Alert>
        )}

        {transfer.status === 'completed' && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              Transfer completed successfully! Transaction ID: {transfer.transactionId}
            </AlertDescription>
          </Alert>
        )}

        {transfer.progress && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{transfer.progress.message}</span>
              <span className="text-sm font-medium">{transfer.progress.percent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${transfer.progress.percent}%` }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Amount (USD)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100.00"
              min="0.01"
              step="0.01"
              disabled={transfer.loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Recipient Account</label>
            <Input
              type="text"
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value)}
              placeholder="1234567890"
              disabled={transfer.loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bank Code</label>
            <Input
              type="text"
              value={toBankCode}
              onChange={(e) => setToBankCode(e.target.value)}
              placeholder="DEMO"
              disabled={transfer.loading}
            />
          </div>

          {/* Fee breakdown */}
          <Card className="bg-gray-50 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Amount:</span>
                <span>${parseFloat(amount || '0').toFixed(2)}</span>
              </div>
              {fees.baseFee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Base Fee:</span>
                  <span>${fees.baseFee.toFixed(2)}</span>
                </div>
              )}
              {fees.percentageFee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Processing Fee:</span>
                  <span>${fees.percentageFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-2 border-t">
                <span>Total:</span>
                <span>${fees.total.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          <Button
            type="submit"
            disabled={transfer.loading || !amount}
            className="w-full"
          >
            {transfer.loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Processing...
              </>
            ) : (
              'Send Transfer'
            )}
          </Button>
        </form>

        {transfer.transactionId && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Transaction ID:</strong> {transfer.transactionId}
            </p>
            <p className="text-sm text-blue-900 mt-1">
              <strong>Status:</strong> {transfer.status}
            </p>
          </div>
        )}
      </Card>

      {/* Transaction History */}
      {transfer.transactions.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Recent Transactions</h3>
          <div className="space-y-2">
            {transfer.transactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">${tx.amount.toFixed(2)} {tx.currency}</p>
                  <p className="text-xs text-gray-600">{tx.to_account_number}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    tx.status === 'completed' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {tx.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(tx.initiated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
