/**
 * Real-Time Operation Engine
 * Coordinates all real-time operations across the app with actual function implementations
 */

import { dataLoader } from './unified-data-loader'
import { realtimeSyncCoordinator } from './realtime-sync-coordinator'

export interface OperationResult {
  success: boolean
  data?: any
  error?: string
  timestamp: Date
}

export interface OperationConfig {
  timeout?: number
  retries?: number
  cache?: boolean
  priority?: 'high' | 'normal' | 'low'
}

class RealtimeOperationEngine {
  private activeOperations = new Map<string, Promise<any>>()
  private operationQueue: Array<{ id: string; fn: () => Promise<any>; priority: string }> = []
  private isProcessing = false

  /**
   * Execute a real-time operation with automatic sync
   */
  async executeOperation(
    operationId: string,
    operation: () => Promise<OperationResult>,
    config: OperationConfig = {},
  ): Promise<OperationResult> {
    const timeout = config.timeout || 5000
    const retries = config.retries || 2
    const cache = config.cache !== false

    try {
      // Check if operation is already in flight
      if (this.activeOperations.has(operationId)) {
        return this.activeOperations.get(operationId)
      }

      // Execute with timeout
      const operationPromise = this.executeWithTimeout(operation, timeout, retries)
      this.activeOperations.set(operationId, operationPromise)

      const result = await operationPromise
      this.activeOperations.delete(operationId)

      // Trigger real-time sync if successful
      if (result.success) {
        await realtimeSyncCoordinator.publishUpdate(operationId, result.data)
      }

      return result
    } catch (error) {
      this.activeOperations.delete(operationId)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      }
    }
  }

  /**
   * Execute with timeout and automatic retry
   */
  private async executeWithTimeout(
    operation: () => Promise<OperationResult>,
    timeout: number,
    retries: number,
  ): Promise<OperationResult> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await Promise.race([
          operation(),
          new Promise<OperationResult>((_, reject) =>
            setTimeout(() => reject(new Error('Operation timeout')), timeout),
          ),
        ])
      } catch (error) {
        lastError = error as Error
        if (attempt < retries) {
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 100))
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Operation failed after retries',
      timestamp: new Date(),
    }
  }

  /**
   * Queue operation for batch processing
   */
  async queueOperation(
    operationId: string,
    operation: () => Promise<OperationResult>,
    priority: 'high' | 'normal' | 'low' = 'normal',
  ): Promise<OperationResult> {
    return new Promise((resolve) => {
      this.operationQueue.push({
        id: operationId,
        fn: async () => {
          const result = await operation()
          resolve(result)
          return result
        },
        priority,
      })

      // Sort by priority
      this.operationQueue.sort((a, b) => {
        const priorityMap = { high: 3, normal: 2, low: 1 }
        return priorityMap[b.priority as keyof typeof priorityMap] -
          priorityMap[a.priority as keyof typeof priorityMap]
      })

      this.processQueue()
    })
  }

  /**
   * Process queued operations sequentially
   */
  private async processQueue() {
    if (this.isProcessing || this.operationQueue.length === 0) return

    this.isProcessing = true

    while (this.operationQueue.length > 0) {
      const operation = this.operationQueue.shift()
      if (operation) {
        try {
          await operation.fn()
        } catch (error) {
          console.error(`[v0] Operation ${operation.id} failed:`, error)
        }
      }
    }

    this.isProcessing = false
  }

  /**
   * Get operation status
   */
  getOperationStatus(operationId: string): 'pending' | 'processing' | 'completed' | 'queued' {
    if (this.activeOperations.has(operationId)) return 'processing'
    if (this.operationQueue.some((op) => op.id === operationId)) return 'queued'
    return 'completed'
  }

  /**
   * Clear all operations
   */
  clear() {
    this.activeOperations.clear()
    this.operationQueue = []
    this.isProcessing = false
  }
}

export const realtimeOperationEngine = new RealtimeOperationEngine()
