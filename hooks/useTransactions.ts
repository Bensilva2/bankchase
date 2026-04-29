import useSWR from 'swr';
import ApiClient from '@/lib/api-client';

export interface Transaction {
  id: number;
  account_id: number;
  type: string;
  amount: number;
  description: string;
  to_account?: string;
  status: string;
  date: string;
}

export interface TransactionsData {
  transactions: Transaction[];
  total_count: number;
  limit: number;
}

export function useTransactions(accountId?: number, limit = 20, offset = 0) {
  const key = accountId
    ? `/transactions/history?account_id=${accountId}&limit=${limit}&offset=${offset}`
    : `/transactions/history?limit=${limit}&offset=${offset}`;

  const { data, error, isLoading, mutate } = useSWR<TransactionsData>(key, () =>
    ApiClient.getTransactions(accountId, limit, offset)
  );

  return {
    transactions: data?.transactions || [],
    totalCount: data?.total_count || 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
