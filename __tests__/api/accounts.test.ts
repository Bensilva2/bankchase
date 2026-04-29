/**
 * API Tests for Accounts Endpoints
 * Tests account retrieval, balance checking, and account-specific operations
 */

import ApiClient from '@/lib/api-client';

describe('Accounts API', () => {
  beforeAll(() => {
    // Mock token setup
    ApiClient.setToken('test-token-123');
  });

  describe('GET /accounts', () => {
    it('should fetch user accounts', async () => {
      const result = await ApiClient.getAccounts();
      expect(result).toBeDefined();
      expect(result.accounts).toBeInstanceOf(Array);
      expect(result.total_balance).toBeGreaterThanOrEqual(0);
    });

    it('should have account objects with required fields', async () => {
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
      const accounts = await ApiClient.getAccounts();
      if (accounts.accounts.length > 0) {
        const accountId = accounts.accounts[0].id;
        const result = await ApiClient.getAccount(accountId);
        expect(result).toBeDefined();
        expect(result.id).toBe(accountId);
      }
    });
  });
});
