// src/hooks/useFetch.ts
import { useState, useEffect, useCallback, useRef } from 'react';

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  cache?: boolean; // Cache for 5 minutes by default
  cacheTime?: number; // in ms
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

export const useFetch = <T,>(
  url: string | null,
  options: FetchOptions = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const {
    method = 'GET',
    body,
    cache: useCache = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
  } = options;

  const fetcher = useCallback(async () => {
    if (!url || hasFetched.current) return;
    hasFetched.current = true;

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      if (useCache && cache.has(url)) {
        const entry = cache.get(url)!;
        if (Date.now() - entry.timestamp < cacheTime) {
          setData(entry.data);
          setLoading(false);
          return;
        }
      }

      const token = localStorage.getItem('access_token');
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      setData(result);

      // Cache the result
      if (useCache) {
        cache.set(url, { data: result, timestamp: Date.now() });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }, [url, method, body, useCache, cacheTime, options.headers]);

  useEffect(() => {
    fetcher();
  }, [fetcher]);

  return { data, loading, error };
};