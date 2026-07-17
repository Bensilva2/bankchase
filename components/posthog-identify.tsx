'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import posthog from 'posthog-js'

export function PostHogIdentify() {
  const { isLoaded, isSignedIn, user } = useUser()

  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn && user) {
      posthog.identify(user.id, {
        role: (user.publicMetadata?.role as string) ?? 'customer',
      })
    } else {
      posthog.reset()
    }
  }, [isLoaded, isSignedIn, user])

  return null
}
