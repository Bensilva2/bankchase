import { useEffect, useCallback, useRef, useState } from 'react'
import { realtimeSyncCoordinator, SyncMessage } from '@/lib/realtime-sync-coordinator'

/**
 * Hook to subscribe to real-time sync updates
 */
export function useRealtimeSync<T = any>(
  key: string,
  onUpdate?: (message: SyncMessage) => void,
  onError?: (error: Error) => void,
) {
  const subscriberIdRef = useRef<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  useEffect(() => {
    const handleMessage = (message: SyncMessage) => {
      setIsSyncing(true)
      setLastUpdate(Date.now())

      try {
        onUpdate?.(message)
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error(String(error)))
      }

      // Debounce syncing state
      setTimeout(() => setIsSyncing(false), 100)
    }

    subscriberIdRef.current = realtimeSyncCoordinator.subscribe(key, handleMessage)

    return () => {
      if (subscriberIdRef.current) {
        realtimeSyncCoordinator.unsubscribe(key, subscriberIdRef.current)
      }
    }
  }, [key, onUpdate, onError])

  const forceSync = useCallback(async (data?: any) => {
    setIsSyncing(true)
    try {
      await realtimeSyncCoordinator.forceSync(key, data)
    } finally {
      setIsSyncing(false)
    }
  }, [key])

  return {
    isSyncing,
    lastUpdate,
    forceSync,
  }
}

/**
 * Hook to subscribe to multiple sync updates
 */
export function useRealtimeSyncMultiple(
  keys: string[],
  onUpdate?: (message: SyncMessage, key: string) => void,
) {
  const subscriberIdsRef = useRef<Map<string, string>>(new Map())
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncedKeys, setSyncedKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    const handleMessage = (key: string) => (message: SyncMessage) => {
      setIsSyncing(true)
      setSyncedKeys((prev) => new Set(prev).add(key))
      onUpdate?.(message, key)

      setTimeout(() => setIsSyncing(false), 50)
    }

    keys.forEach((key) => {
      const id = realtimeSyncCoordinator.subscribe(key, handleMessage(key))
      subscriberIdsRef.current.set(key, id)
    })

    return () => {
      subscriberIdsRef.current.forEach((id, key) => {
        realtimeSyncCoordinator.unsubscribe(key, id)
      })
      subscriberIdsRef.current.clear()
    }
  }, [keys, onUpdate])

  const forceSyncAll = useCallback(async () => {
    setIsSyncing(true)
    try {
      const messages = keys.map((key) => ({
        type: 'update' as const,
        key,
        timestamp: Date.now(),
      }))
      await realtimeSyncCoordinator.publishBatch(messages)
    } finally {
      setIsSyncing(false)
    }
  }, [keys])

  const isAllSynced = syncedKeys.size === keys.length

  return {
    isSyncing,
    isAllSynced,
    syncedKeys: Array.from(syncedKeys),
    forceSyncAll,
  }
}

/**
 * Hook to wait for sync to complete
 */
export function useWaitForSync(keys: string[], timeout: number = 5000) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const startTime = Date.now()

    const check = async () => {
      while (Date.now() - startTime < timeout) {
        const isSyncing = realtimeSyncCoordinator.isSyncInProgress()
        if (!isSyncing) {
          setIsReady(true)
          return
        }
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
      setIsReady(true) // Timeout reached, consider ready anyway
    }

    check()
  }, [keys, timeout])

  return isReady
}
