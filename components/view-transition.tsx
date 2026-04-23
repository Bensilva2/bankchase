"use client"

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react"

interface ViewTransitionProps {
  viewKey: string
  children: ReactNode
  loadingDuration?: number
  showSpinner?: boolean
  className?: string
}

/**
 * Chase-like view transition wrapper.
 * When viewKey changes:
 *   1. Fade out old content (100ms)
 *   2. Show Chase spinner (280ms)
 *   3. Fade in new content (320ms)
 */
export function ViewTransition({
  viewKey,
  children,
  loadingDuration = 280,
  showSpinner = true,
  className = "",
}: ViewTransitionProps) {
  const [phase, setPhase] = useState<"idle" | "fadeOut" | "loading" | "fadeIn">("idle")
  // Cached snapshot of children to display during transitions
  const [snapshot, setSnapshot] = useState<ReactNode>(children)
  const prevKeyRef = useRef(viewKey)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timer2Ref = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (timer2Ref.current) clearTimeout(timer2Ref.current)
  }, [])

  // Update snapshot when children change for the SAME viewKey (normal re-renders)
  useEffect(() => {
    if (viewKey === prevKeyRef.current && phase === "idle") {
      setSnapshot(children)
    }
  }, [children, viewKey, phase])

  // Handle viewKey transitions
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (viewKey === prevKeyRef.current) return

    clearTimers()

    // Phase 1: fade out current content
    setPhase("fadeOut")

    timerRef.current = setTimeout(() => {
      // Phase 2: loading spinner
      setPhase("loading")
      prevKeyRef.current = viewKey

      timer2Ref.current = setTimeout(() => {
        // Phase 3: take snapshot of new children and fade in
        setSnapshot(children)
        setPhase("fadeIn")

        timer2Ref.current = setTimeout(() => {
          setPhase("idle")
        }, 340)
      }, loadingDuration)
    }, 100)

    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewKey])

  // Cleanup on unmount
  useEffect(() => clearTimers, [clearTimers])

  const contentClass = (() => {
    switch (phase) {
      case "fadeOut":
        return "vt-fade-out"
      case "loading":
        return "vt-hidden"
      case "fadeIn":
        return "vt-content-enter"
      default:
        return ""
    }
  })()

  return (
    <div className={`relative min-h-[40dvh] ${className}`}>
      {/* Loading spinner */}
      {phase === "loading" && showSpinner && (
        <div className="flex flex-col items-center justify-center min-h-[40dvh] vt-loading-enter">
          <div className="chase-spinner" />
          <p className="text-xs text-muted-foreground mt-3 font-medium tracking-wide">Loading...</p>
        </div>
      )}

      {/* Content - shows cached snapshot during fadeOut, live children when idle */}
      <div
        className={contentClass}
        style={{ display: phase === "loading" ? "none" : undefined }}
      >
        {phase === "idle" ? children : snapshot}
      </div>
    </div>
  )
}
