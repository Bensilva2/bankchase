'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface MicrodepositVerificationProps {
  sessionId: string
  onVerified: () => void
}

export function MicrodepositVerification({
  sessionId,
  onVerified,
}: MicrodepositVerificationProps) {
  const [step, setStep] = useState<'waiting' | 'confirm' | 'success'>('waiting')
  const [amount1, setAmount1] = useState('')
  const [amount2, setAmount2] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(3)
  const [depositId, setDepositId] = useState('')

  const handleGenerateDeposits = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/verification/microdeposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: sessionId,
          sessionId,
          action: 'generate',
        }),
      })

      if (!response.ok) throw new Error('Failed to generate deposits')

      const data = await response.json()
      setDepositId(data.id)
      setStep('waiting')
      toast.info('Micro-deposits initiated. Check your bank account in 1-2 business days.')
    } catch (error) {
      toast.error('Failed to initiate micro-deposits')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmAmounts = async () => {
    if (!amount1 || !amount2) {
      toast.error('Please enter both amounts')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/verification/microdeposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositId,
          amount1: parseFloat(amount1),
          amount2: parseFloat(amount2),
          action: 'confirm',
        }),
      })

      const data = await response.json()

      if (data.success) {
        setStep('success')
        toast.success('Account verified successfully!')
        onVerified()
      } else {
        setAttempts(data.message.includes('remaining') ? parseInt(data.message.match(/\d+/)[0]) : 0)
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Failed to confirm amounts')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-6">Verify Your Account</h2>

      {step === 'waiting' && (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-4 flex gap-3">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                Waiting for micro-deposits
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                We&apos;ve initiated two small deposits to your account. Please check your bank account
                in 1-2 business days.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Once you receive the deposits, enter the exact amounts below.
            </p>
            <button
              onClick={() => setStep('confirm')}
              className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium"
            >
              I received the deposits
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Enter the two amounts you received in your bank account.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                First Deposit Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount1}
                onChange={(e) => setAmount1(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Second Deposit Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount2}
                onChange={(e) => setAmount2(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              You have {attempts} attempts remaining. Please enter the exact amounts.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleConfirmAmounts}
              disabled={loading || !amount1 || !amount2}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition font-medium"
            >
              {loading ? 'Verifying...' : 'Verify Amounts'}
            </button>
            <button
              onClick={() => setStep('waiting')}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition font-medium"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Account Verified</h3>
          <p className="text-muted-foreground">
            Your account has been successfully verified through micro-deposits.
          </p>
        </div>
      )}
    </div>
  )
}
