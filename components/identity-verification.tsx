'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface IdentityVerificationProps {
  onVerified: () => void
}

export function IdentityVerification({ onVerified }: IdentityVerificationProps) {
  const [step, setStep] = useState<'form' | 'results' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    ssn: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  })
  const [results, setResults] = useState<any>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/verification/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current_user',
          providedData: formData,
          storedDataId: 'current_user',
        }),
      })

      const data = await response.json()
      setResults(data)
      setStep('results')
    } catch (error) {
      toast.error('Identity verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = () => {
    setStep('success')
    toast.success('Identity verified successfully!')
    onVerified()
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-6">Verify Your Identity</h2>

      {step === 'form' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Social Security Number
            </label>
            <input
              type="password"
              name="ssn"
              value={formData.ssn}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="XXX-XX-XXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="New York"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="NY"
                maxLength={2}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ZIP Code
            </label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="10001"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition font-medium"
          >
            {loading ? 'Verifying...' : 'Verify Identity'}
          </button>
        </div>
      )}

      {step === 'results' && results && (
        <div className="space-y-6">
          <div className={`p-4 rounded-lg border ${
            results.overall_match
              ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900'
              : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900'
          }`}>
            <p className={`font-semibold ${
              results.overall_match
                ? 'text-green-900 dark:text-green-100'
                : 'text-red-900 dark:text-red-100'
            }`}>
              Match Score: {(results.overall_score * 100).toFixed(1)}%
            </p>
            <p className={`text-sm mt-1 ${
              results.overall_match
                ? 'text-green-800 dark:text-green-200'
                : 'text-red-800 dark:text-red-200'
            }`}>
              {results.details}
            </p>
          </div>

          <div className="space-y-2">
            {results.results.map((result: any, idx: number) => (
              <div key={idx} className="p-4 bg-background border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground capitalize">{result.field}</p>
                  <span className={`text-sm font-bold ${
                    result.matched ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {(result.score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <p className="text-muted-foreground">
                    Provided: <span className="text-foreground font-mono">{result.provided}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Stored: <span className="text-foreground font-mono">{result.stored}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          {results.overall_match ? (
            <button
              onClick={handleApprove}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
            >
              Approve Verification
            </button>
          ) : (
            <button
              onClick={() => setStep('form')}
              className="w-full px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition font-medium"
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {step === 'success' && (
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Identity Verified</h3>
          <p className="text-muted-foreground">
            Your identity has been successfully verified.
          </p>
        </div>
      )}
    </div>
  )
}
