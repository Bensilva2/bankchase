'use client'

import { useState } from 'react'
import { Fingerprint, Loader } from 'lucide-react'

interface BiometricLoginProps {
  onSuccess: () => void
  onFallback: () => void
}

export function BiometricLogin({ onSuccess, onFallback }: BiometricLoginProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)

  const handleBiometricAuth = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        setIsSupported(false)
        setError('Biometric authentication is not supported on this device')
        setIsLoading(false)
        return
      }

      // Check if the device has biometric capability
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      if (!available) {
        setIsSupported(false)
        setError('No biometric sensor found on this device')
        setIsLoading(false)
        return
      }

      // Get the user ID (would be fetched from form in real scenario)
      const userId = localStorage.getItem('biometric_user_id')
      if (!userId) {
        setError('Please enter your credentials first to enable biometric login')
        setIsLoading(false)
        return
      }

      // Attempt WebAuthn authentication
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: 'preferred',
        },
      })

      if (assertion) {
        // Authentication successful
        localStorage.setItem('biometric_authenticated', 'true')
        onSuccess()
      } else {
        setError('Biometric authentication failed')
      }
    } catch (err: any) {
      // Handle cancellation gracefully
      if (err.name === 'NotAllowedError') {
        setError('Biometric authentication was cancelled')
      } else if (err.name === 'InvalidStateError') {
        setError('Biometric enrollment not complete. Please set up biometric login first.')
      } else {
        setError(err.message || 'Biometric authentication failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <button
        onClick={handleBiometricAuth}
        disabled={isLoading || !isSupported}
        className={`w-full py-3 rounded-lg transition font-medium flex items-center justify-center gap-2 ${
          isSupported
            ? 'bg-primary hover:bg-primary/90 text-white disabled:opacity-50'
            : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Authenticating...
          </>
        ) : (
          <>
            <Fingerprint className="w-5 h-5" />
            Use Biometric
          </>
        )}
      </button>

      {isSupported && (
        <button
          onClick={onFallback}
          className="w-full py-2 text-sm text-primary hover:text-primary/80 transition font-medium"
        >
          Use password instead
        </button>
      )}

      {!isSupported && (
        <button
          onClick={onFallback}
          className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium"
        >
          Continue with Password
        </button>
      )}
    </div>
  )
}
