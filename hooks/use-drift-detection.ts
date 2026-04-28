import { useState, useCallback } from "react"
import type { BehavioralFeatures, DriftDetectionResult, BehavioralBaseline } from "@/lib/drift-detection-service"

interface UseDriftDetectionOptions {
  orgId?: string
  onDriftDetected?: (result: DriftDetectionResult) => void
  onError?: (error: Error) => void
}

interface DriftDetectionState {
  baseline: BehavioralBaseline | null
  lastResult: DriftDetectionResult | null
  isLoading: boolean
  error: string | null
}

export function useDriftDetection(userId: string | undefined, options: UseDriftDetectionOptions = {}) {
  const { orgId = "default", onDriftDetected, onError } = options

  const [state, setState] = useState<DriftDetectionState>({
    baseline: null,
    lastResult: null,
    isLoading: false,
    error: null,
  })

  /**
   * Fetch the user's current behavioral baseline
   */
  const fetchBaseline = useCallback(async () => {
    if (!userId) return null

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`/api/drift/baseline?user_id=${userId}&org_id=${orgId}`)
      const data = await response.json()

      if (data.exists) {
        setState((prev) => ({ ...prev, baseline: data.baseline, isLoading: false }))
        return data.baseline as BehavioralBaseline
      } else {
        setState((prev) => ({ ...prev, baseline: null, isLoading: false }))
        return null
      }
    } catch (error) {
      const errorMessage = (error as Error).message
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }))
      onError?.(error as Error)
      return null
    }
  }, [userId, orgId, onError])

  /**
   * Run drift detection with new behavioral features
   */
  const detectDrift = useCallback(
    async (features: BehavioralFeatures, confidence: number = 0.8, sessionId?: string) => {
      if (!userId) {
        const error = new Error("User ID is required for drift detection")
        onError?.(error)
        return null
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const response = await fetch("/api/drift/detect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            org_id: orgId,
            features,
            confidence,
            session_id: sessionId,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Drift detection failed")
        }

        const result = data.drift_result as DriftDetectionResult
        
        setState((prev) => ({
          ...prev,
          lastResult: result,
          isLoading: false,
        }))

        // Callback for drift detection
        if (result.drift_detected) {
          onDriftDetected?.(result)
        }

        // Refresh baseline after successful detection
        await fetchBaseline()

        return {
          result,
          isNewUser: data.is_new_user,
          baselineId: data.baseline_id,
          sampleCount: data.sample_count,
          riskPenalty: data.risk_penalty,
        }
      } catch (error) {
        const errorMessage = (error as Error).message
        setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }))
        onError?.(error as Error)
        return null
      }
    },
    [userId, orgId, fetchBaseline, onDriftDetected, onError]
  )

  /**
   * Create or reset the user's baseline
   */
  const resetBaseline = useCallback(
    async (initialFeatures?: Partial<BehavioralFeatures>) => {
      if (!userId) {
        const error = new Error("User ID is required")
        onError?.(error)
        return null
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const response = await fetch("/api/drift/baseline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            org_id: orgId,
            initial_features: initialFeatures,
            reset: true,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to reset baseline")
        }

        setState((prev) => ({
          ...prev,
          baseline: data.baseline,
          lastResult: null,
          isLoading: false,
        }))

        return data.baseline as BehavioralBaseline
      } catch (error) {
        const errorMessage = (error as Error).message
        setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }))
        onError?.(error as Error)
        return null
      }
    },
    [userId, orgId, onError]
  )

  /**
   * Delete the user's baseline
   */
  const deleteBaseline = useCallback(async () => {
    if (!userId) {
      const error = new Error("User ID is required")
      onError?.(error)
      return false
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`/api/drift/baseline?user_id=${userId}&org_id=${orgId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete baseline")
      }

      setState((prev) => ({
        ...prev,
        baseline: null,
        lastResult: null,
        isLoading: false,
      }))

      return true
    } catch (error) {
      const errorMessage = (error as Error).message
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }))
      onError?.(error as Error)
      return false
    }
  }, [userId, orgId, onError])

  /**
   * Simulate behavioral features for testing
   */
  const generateTestFeatures = useCallback((variation: "normal" | "slight" | "large" = "normal"): BehavioralFeatures => {
    const baseFeatures: BehavioralFeatures = {
      avg_pause_duration: 0.5,
      pitch_variation: 0.15,
      response_latency_mean: 1.2,
      tempo_wpm: 150.0,
      disfluency_rate: 0.05,
    }

    const variationFactors = {
      normal: 0.1,  // 10% variation
      slight: 0.3,  // 30% variation
      large: 0.7,   // 70% variation
    }

    const factor = variationFactors[variation]

    return {
      avg_pause_duration: baseFeatures.avg_pause_duration * (1 + (Math.random() - 0.5) * factor),
      pitch_variation: baseFeatures.pitch_variation * (1 + (Math.random() - 0.5) * factor),
      response_latency_mean: baseFeatures.response_latency_mean * (1 + (Math.random() - 0.5) * factor),
      tempo_wpm: baseFeatures.tempo_wpm * (1 + (Math.random() - 0.5) * factor),
      disfluency_rate: Math.max(0, Math.min(1, baseFeatures.disfluency_rate * (1 + (Math.random() - 0.5) * factor))),
    }
  }, [])

  return {
    ...state,
    fetchBaseline,
    detectDrift,
    resetBaseline,
    deleteBaseline,
    generateTestFeatures,
  }
}
