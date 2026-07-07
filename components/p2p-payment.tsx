'use client'

import { useState } from 'react'
import { Send, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface P2PPaymentProps {
  senderName?: string
  senderEmail?: string
  onComplete?: (transactionId: string) => void
}

export function P2PPayment({ senderName = '', senderEmail = '', onComplete }: P2PPaymentProps) {
  const [step, setStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [transactionId, setTransactionId] = useState('')

  const [formData, setFormData] = useState({
    recipientName: '',
    recipientEmail: '',
    amount: '',
    currency: 'USD',
    description: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateStep1 = (): boolean => {
    if (!formData.recipientName.trim()) {
      setErrorMessage('Recipient name is required')
      return false
    }
    if (!formData.recipientEmail.trim() || !formData.recipientEmail.includes('@')) {
      setErrorMessage('Valid recipient email is required')
      return false
    }
    setErrorMessage('')
    return true
  }

  const validateStep2 = (): boolean => {
    const amount = parseFloat(formData.amount)
    if (!formData.amount || amount <= 0) {
      setErrorMessage('Amount must be greater than 0')
      return false
    }
    if (amount > 10000) {
      setErrorMessage('Amount cannot exceed $10,000')
      return false
    }
    if (!formData.description.trim()) {
      setErrorMessage('Description is required')
      return false
    }
    setErrorMessage('')
    return true
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmitPayment = async () => {
    try {
      setIsProcessing(true)
      setTransactionStatus('processing')
      setErrorMessage('')

      console.log('[v0] Processing payment:', formData)

      // Call the payment API
      const response = await fetch('/api/payments/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName,
          senderEmail,
          recipientName: formData.recipientName,
          recipientEmail: formData.recipientEmail,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          description: formData.description,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        console.log('[v0] Payment successful:', data.transactionId)
        setTransactionStatus('success')
        setTransactionId(data.transactionId)
        onComplete?.(data.transactionId)
      } else {
        setTransactionStatus('error')
        setErrorMessage(data.error || 'Payment failed')
      }
    } catch (error) {
      console.error('[v0] Payment error:', error)
      setTransactionStatus('error')
      setErrorMessage('An error occurred while processing the payment')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Step Indicator */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4].map((stepNum) => (
          <div key={stepNum} className="flex flex-col items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                stepNum <= step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {stepNum}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stepNum === 1
                ? 'Recipient'
                : stepNum === 2
                ? 'Amount'
                : stepNum === 3
                ? 'Review'
                : 'Confirm'}
            </p>
            {stepNum < 4 && (
              <div
                className={`h-1 w-16 mt-2 transition-colors ${
                  stepNum < step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <Card className="p-6 border-border">
        {/* Step 1: Recipient Information */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Send Money To</h2>
            <p className="text-muted-foreground">Who would you like to send money to?</p>

            <div>
              <label className="block text-sm font-medium mb-2">Recipient Name</label>
              <input
                type="text"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleInputChange}
                placeholder="Full name of recipient"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                name="recipientEmail"
                value={formData.recipientEmail}
                onChange={handleInputChange}
                placeholder="recipient@example.com"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{errorMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Amount */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">How Much?</h2>
            <p className="text-muted-foreground">Enter the amount you want to send</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-lg">$</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max="10000"
                    className="w-full pl-8 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="What is this payment for? (e.g., Rent, Dinner, Loan repayment)"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground h-24 resize-none"
              />
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{errorMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Review Payment</h2>
            <p className="text-muted-foreground">Please review the details before confirming</p>

            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground">From:</span>
                <span className="font-semibold">{senderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">To:</span>
                <span className="font-semibold">{formData.recipientName}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold text-lg text-primary">
                  {formData.currency} ${parseFloat(formData.amount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">For:</span>
                <span className="font-semibold">{formData.description}</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              A confirmation email will be sent to {formData.recipientEmail}
            </p>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="space-y-4 text-center">
            {transactionStatus === 'processing' && (
              <>
                <Loader className="w-16 h-16 mx-auto text-primary animate-spin" />
                <h2 className="text-2xl font-bold">Processing Payment</h2>
                <p className="text-muted-foreground">Please wait while we process your payment...</p>
              </>
            )}

            {transactionStatus === 'success' && (
              <>
                <CheckCircle className="w-16 h-16 mx-auto text-green-600" />
                <h2 className="text-2xl font-bold text-green-600">Payment Sent!</h2>
                <p className="text-muted-foreground">Your payment has been sent successfully</p>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    Transaction ID: <span className="font-mono">{transactionId}</span>
                  </p>
                  <p className="text-sm text-green-700 mt-2">
                    A confirmation email has been sent to {formData.recipientEmail}
                  </p>
                </div>
              </>
            )}

            {transactionStatus === 'error' && (
              <>
                <AlertCircle className="w-16 h-16 mx-auto text-red-600" />
                <h2 className="text-2xl font-bold text-red-600">Payment Failed</h2>
                <p className="text-muted-foreground">{errorMessage}</p>
              </>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 mt-8 pt-4 border-t border-border">
          {step > 1 && step !== 4 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
          )}

          {step < 3 && (
            <Button onClick={handleNext} className="flex-1">
              Next
            </Button>
          )}

          {step === 3 && (
            <Button
              onClick={() => {
                setStep(4)
                handleSubmitPayment()
              }}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Send Payment'}
            </Button>
          )}

          {step === 4 && transactionStatus === 'success' && (
            <Button onClick={() => window.location.reload()} className="flex-1">
              Done
            </Button>
          )}

          {step === 4 && transactionStatus === 'error' && (
            <Button onClick={() => setStep(1)} className="flex-1">
              Try Again
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
