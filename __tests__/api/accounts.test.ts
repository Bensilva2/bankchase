/**
 * API Tests for Accounts Endpoints
 * Tests account retrieval, balance checking, and account-specific operations
 */

import ApiClient from '@/lib/api-client';

const mockAccountsResponse = {
  total_balance: 5000,
  accounts: [
    { id: 1, account_number: 'CHK001', account_type: 'Checking', balance: 2500, is_demo_account: false, last_updated: new Date().toISOString() },
    { id: 2, account_number: 'SAV001', account_type: 'Savings', balance: 2500, is_demo_account: false, last_updated: new Date().toISOString() },
  ],
};

function mockFetchOk(body: unknown) {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(body),
  });
}

describe('Accounts API', () => {
  beforeAll(() => {
    // Mock token setup
    ApiClient.setToken('test-token-123');
  });

  describe('GET /accounts', () => {
    it('should fetch user accounts', async () => {
      mockFetchOk(mockAccountsResponse);
      const result = await ApiClient.getAccounts();
      expect(result).toBeDefined();
      expect(result.accounts).toBeInstanceOf(Array);
      expect(result.total_balance).toBeGreaterThanOrEqual(0);
    });

    it('should have account objects with required fields', async () => {
      mockFetchOk(mockAccountsResponse);
      const result = await ApiClient.getAccounts();
      if (result.accounts.length > 0) {
        const account = result.accounts[0];
        expect(account).toHaveProperty('id');
        expect(account).toHaveProperty('account_number');
        expect(account).toHaveProperty('balance');
        expect(account).toHaveProperty('account_type');
      }
    });
  });

  describe('GET /accounts/:id', () => {
    it('should fetch single account details', async () => {
      mockFetchOk(mockAccountsResponse);
      const accounts = await ApiClient.getAccounts();
      if (accounts.accounts.length > 0) {
        const accountId = accounts.accounts[0].id;
        mockFetchOk({ id: accountId, account_number: 'CHK001', balance: 2500 });
        const result = await ApiClient.getAccount(accountId);
        expect(result).toBeDefined();
        expect(result.id).toBe(accountId);
      }
    });
  });
});
