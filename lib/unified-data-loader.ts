// Unified Data Loader - Ensures all options load properly before display

export interface LoaderState {
  isLoading: boolean
  isReady: boolean
  hasError: boolean
  errorMessage?: string
  progress: number
}

export interface DataLoadConfig {
  timeout?: number
  retries?: number
  parallel?: boolean
}

export class UnifiedDataLoader {
  private static instance: UnifiedDataLoader
  private loadingStates = new Map<string, LoaderState>()
  private dataCache = new Map<string, any>()
  private subscribers = new Map<string, Set<(state: LoaderState) => void>>()

  private constructor() {}

  static getInstance(): UnifiedDataLoader {
    if (!UnifiedDataLoader.instance) {
      UnifiedDataLoader.instance = new UnifiedDataLoader()
    }
    return UnifiedDataLoader.instance
  }

  /**
   * Register a loading state observer
   */
  subscribe(key: string, callback: (state: LoaderState) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set())
    }
    this.subscribers.get(key)!.add(callback)

    return () => {
      this.subscribers.get(key)?.delete(callback)
    }
  }

  /**
   * Notify all subscribers of state change
   */
  private notifySubscribers(key: string, state: LoaderState) {
    this.subscribers.get(key)?.forEach((callback) => callback(state))
  }

  /**
   * Load data with proper state management
   */
  async loadData<T>(
    key: string,
    loaderFn: () => Promise<T>,
    config: DataLoadConfig = {},
  ): Promise<T> {
    const { timeout = 5000, retries = 3, parallel = true } = config

    // Check if already cached
    if (this.dataCache.has(key)) {
      return this.dataCache.get(key)
    }

    // Set loading state
    this.setLoading(key, true)

    let lastError: Error | null = null
    let retryCount = 0

    while (retryCount < retries) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Load timeout for ${key}`)), timeout),
        )

        const data = await Promise.race([loaderFn(), timeoutPromise])

        // Cache the result
        this.dataCache.set(key, data)

        // Update progress
        this.setProgress(key, 100)

        // Mark as ready
        this.setReady(key, true)

        return data
      } catch (error) {
        lastError = error as Error
        retryCount++

        if (retryCount < retries) {
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 100))
        }
      }
    }

    // Failed after retries
    this.setError(key, lastError?.message || "Unknown error")
    throw lastError || new Error(`Failed to load ${key} after ${retries} retries`)
  }

  /**
   * Load multiple data sources in parallel
   */
  async loadMultiple<T extends Record<string, Promise<any>>>(
    loaders: T,
    config: DataLoadConfig = {},
  ): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
    const keys = Object.keys(loaders)

    // Start all loads
    const promises = keys.map((key) =>
      this.loadData(key, () => loaders[key as keyof T], {
        ...config,
        parallel: true,
      }).catch((error) => {
        console.error(`[UnifiedDataLoader] Error loading ${key}:`, error)
        return null
      }),
    )

    const results = await Promise.all(promises)

    const output = {} as any
    keys.forEach((key, index) => {
      output[key] = results[index]
    })

    return output
  }

  /**
   * Set loading state
   */
  private setLoading(key: string, isLoading: boolean) {
    const current = this.getState(key)
    const newState: LoaderState = {
      ...current,
      isLoading,
      hasError: isLoading ? false : current.hasError,
      progress: isLoading ? current.progress : (isLoading ? 0 : 100),
    }
    this.loadingStates.set(key, newState)
    this.notifySubscribers(key, newState)
  }

  /**
   * Set ready state
   */
  private setReady(key: string, isReady: boolean) {
    const current = this.getState(key)
    const newState: LoaderState = {
      ...current,
      isReady,
      isLoading: false,
    }
    this.loadingStates.set(key, newState)
    this.notifySubscribers(key, newState)
  }

  /**
   * Set error state
   */
  private setError(key: string, errorMessage: string) {
    const newState: LoaderState = {
      isLoading: false,
      isReady: false,
      hasError: true,
      errorMessage,
      progress: 0,
    }
    this.loadingStates.set(key, newState)
    this.notifySubscribers(key, newState)
  }

  /**
   * Set progress
   */
  private setProgress(key: string, progress: number) {
    const current = this.getState(key)
    const newState: LoaderState = {
      ...current,
      progress: Math.min(100, Math.max(0, progress)),
    }
    this.loadingStates.set(key, newState)
    this.notifySubscribers(key, newState)
  }

  /**
   * Get current state
   */
  getState(key: string): LoaderState {
    return (
      this.loadingStates.get(key) || {
        isLoading: false,
        isReady: false,
        hasError: false,
        progress: 0,
      }
    )
  }

  /**
   * Get cached data
   */
  getData<T>(key: string): T | null {
    return this.dataCache.get(key) || null
  }

  /**
   * Clear specific cache
   */
  clearCache(key?: string) {
    if (key) {
      this.dataCache.delete(key)
      this.loadingStates.delete(key)
    } else {
      this.dataCache.clear()
      this.loadingStates.clear()
    }
  }

  /**
   * Check if all data is ready
   */
  isAllReady(keys: string[]): boolean {
    return keys.every((key) => this.getState(key).isReady)
  }

  /**
   * Wait for all data to be ready
   */
  async waitForAll(keys: string[], timeout: number = 10000): Promise<boolean> {
    const startTime = Date.now()

    while (true) {
      if (this.isAllReady(keys)) {
        return true
      }

      if (Date.now() - startTime > timeout) {
        return false
      }

      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
}

// Export singleton instance
export const dataLoader = UnifiedDataLoader.getInstance()
