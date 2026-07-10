'use client'

/**
 * Page Loading Manager
 * Handles smooth page transitions and loading states
 */

export interface LoadingState {
  isLoading: boolean
  error: string | null
  progress: number
}

class PageLoadingManager {
  private static instance: PageLoadingManager
  private listeners: Set<(state: LoadingState) => void> = new Set()
  private state: LoadingState = {
    isLoading: false,
    error: null,
    progress: 0,
  }

  private constructor() {}

  static getInstance(): PageLoadingManager {
    if (!PageLoadingManager.instance) {
      PageLoadingManager.instance = new PageLoadingManager()
    }
    return PageLoadingManager.instance
  }

  subscribe(listener: (state: LoadingState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state))
  }

  startLoading(initialProgress = 10) {
    this.state = {
      isLoading: true,
      error: null,
      progress: initialProgress,
    }
    this.notifyListeners()
  }

  updateProgress(progress: number) {
    if (progress > 100) progress = 100
    if (progress < this.state.progress) progress = this.state.progress
    
    this.state = {
      ...this.state,
      progress,
    }
    this.notifyListeners()
  }

  completeLoading() {
    this.state = {
      isLoading: false,
      error: null,
      progress: 100,
    }
    this.notifyListeners()

    // Reset after delay
    setTimeout(() => {
      this.state = {
        isLoading: false,
        error: null,
        progress: 0,
      }
    }, 500)
  }

  setError(error: string) {
    this.state = {
      isLoading: false,
      error,
      progress: 0,
    }
    this.notifyListeners()
  }

  clearError() {
    this.state = {
      ...this.state,
      error: null,
    }
    this.notifyListeners()
  }

  reset() {
    this.state = {
      isLoading: false,
      error: null,
      progress: 0,
    }
    this.notifyListeners()
  }

  getState(): LoadingState {
    return { ...this.state }
  }
}

export const pageLoader = PageLoadingManager.getInstance()

/**
 * Hook to use page loading state
 */
export function usePageLoading() {
  const [state, setState] = React.useState<LoadingState>(pageLoader.getState())

  React.useEffect(() => {
    const unsubscribe = pageLoader.subscribe(setState)
    return unsubscribe
  }, [])

  return {
    isLoading: state.isLoading,
    error: state.error,
    progress: state.progress,
    startLoading: (progress?: number) => pageLoader.startLoading(progress),
    updateProgress: (progress: number) => pageLoader.updateProgress(progress),
    completeLoading: () => pageLoader.completeLoading(),
    setError: (error: string) => pageLoader.setError(error),
    clearError: () => pageLoader.clearError(),
    reset: () => pageLoader.reset(),
  }
}

import React from 'react'
