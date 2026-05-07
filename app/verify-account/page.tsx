'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { MicrodepositVerification } from '@/components/microdeposit-verification'
import { IdentityVerification } from '@/components/identity-verification'
import { RecoveryCodes } from '@/components/recovery-codes'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

type VerificationStep = 'choose' | 'microdeposit' | 'identity' | 'recovery' | 'complete'

export default function VerifyAccountPage() {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<VerificationStep>('choose')
  const [sessionId, setSessionId] = useState('')
  const [completedMethods, setCompletedMethods] = useState<string[]>([])

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  const handleStartVerification = async (method: string) => {
    try {
      const response = await fetch('/api/verification/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          sessionType: 'signup',
        }),
      })

      const data = await response.json()
      setSessionId(data.id)

      if (method === 'microdeposit') {
        setStep('microdeposit')
      } else if (method === 'identity') {
        setStep('identity')
      }
    } catch (error) {
      console.error('Failed to start verification:', error)
    }
  }

  const handleMethodComplete = (method: string) => {
    setCompletedMethods([...completedMethods, method])
    setStep('choose')
  }

  const handleCompleteAll = () => {
    setStep('recovery')
  }

  const handleRecoveryComplete = () => {
    setStep('complete')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Account Verification</h1>
          <p className="text-muted-foreground">
            Secure your account with additional verification methods
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-12 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between">
            {['Verification Method', 'Complete Verification', 'Recovery Codes', 'Done'].map(
              (label, idx) => (
                <div key={idx} className="flex-1">
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx < (['choose', 'microdeposit', 'identity', 'recovery', 'complete'].indexOf(step) || 0)
                          ? 'bg-green-600 text-white'
                          : idx === (['choose', 'microdeposit', 'identity', 'recovery', 'complete'].indexOf(step) || 0)
                          ? 'bg-primary text-white'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {idx < (['choose', 'microdeposit', 'identity', 'recovery', 'complete'].indexOf(step) || 0) ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    {idx < 3 && (
                      <div
                        className={`flex-1 h-1 mx-2 ${
                          idx < (['choose', 'microdeposit', 'identity', 'recovery', 'complete'].indexOf(step) || 0)
                            ? 'bg-green-600'
                            : 'bg-secondary'
                        }`}
                      ></div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">{label}</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Content */}
        {step === 'choose' && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-2xl p-6 flex gap-4">
              <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">Choose a Verification Method</p>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  We support multiple verification methods. Choose the one that works best for you.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Microdeposits */}
              {!completedMethods.includes('microdeposit') && (
                <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Micro-deposits</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Two small deposits to your bank account
                      </p>
                    </div>
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                      Takes 1-2 business days
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                      Highly secure method
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                      Confirm by entering amounts
                    </li>
                  </ul>
                  <button
                    onClick={() => handleStartVerification('microdeposit')}
                    className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium"
                  >
                    Start Verification
                  </button>
                </div>
              )}

              {/* Identity Matching */}
              {!completedMethods.includes('identity') && (
                <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Identity Matching</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Verify with personal information
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                      Instant verification
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                      Uses your profile data
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
                      Fuzzy matching algorithm
                    </li>
                  </ul>
                  <button
                    onClick={() => handleStartVerification('identity')}
                    className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium"
                  >
                    Start Verification
                  </button>
                </div>
              )}
            </div>

            {completedMethods.length > 0 && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-100">Completed Methods</p>
                    <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                      {completedMethods.join(', ')} verified
                    </p>
                    <button
                      onClick={handleCompleteAll}
                      className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium text-sm"
                    >
                      Continue to Recovery Codes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'microdeposit' && (
          <MicrodepositVerification
            sessionId={sessionId}
            onVerified={() => handleMethodComplete('microdeposit')}
          />
        )}

        {step === 'identity' && (
          <IdentityVerification onVerified={() => handleMethodComplete('identity')} />
        )}

        {step === 'recovery' && (
          <RecoveryCodes userId={user?.id || ''} onComplete={handleRecoveryComplete} />
        )}

        {step === 'complete' && (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <div className="flex justify-center mb-6">
              <CheckCircle className="w-20 h-20 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-3">Account Verified</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Your account has been fully verified with enhanced security. You now have access to all
              banking features.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
