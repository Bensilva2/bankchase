'use client'

import { useState } from 'react'
import { Upload, Camera, Check, AlertCircle, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Navigation } from '@/components/Navigation'
import { useAccounts } from '@/hooks/useAccounts'
import Link from 'next/link'

type DepositStep = 'select' | 'front' | 'back' | 'details' | 'review' | 'complete'

interface DepositData {
  frontImage: File | null
  backImage: File | null
  amount: string
  accountId: string
  checkNumber: string
  memo: string
}

function MobileDepositContent() {
  const { accounts } = useAccounts()
  const [step, setStep] = useState<DepositStep>('select')
  const [depositData, setDepositData] = useState<DepositData>({
    frontImage: null,
    backImage: null,
    amount: '',
    accountId: accounts[0]?.id || '',
    checkNumber: '',
    memo: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [previewUrls, setPreviewUrls] = useState({
    front: '',
    back: '',
  })

  const handleFileCapture = (side: 'front' | 'back', file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    // Create preview URL
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrls((prev) => ({
        ...prev,
        [side]: reader.result as string,
      }))
    }
    reader.readAsDataURL(file)

    // Update deposit data
    setDepositData((prev) => ({
      ...prev,
      [side === 'front' ? 'frontImage' : 'backImage']: file,
    }))

    // Move to next step
    if (side === 'front') {
      setStep('back')
    } else {
      setStep('details')
    }
  }

  const handleSubmitDeposit = async () => {
    if (!depositData.frontImage || !depositData.backImage) {
      toast.error('Both front and back images are required')
      return
    }

    if (!depositData.amount || parseFloat(depositData.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call to process deposit
      // In production: upload images to Vercel Blob and process with backend
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast.success('Check deposit submitted successfully')
      setStep('complete')
    } catch (error) {
      toast.error('Failed to submit deposit')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'select') {
    return (
      <main className="min-h-screen bg-background pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Mobile Check Deposit</h1>
            <p className="text-muted-foreground">Deposit checks using your device camera</p>
          </div>

          {/* Steps Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {['Capture Front', 'Capture Back', 'Enter Details', 'Review', 'Complete'].map(
                (stepLabel, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 ${
                        idx === 0
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">{stepLabel}</p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-xl">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Clear & Well-lit Images
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Take clear photos of both sides of the check under good lighting
              </p>
            </div>
            <div className="p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-xl">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Entire Check Visible
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Make sure all four corners of the check are visible in the photo
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-card border border-border rounded-2xl p-8 space-y-4">
            <button
              onClick={() => setStep('front')}
              className="w-full py-6 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium flex items-center justify-center gap-3 text-lg"
            >
              <Camera className="w-6 h-6" />
              Start with Camera
            </button>

            <button
              onClick={() =>
                document.getElementById('file-input')?.dispatchEvent(new MouseEvent('click'))
              }
              className="w-full py-6 bg-background border-2 border-border hover:border-primary/50 text-foreground rounded-lg transition font-medium flex items-center justify-center gap-3 text-lg"
            >
              <Upload className="w-6 h-6" />
              Upload from Gallery
            </button>

            <input
              id="file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0]
                if (file) handleFileCapture('front', file)
              }}
            />
          </div>

          {/* Benefits */}
          <div className="mt-8 p-6 bg-background rounded-xl border border-border">
            <h3 className="font-semibold text-foreground mb-3">Why Mobile Deposit?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Deposit anytime, anywhere without visiting a branch</span>
              </li>
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Fast processing - funds usually available within 1-2 business days</span>
              </li>
              <li className="flex gap-2">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Secure image storage with encryption</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    )
  }

  if (step === 'front' || step === 'back') {
    const isFront = step === 'front'
    return (
      <main className="min-h-screen bg-background pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Capture Check {isFront ? 'Front' : 'Back'}
            </h1>
            <p className="text-muted-foreground">
              Position the entire check within the frame and ensure good lighting
            </p>
          </div>

          {/* Camera Preview Area */}
          <div className="bg-black rounded-xl overflow-hidden mb-6 aspect-video flex items-center justify-center relative">
            <div className="absolute inset-0 border-2 border-primary/50 m-8 rounded-lg pointer-events-none flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-12 h-12 text-white/50 mx-auto mb-4" />
                <p className="text-white/70">Camera preview would appear here</p>
              </div>
            </div>
          </div>

          {/* File Upload Fallback */}
          <div className="bg-card border-2 border-dashed border-border rounded-xl p-8 text-center mb-6">
            <label className="cursor-pointer">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">
                    Or click to select image from your device
                  </p>
                  <p className="text-sm text-muted-foreground">PNG, JPG up to 5MB</p>
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0]
                  if (file) handleFileCapture(isFront ? 'front' : 'back', file)
                }}
              />
            </label>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep('select')}
              className="flex-1 py-3 border border-border hover:border-primary/50 text-foreground rounded-lg transition font-medium"
            >
              Back
            </button>
            <button
              className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium"
              disabled
            >
              Take Photo (Not supported in browser)
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (step === 'details') {
    return (
      <main className="min-h-screen bg-background pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Check Details</h1>
            <p className="text-muted-foreground">Enter information about the check</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            {/* Images Preview */}
            <div className="grid grid-cols-2 gap-4">
              {previewUrls.front && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Check Front</p>
                  <img
                    src={previewUrls.front}
                    alt="Check front"
                    className="w-full rounded-lg border border-border"
                  />
                </div>
              )}
              {previewUrls.back && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Check Back</p>
                  <img
                    src={previewUrls.back}
                    alt="Check back"
                    className="w-full rounded-lg border border-border"
                  />
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-4 pt-6 border-t border-border">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Deposit To Account
                </label>
                <select
                  value={depositData.accountId}
                  onChange={(e) =>
                    setDepositData((prev) => ({
                      ...prev,
                      accountId: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_type} - {acc.account_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Check Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={depositData.amount}
                    onChange={(e) =>
                      setDepositData((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Check Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., 1001"
                  value={depositData.checkNumber}
                  onChange={(e) =>
                    setDepositData((prev) => ({
                      ...prev,
                      checkNumber: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Memo (Optional)
                </label>
                <textarea
                  placeholder="Add notes about this deposit"
                  value={depositData.memo}
                  onChange={(e) =>
                    setDepositData((prev) => ({
                      ...prev,
                      memo: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-6 border-t border-border">
              <button
                onClick={() => setStep('select')}
                className="flex-1 py-3 border border-border hover:border-primary/50 text-foreground rounded-lg transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('review')}
                className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
              >
                Review <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (step === 'review') {
    return (
      <main className="min-h-screen bg-background pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Review Your Deposit</h1>
            <p className="text-muted-foreground">Please review before submitting</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            {/* Summary */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-4 border-b border-border">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-2xl font-bold text-foreground">${depositData.amount}</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-border">
                <span className="text-muted-foreground">Deposit To</span>
                <span className="text-foreground font-medium">
                  {accounts.find((a) => a.id === depositData.accountId)?.account_type}
                </span>
              </div>
              {depositData.checkNumber && (
                <div className="flex justify-between items-center py-4 border-b border-border">
                  <span className="text-muted-foreground">Check #</span>
                  <span className="text-foreground font-medium">{depositData.checkNumber}</span>
                </div>
              )}
            </div>

            {/* Images */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              {previewUrls.front && (
                <img
                  src={previewUrls.front}
                  alt="Check front"
                  className="rounded-lg border border-border"
                />
              )}
              {previewUrls.back && (
                <img
                  src={previewUrls.back}
                  alt="Check back"
                  className="rounded-lg border border-border"
                />
              )}
            </div>

            {/* Warning */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-300">
                <p className="font-medium mb-1">Important</p>
                <p>Once submitted, you will not be able to edit this deposit. Please review carefully.</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-6 border-t border-border">
              <button
                onClick={() => setStep('details')}
                className="flex-1 py-3 border border-border hover:border-primary/50 text-foreground rounded-lg transition font-medium"
              >
                Back
              </button>
              <button
                onClick={handleSubmitDeposit}
                disabled={isLoading}
                className="flex-1 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg transition font-medium"
              >
                {isLoading ? 'Submitting...' : 'Submit Deposit'}
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Complete step
  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Deposit Submitted</h1>
          <p className="text-muted-foreground mb-6">
            Your check deposit has been received and will be processed
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 max-w-2xl mx-auto space-y-6 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Deposit Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Amount Deposited</span>
                <span className="text-xl font-bold text-foreground">${depositData.amount}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Deposited To</span>
                <span className="text-foreground font-medium">
                  {accounts.find((a) => a.id === depositData.accountId)?.account_number}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-muted-foreground">Reference Number</span>
                <span className="font-mono text-foreground">DEP-20250507-001</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Processing time:</strong> Funds are typically available within 1-2 business days. 
              You&apos;ll receive a notification when the deposit is processed.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 max-w-2xl mx-auto">
          <Link
            href="/transactions"
            className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium text-center"
          >
            View Transaction
          </Link>
          <button
            onClick={() => {
              setStep('select')
              setDepositData({
                frontImage: null,
                backImage: null,
                amount: '',
                accountId: accounts[0]?.id || '',
                checkNumber: '',
                memo: '',
              })
              setPreviewUrls({ front: '', back: '' })
            }}
            className="w-full py-3 border border-border hover:border-primary/50 text-foreground rounded-lg transition font-medium"
          >
            Deposit Another Check
          </button>
        </div>
      </div>
    </main>
  )
}

export default function MobileDepositPage() {
  return (
    <ProtectedRoute>
      <Navigation />
      <MobileDepositContent />
    </ProtectedRoute>
  )
}
