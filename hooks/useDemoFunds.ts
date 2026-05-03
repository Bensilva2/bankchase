import useSWR from 'swr';
import ApiClient from '@/lib/api-client';

export interface DemoBalance {
  account_number: string | null;
  balance: number;
  is_demo: boolean;
}

export interface PendingFund {
  amount: number;
  from_admin: boolean;
  received_at: string;
  will_refund_in: number | null;
}

export interface PendingFundsData {
  pending_funds: PendingFund[];
}

export function useDemoBalance() {
  const { data, error, isLoading } = useSWR<DemoBalance>('/user/demo/balance', () =>
    ApiClient.getDemoBalance() as Promise<DemoBalance>
  );

  return {
    balance: data?.balance || 0,
    isDemo: data?.is_demo ?? false,
    isLoading,
    isError: !!error,
    error,
  };
}

export function usePendingDemoFunds() {
  const { data, error, isLoading, mutate } = useSWR<PendingFundsData>(
    '/user/demo/pending-funds',
    () => ApiClient.getPendingDemoFunds() as Promise<PendingFundsData>
  );

  return {
    pendingFunds: data?.pending_funds || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
