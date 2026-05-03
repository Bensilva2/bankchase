/**
 * Hook Tests for useAccounts
 * Tests account data fetching and state management with SWR
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { useAccounts } from '@/hooks/useAccounts';
import ApiClient from '@/lib/api-client';

jest.mock('@/lib/api-client');

// Wrap each test in a fresh SWR cache to prevent cross-test cache pollution
const swrWrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(SWRConfig, { value: { provider: () => new Map() } }, children);

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

    const { result } = renderHook(() => useAccounts(), { wrapper: swrWrapper });

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

    const { result } = renderHook(() => useAccounts(), { wrapper: swrWrapper });

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

    const { result } = renderHook(() => useAccounts(), { wrapper: swrWrapper });

    expect(result.current.isLoading).toBe(true);
  });
});
