'use client'

import { Descope } from '@descope/nextjs-sdk'
import { useCallback, useState } from 'react'

const PRIMARY_FLOW_ID = 'enchanted-link-with-ip-address-check'
const FALLBACK_FLOW_ID = 'sign-up-or-in'

export default function SignInPage() {
  const [flowId, setFlowId] = useState(PRIMARY_FLOW_ID)
  const [error, setError] = useState<string | null>(null)

  const handleSuccess = useCallback(() => {
    setError(null)
    window.location.assign('/home')
  }, [])

  const handleError = useCallback((event: CustomEvent<{ errorMessage?: string; errorDescription?: string }>) => {
    const message = event.detail?.errorMessage ?? event.detail?.errorDescription ?? 'Unable to sign in.'
    if (flowId === PRIMARY_FLOW_ID && message.toLowerCase().includes('failed loading flow')) {
      setFlowId(FALLBACK_FLOW_ID)
      setError(null)
      return
    }
    setError(message)
  }, [flowId])

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <Descope key={flowId} flowId={flowId} onSuccess={handleSuccess} onError={handleError} />
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      </div>
    </main>
  )
}
