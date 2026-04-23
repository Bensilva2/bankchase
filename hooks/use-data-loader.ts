import { useEffect, useState, useCallback, useRef } from 'react'
import { dataLoader, LoaderState, DataLoadConfig } from '@/lib/unified-data-loader'

interface UseDataLoaderOptions<T> extends DataLoadConfig {
  skip?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  onReady?: () => void
}

/**
 * Hook to load data with automatic state management
 */
export function useDataLoader<T>(
  key: string,
  loaderFn: () => Promise<T>,
  options: UseDataLoaderOptions<T> = {},
) {
  const { skip = false, onSuccess, onError, onReady, ...loaderConfig } = options
  const [state, setState] = useState<LoaderState>(() => dataLoader.getState(key))
  const [data, setData] = useState<T | null>(() => dataLoader.getData(key))
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Subscribe to state changes
  useEffect(() => {
    unsubscribeRef.current = dataLoader.subscribe(key, setState)
    return () => unsubscribeRef.current?.()
  }, [key])

  // Load data on mount
  useEffect(() => {
    if (skip) return

    const load = async () => {
      try {
        const result = await dataLoader.loadData(key, loaderFn, loaderConfig)
        setData(result)
        onSuccess?.(result)
        onReady?.()
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        onError?.(err)
      }
    }

    load()
  }, [key, skip, loaderFn, loaderConfig, onSuccess, onError, onReady])

  const retry = useCallback(async () => {
    try {
      const result = await dataLoader.loadData(key, loaderFn, loaderConfig)
      setData(result)
      onSuccess?.(result)
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      onError?.(err)
      throw err
    }
  }, [key, loaderFn, loaderConfig, onSuccess, onError])

  return {
    data,
    isLoading: state.isLoading,
    isReady: state.isReady,
    hasError: state.hasError,
    errorMessage: state.errorMessage,
    progress: state.progress,
    retry,
  }
}

/**
 * Hook to load multiple data sources in parallel
 */
export function useDataLoaderMultiple<T extends Record<string, Promise<any>>>(
  loaders: T,
  options: UseDataLoaderOptions<any> = {},
) {
  const { skip = false, onSuccess, onError, onReady, ...loaderConfig } = options
  const [data, setData] = useState<{ [K in keyof T]: Awaited<T[K]> | null }>()
  const [isLoading, setIsLoading] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

  useEffect(() => {
    if (skip) return

    const load = async () => {
      setIsLoading(true)
      setHasError(false)

      try {
        const result = await dataLoader.loadMultiple(loaders, loaderConfig)
        setData(result)
        setIsReady(true)
        onSuccess?.(result)
        onReady?.()
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        setErrorMessage(err.message)
        setHasError(true)
        onError?.(err)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [skip, loaders, loaderConfig, onSuccess, onError, onReady])

  const retry = useCallback(async () => {
    try {
      const result = await dataLoader.loadMultiple(loaders, loaderConfig)
      setData(result)
      setIsReady(true)
      setHasError(false)
      onSuccess?.(result)
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      setErrorMessage(err.message)
      setHasError(true)
      onError?.(err)
      throw err
    }
  }, [loaders, loaderConfig, onSuccess, onError])

  return {
    data: data || ({} as { [K in keyof T]: Awaited<T[K]> | null }),
    isLoading,
    isReady,
    hasError,
    errorMessage,
    retry,
  }
}

/**
 * Hook to wait for data to be ready before rendering
 */
export function useDataLoaderWait(keys: string[], timeout: number = 10000) {
  const [isReady, setIsReady] = useState(() => dataLoader.isAllReady(keys))

  useEffect(() => {
    const check = async () => {
      const ready = await dataLoader.waitForAll(keys, timeout)
      setIsReady(ready)
    }

    check()
  }, [keys, timeout])

  return isReady
}
