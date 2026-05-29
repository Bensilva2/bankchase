import useSWR from 'swr';
import ApiClient from '@/lib/api-client';

export interface Account {
  id: number;
  account_number: string;
  account_type: string;
  balance: number;
  is_demo_account: boolean;
  last_updated: string;
}

export interface AccountsData {
  total_balance: number;
  accounts: Account[];
  message: string;
}

export function useAccounts() {
  const { data, error, isLoading } = useSWR<AccountsData>('/accounts', () =>
    ApiClient.getAccounts()
  );

  return {
    accounts: data?.accounts || [],
    totalBalance: data?.total_balance || 0,
    isLoading,
    isError: !!error,
    error,
  };
}

export function useAccount(accountId: number) {
  const { data, error, isLoading } = useSWR(
    accountId ? `/accounts/${accountId}` : null,
    () => (accountId ? ApiClient.getAccount(accountId) : null)
  );

  return {
    account: data,
    isLoading,
    isError: !!error,
    error,
  };
}
