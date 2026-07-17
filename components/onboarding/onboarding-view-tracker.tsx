'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

export function OnboardingViewTracker() {
  useEffect(() => {
    posthog.capture('onboarding_viewed')
  }, [])

  return null
}
