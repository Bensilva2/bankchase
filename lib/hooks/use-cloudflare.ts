import { useState, useCallback } from 'react';

interface UseCloudflareOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for DNS record management
 */
export function useCloudflareDNS(options?: UseCloudflareOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const listRecords = useCallback(
    async (zoneId: string, type?: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ zoneId });
        if (type) params.append('type', type);
        
        const response = await fetch(`/api/cloudflare/dns?${params}`);
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        options?.onSuccess?.(data);
        return data.records;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to list DNS records');
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  const createRecord = useCallback(
    async (zoneId: string, record: any) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/cloudflare/dns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zoneId, record }),
        });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        options?.onSuccess?.(data);
        return data.record;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create DNS record');
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  const updateRecord = useCallback(
    async (zoneId: string, recordId: string, record: any) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/cloudflare/dns', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zoneId, recordId, record }),
        });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        options?.onSuccess?.(data);
        return data.record;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update DNS record');
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  const deleteRecord = useCallback(
    async (zoneId: string, recordId: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ zoneId, recordId });
        const response = await fetch(`/api/cloudflare/dns?${params}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        options?.onSuccess?.(data);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete DNS record');
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return { listRecords, createRecord, updateRecord, deleteRecord, loading, error };
}

/**
 * Hook for R2 bucket management
 */
export function useCloudflareR2(options?: UseCloudflareOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const listObjects = useCallback(
    async (bucket: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ bucket });
        const response = await fetch(`/api/cloudflare/r2?${params}`);
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        options?.onSuccess?.(data);
        return data.contents;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to list R2 objects');
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  const getSignedUploadUrl = useCallback(
    async (bucket: string, key: string, contentType?: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/cloudflare/r2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket, key, contentType }),
        });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        options?.onSuccess?.(data);
        return data.signedUrl;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to generate upload URL');
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  const getSignedDownloadUrl = useCallback(
    async (bucket: string, key: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ bucket, key });
        const response = await fetch(`/api/cloudflare/r2?${params}`);
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        options?.onSuccess?.(data);
        return data.signedUrl;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to generate download URL');
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  const deleteObject = useCallback(
    async (bucket: string, key: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ bucket, key });
        const response = await fetch(`/api/cloudflare/r2?${params}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        options?.onSuccess?.(data);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to delete R2 object');
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return { listObjects, getSignedUploadUrl, getSignedDownloadUrl, deleteObject, loading, error };
}
