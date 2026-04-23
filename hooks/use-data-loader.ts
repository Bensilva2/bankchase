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
  const callbacksRef = useRef({ onSuccess, onError, onReady })
  callbacksRef.current = { onSuccess, onError, onReady }

  // Subscribe to state changes
  useEffect(() => {
    unsubscribeRef.current = dataLoader.subscribe(key, setState)
    return () => unsubscribeRef.current?.()
  }, [key])

  // Load data on mount only
  useEffect(() => {
    if (skip) return

    const load = async () => {
      try {
        const result = await dataLoader.loadData(key, loaderFn, loaderConfig)
        setData(result)
        callbacksRef.current.onSuccess?.(result)
        callbacksRef.current.onReady?.()
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        callbacksRef.current.onError?.(err)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, skip])

  const retry = useCallback(async () => {
    try {
      const result = await dataLoader.loadData(key, loaderFn, loaderConfig)
      setData(result)
      callbacksRef.current.onSuccess?.(result)
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      callbacksRef.current.onError?.(err)
      throw err
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

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
  const loadedRef = useRef(false)
  const callbacksRef = useRef({ onSuccess, onError, onReady })
  callbacksRef.current = { onSuccess, onError, onReady }

  useEffect(() => {
    if (skip || loadedRef.current) return
    loadedRef.current = true

    const load = async () => {
      setIsLoading(true)
      setHasError(false)

      try {
        const result = await dataLoader.loadMultiple(loaders, loaderConfig)
        setData(result)
        setIsReady(true)
        callbacksRef.current.onSuccess?.(result)
        callbacksRef.current.onReady?.()
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        setErrorMessage(err.message)
        setHasError(true)
        callbacksRef.current.onError?.(err)
      } finally {
        setIsLoading(false)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip])

  const retry = useCallback(async () => {
    try {
      const result = await dataLoader.loadMultiple(loaders, loaderConfig)
      setData(result)
      setIsReady(true)
      setHasError(false)
      callbacksRef.current.onSuccess?.(result)
      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      setErrorMessage(err.message)
      setHasError(true)
      callbacksRef.current.onError?.(err)
      throw err
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  const keysStr = keys.join(',')

  useEffect(() => {
    const check = async () => {
      const ready = await dataLoader.waitForAll(keys, timeout)
      setIsReady(ready)
    }

    check()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysStr, timeout])

  return isReady
}
