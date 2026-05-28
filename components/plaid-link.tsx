'use client'

import { useState } from 'react'
import { ExternalLink, Loader, Check, AlertCircle, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'

interface PlaidLinkProps {
  onSuccess?: (publicToken: string, metadata: any) => void
  onExit?: () => void
}

export function PlaidLink({ onSuccess, onExit }: PlaidLinkProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const initiatePlaidLink = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // In production, this would call your backend to get a link token
      // For demo, we'll simulate the Plaid Link flow
      
      // Simulate getting link token from backend
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      // In real implementation:
      // const response = await fetch('/api/plaid/create-link-token', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      // })
      // const { link_token } = await response.json()
      
      // For now, show a demo modal
      setLinkToken('demo-link-token')
      
      toast.success('Plaid Link initialized. Click "Connect Bank" to continue.')
    } catch (err: any) {
      setError(err.message || 'Failed to initialize Plaid Link')
      toast.error('Failed to initialize Plaid Link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectBank = async () => {
    setIsLoading(true)
    try {
      // Simulate Plaid authentication
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      // Simulate success
      const mockPublicToken = 'public-' + Math.random().toString(36).substr(2, 9)
      const mockMetadata = {
        institution: {
          name: 'Chase Bank',
          institution_id: 'ins_123456',
        },
        accounts: [
          {
            id: 'account_123',
            name: 'Checking Account',
            subtype: 'checking',
            mask: '4567',
          },
        ],
        link_session_id: 'link_session_123',
      }

      toast.success('Bank connected successfully!')
      onSuccess?.(mockPublicToken, mockMetadata)
      setLinkToken(null)
    } catch (err) {
      toast.error('Failed to connect bank account')
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-300">Connection Error</p>
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setError(null)
            initiatePlaidLink()
          }}
          className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition font-medium"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!linkToken) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-xl">
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
            Connect your bank account to see all your accounts and transactions in one place. 
            Plaid securely connects to 12,000+ financial institutions.
          </p>
          <div className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
            <div className="flex gap-2">
              <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Bank-level encryption</span>
            </div>
            <div className="flex gap-2">
              <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Your password is never stored</span>
            </div>
            <div className="flex gap-2">
              <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Automatic balance updates</span>
            </div>
          </div>
        </div>

        <button
          onClick={initiatePlaidLink}
          disabled={isLoading}
          className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Initializing...
            </>
          ) : (
            <>
              <LinkIcon className="w-5 h-5" />
              Connect Your Bank
            </>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-6 border-2 border-dashed border-primary/50 rounded-xl text-center bg-primary/5">
        <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Connect</h3>
        <p className="text-muted-foreground mb-6">
          Click below to securely connect your bank account
        </p>

        <div className="space-y-3">
          <button
            onClick={handleConnectBank}
            disabled={isLoading}
            className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="w-5 h-5" />
                Connect Bank Account
              </>
            )}
          </button>

          <button
            onClick={() => {
              setLinkToken(null)
              onExit?.()
            }}
            disabled={isLoading}
            className="w-full py-2 text-muted-foreground hover:text-foreground transition font-medium text-sm"
          >
            Cancel
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Powered by Plaid • Your connection is secure and encrypted
      </p>
    </div>
  )
}
