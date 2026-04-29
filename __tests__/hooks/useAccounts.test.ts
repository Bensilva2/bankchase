/**
 * Hook Tests for useAccounts
 * Tests account data fetching and state management with SWR
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useAccounts } from '@/hooks/useAccounts';
import ApiClient from '@/lib/api-client';

jest.mock('@/lib/api-client');

describe('useAccounts Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and return accounts', async () => {
    const mockAccounts = {
      total_balance: 5000,
      accounts: [
        {
          id: 1,
          account_number: 'CHK001',
          account_type: 'Checking',
          balance: 2500,
          is_demo_account: false,
          last_updated: new Date().toISOString(),
        },
        {
          id: 2,
          account_number: 'SAV001',
          account_type: 'Savings',
          balance: 2500,
          is_demo_account: false,
          last_updated: new Date().toISOString(),
        },
      ],
      message: 'Accounts Overview',
    };

    (ApiClient.getAccounts as jest.Mock).mockResolvedValue(mockAccounts);

    const { result } = renderHook(() => useAccounts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.accounts).toHaveLength(2);
    expect(result.current.totalBalance).toBe(5000);
    expect(result.current.isError).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    (ApiClient.getAccounts as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useAccounts());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.accounts).toEqual([]);
    expect(result.current.totalBalance).toBe(0);
  });

  it('should start in loading state', () => {
    (ApiClient.getAccounts as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    const { result } = renderHook(() => useAccounts());

    expect(result.current.isLoading).toBe(true);
  });
});
