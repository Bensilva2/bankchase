/**
 * Advanced caching utilities for performance optimization
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class Cache<T> {
  private store = new Map<string, CacheEntry<T>>()
  private maxSize: number
  
  constructor(maxSize = 100) {
    this.maxSize = maxSize
  }

  set(key: string, value: T, ttl = 5 * 60 * 1000): void {
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value
      this.store.delete(firstKey)
    }

    this.store.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl,
    })
  }

  get(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null

    const isExpired = Date.now() - entry.timestamp > entry.ttl
    if (isExpired) {
      this.store.delete(key)
      return null
    }

    return entry.data
  }

  clear(): void {
    this.store.clear()
  }

  delete(key: string): boolean {
    return this.store.delete(key)
  }

  has(key: string): boolean {
    const entry = this.store.get(key)
    if (!entry) return false
    
    const isExpired = Date.now() - entry.timestamp > entry.ttl
    if (isExpired) {
      this.store.delete(key)
      return false
    }
    
    return true
  }
}

// Global cache instances
export const transactionCache = new Cache<any>(50)
export const accountCache = new Cache<any>(20)
export const userCache = new Cache<any>(10)

/**
 * Debounce utility for optimizing function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Throttle utility for rate-limiting function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Memoization decorator for expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, any>()

  return ((...args: any[]) => {
    const key = JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

/**
 * Request deduplication utility
 */
const pendingRequests = new Map<string, Promise<any>>()

export async function deduplicateRequest<T>(
  key: string,
  request: () => Promise<T>
): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)
  }

  const promise = request()
    .then(result => {
      pendingRequests.delete(key)
      return result
    })
    .catch(error => {
      pendingRequests.delete(key)
      throw error
    })

  pendingRequests.set(key, promise)
  return promise
}

/**
 * Image optimization utility
 */
export function getOptimizedImageUrl(url: string, width: number, quality: number = 75): string {
  // Using common image optimization patterns
  const params = new URLSearchParams({
    w: width.toString(),
    q: quality.toString(),
    auto: 'format',
  })
  
  return `${url}?${params.toString()}`
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map()

  mark(name: string): void {
    this.marks.set(name, performance.now())
  }

  measure(name: string, startMark: string): number {
    const endTime = performance.now()
    const startTime = this.marks.get(startMark)

    if (!startTime) {
      console.warn(`Start mark "${startMark}" not found`)
      return 0
    }

    const duration = endTime - startTime
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
    
    return duration
  }

  clear(): void {
    this.marks.clear()
  }
}

export const monitor = new PerformanceMonitor()

/**
 * Lazy loading utility for components
 */
export function createLazyComponent<P extends object>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
  loading?: React.ComponentType<any>
): React.ComponentType<P> {
  const Component = React.lazy(importFunc)
  
  return (props: P) => (
    <React.Suspense fallback={loading ? <loading /> : <div>Loading...</div>}>
      <Component {...props} />
    </React.Suspense>
  )
}

/**
 * Local storage with expiration
 */
export class ExpiringStorage {
  private prefix = 'app_'
  private ttlPrefix = 'ttl_'

  set(key: string, value: any, ttlSeconds = 3600): void {
    const fullKey = this.prefix + key
    const expiryKey = this.ttlPrefix + key
    
    try {
      localStorage.setItem(fullKey, JSON.stringify(value))
      localStorage.setItem(expiryKey, (Date.now() + ttlSeconds * 1000).toString())
    } catch (e) {
      console.error('Failed to set item in localStorage:', e)
    }
  }

  get(key: string): any {
    const fullKey = this.prefix + key
    const expiryKey = this.ttlPrefix + key

    try {
      const expiryTime = localStorage.getItem(expiryKey)
      
      if (!expiryTime || Date.now() > parseInt(expiryTime)) {
        this.remove(key)
        return null
      }

      const value = localStorage.getItem(fullKey)
      return value ? JSON.parse(value) : null
    } catch (e) {
      console.error('Failed to get item from localStorage:', e)
      return null
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key)
      localStorage.removeItem(this.ttlPrefix + key)
    } catch (e) {
      console.error('Failed to remove item from localStorage:', e)
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.prefix) || key.startsWith(this.ttlPrefix)) {
          localStorage.removeItem(key)
        }
      })
    } catch (e) {
      console.error('Failed to clear localStorage:', e)
    }
  }
}

export const storage = new ExpiringStorage()

// React import for lazy loading
import React from 'react'
