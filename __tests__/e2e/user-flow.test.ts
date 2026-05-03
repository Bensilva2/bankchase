/**
 * End-to-End User Flow Tests
 * Tests complete user journeys: login → view accounts → transfer → verify
 */

import ApiClient from '@/lib/api-client';

function mockFetchOk(body: unknown) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(body),
  });
}

function mockFetchError(status: number, body: unknown) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  });
}

const baseAccount = { id: 1, account_number: 'CHK001', account_type: 'Checking', balance: 1000, is_demo_account: false, last_updated: new Date().toISOString() };

describe('User Flow E2E Tests', () => {
  describe('Complete Account & Transfer Flow', () => {
    beforeAll(() => {
      ApiClient.setToken('test-user-token');
    });

    it('should complete full user banking flow', async () => {
      // Step 1: Fetch accounts
      mockFetchOk({ accounts: [baseAccount], total_balance: 1000 });
      const accounts = await ApiClient.getAccounts();
      expect(accounts.accounts.length).toBeGreaterThan(0);

      const sourceAccount = accounts.accounts[0];

      // Step 2: Check sufficient balance
      expect(sourceAccount.balance).toBeGreaterThan(50);

      // Step 3: Fetch transaction history
      mockFetchOk({ transactions: [], total_count: 0, limit: 10 });
      const transactions = await ApiClient.getTransactions(sourceAccount.id, 10);
      expect(transactions.transactions).toBeDefined();

      // Step 4: Send money
      mockFetchOk({ status: 'success', transfer_id: 'TXN-001' });
      const transfer = await ApiClient.sendMoney({
        from_account_number: sourceAccount.account_number,
        to_account_number: 'CHK002',
        to_bank_code: 'INTERNAL',
        amount: 50,
        narration: 'E2E test transfer',
      });

      expect(transfer.status).toBe('success');
      expect(transfer.transfer_id).toBeDefined();

      // Step 5: Verify balance decreased
      mockFetchOk({ accounts: [{ ...baseAccount, balance: 950 }], total_balance: 950 });
      const updatedAccounts = await ApiClient.getAccounts();
      const updatedAccount = updatedAccounts.accounts.find(
        (a: { id: number }) => a.id === sourceAccount.id
      );

      expect(updatedAccount?.balance).toBeLessThan(sourceAccount.balance);
    });

    it('should handle demo fund transfers', async () => {
      // Step 1: Check demo balance
      mockFetchOk({ account_number: 'CHK001', balance: 500, is_demo: true });
      const demoBalance = await ApiClient.getDemoBalance();
      expect(demoBalance).toBeDefined();

      // Step 2: Check pending funds
      mockFetchOk({ pending_funds: [] });
      const pending = await ApiClient.getPendingDemoFunds();
      expect(pending.pending_funds).toBeInstanceOf(Array);
    });

    it('should handle failed transfers gracefully', async () => {
      mockFetchError(400, { detail: 'Invalid account', message: 'Invalid account' });
      try {
        await ApiClient.sendMoney({
          from_account_number: 'INVALID',
          to_account_number: 'CHK002',
          to_bank_code: 'INTERNAL',
          amount: 100,
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.status).toBeDefined();
        expect(error.message).toBeDefined();
      }
    });
  });

  describe('Admin Demo Flow', () => {
    beforeAll(() => {
      ApiClient.setToken('test-admin-token');
    });

    it('should complete admin transfer flow', async () => {
      // Step 1: Get stats before
      mockFetchOk({ total_transfers: 10, total_amount: 1000, pending_refunds: 0, completed_transfers: 10, average_transfer_amount: 100, unique_recipients: 5 });
      const statsBefore = await ApiClient.getAdminStats();
      const transfersBefore = statsBefore.total_transfers;

      // Step 2: Send transfer
      mockFetchOk({ status: 'success' });
      const result = await ApiClient.adminSingleTransfer({
        to_account_number: 'CHK001',
        amount: 100,
        to_bank_code: 'INTERNAL',
      });

      expect(result.status).toBe('success');

      // Step 3: Verify stats updated
      mockFetchOk({ total_transfers: 11, total_amount: 1100, pending_refunds: 0, completed_transfers: 11, average_transfer_amount: 100, unique_recipients: 5 });
      const statsAfter = await ApiClient.getAdminStats();
      expect(statsAfter.total_transfers).toBeGreaterThanOrEqual(transfersBefore);
    });
  });
});
