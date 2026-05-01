'use client';

import { useEffect, useState } from 'react';
import ApiClient from './api-client';

interface UseFetchOptions {
  cache?: boolean;
  cacheTime?: number;
  retry?: number;
  retryDelay?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Simple in-memory cache
const cache: Map<string, CacheEntry<any>> = new Map();

export function useFetch<T>(
  url: string | null,
  options: UseFetchOptions = {}
): {
  data: T | null;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);
  const { 
    cache: shouldCache = false, 
    cacheTime = 60000,
    retry = 3,
    retryDelay = 1000,
  } = options;

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      let lastError: Error | null = null;

      // Check cache first
      if (shouldCache && cache.has(url)) {
        const cached = cache.get(url)!;
        const now = Date.now();
        if (now - cached.timestamp < cacheTime) {
          setData(cached.data);
          setLoading(false);
          return;
        }
      }

      // Try fetching with retries
      for (let attempt = 0; attempt <= retry; attempt++) {
        try {
          const result = await ApiClient.request<T>(url);
          setData(result);

          // Store in cache
          if (shouldCache) {
            cache.set(url, {
              data: result,
              timestamp: Date.now(),
            });
          }
          setLoading(false);
          return;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Unknown error');
          if (attempt < retry) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }

      // All retries exhausted
      const errorMessage = lastError?.message || 'Failed to fetch data';
      setError(errorMessage);
      setLoading(false);
    };

    fetchData();
  }, [url, shouldCache, cacheTime, retry, retryDelay]);

  return { data, loading, error };
}
