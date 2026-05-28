'use client'

import { useState, useEffect } from 'react'
import { Copy, Download, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface RecoveryCodesProps {
  userId: string
  onComplete?: () => void
}

export function RecoveryCodes({ userId, onComplete }: RecoveryCodesProps) {
  const [codes, setCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [step, setStep] = useState<'generate' | 'view' | 'confirm'>('generate')

  const handleGenerateCodes = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/verification/recovery-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'generate',
        }),
      })

      const data = await response.json()
      setCodes(data.codes)
      setStep('view')
      toast.success('Recovery codes generated')
    } catch (error) {
      toast.error('Failed to generate recovery codes')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    const text = codes.join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Codes copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const element = document.createElement('a')
    const file = new Blob([codes.join('\n')], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = 'recovery-codes.txt'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    setDownloaded(true)
    toast.success('Recovery codes downloaded')
  }

  const handleConfirm = () => {
    setStep('confirm')
    if (onComplete) onComplete()
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-6">Recovery Codes</h2>

      {step === 'generate' && (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-100">Save your recovery codes</p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                If you lose access to your authentication app, these codes can help you regain access to
                your account. Each code can only be used once.
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateCodes}
            disabled={loading}
            className="w-full px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition font-medium"
          >
            {loading ? 'Generating...' : 'Generate Recovery Codes'}
          </button>
        </div>
      )}

      {step === 'view' && codes.length > 0 && (
        <div className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Save these codes in a safe place. You won&apos;t be able to see them again.
            </p>
          </div>

          <div className="bg-background border border-border rounded-lg p-6 font-mono text-sm space-y-2 max-h-64 overflow-auto">
            {codes.map((code, idx) => (
              <div key={idx} className="text-foreground/80">
                {code}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition font-medium"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition font-medium"
            >
              <Download className="w-4 h-4" />
              {downloaded ? 'Downloaded!' : 'Download'}
            </button>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium"
          >
            I've Saved My Codes
          </button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Recovery Codes Saved</h3>
          <p className="text-muted-foreground">
            Your recovery codes have been generated and saved. Use them if you lose access to your
            authentication app.
          </p>
        </div>
      )}
    </div>
  )
}
