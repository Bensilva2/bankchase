import useSWR from 'swr';
import ApiClient from '@/lib/api-client';

export interface AdminStats {
  total_transfers: number;
  total_amount: number;
  pending_refunds: number;
  completed_transfers: number;
  average_transfer_amount: number;
  unique_recipients: number;
}

export function useAdminStats() {
  const { data, error, isLoading, mutate } = useSWR<AdminStats>(
    '/admin/demo/stats',
    () => ApiClient.getAdminStats()
  );

  return {
    stats: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function useAdminTransfers(limit = 50, offset = 0) {
  const { data, error, isLoading, mutate } = useSWR(
    `/admin/demo/transfers?limit=${limit}&offset=${offset}`,
    () => ApiClient.getAdminTransfers(limit, offset)
  );

  return {
    transfers: data?.transfers || [],
    totalCount: data?.total_count || 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
