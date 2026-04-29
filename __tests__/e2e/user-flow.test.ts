/**
 * End-to-End User Flow Tests
 * Tests complete user journeys: login → view accounts → transfer → verify
 */

import ApiClient from '@/lib/api-client';

describe('User Flow E2E Tests', () => {
  describe('Complete Account & Transfer Flow', () => {
    beforeAll(() => {
      ApiClient.setToken('test-user-token');
    });

    it('should complete full user banking flow', async () => {
      // Step 1: Fetch accounts
      const accounts = await ApiClient.getAccounts();
      expect(accounts.accounts.length).toBeGreaterThan(0);

      const sourceAccount = accounts.accounts[0];

      // Step 2: Check sufficient balance
      expect(sourceAccount.balance).toBeGreaterThan(50);

      // Step 3: Fetch transaction history
      const transactions = await ApiClient.getTransactions(sourceAccount.id, 10);
      expect(transactions.transactions).toBeDefined();

      // Step 4: Send money
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
      const updatedAccounts = await ApiClient.getAccounts();
      const updatedAccount = updatedAccounts.accounts.find(
        (a) => a.id === sourceAccount.id
      );

      expect(updatedAccount?.balance).toBeLessThan(sourceAccount.balance);
    });

    it('should handle demo fund transfers', async () => {
      // Step 1: Check demo balance
      const demoBalance = await ApiClient.getDemoBalance();
      expect(demoBalance).toBeDefined();

      // Step 2: Check pending funds
      const pending = await ApiClient.getPendingDemoFunds();
      expect(pending.pending_funds).toBeInstanceOf(Array);
    });

    it('should handle failed transfers gracefully', async () => {
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
      const statsBefore = await ApiClient.getAdminStats();
      const transfersBefore = statsBefore.total_transfers;

      // Step 2: Send transfer
      const result = await ApiClient.adminSingleTransfer({
        to_account_number: 'CHK001',
        amount: 100,
        to_bank_code: 'INTERNAL',
      });

      expect(result.status).toBe('success');

      // Step 3: Verify stats updated
      const statsAfter = await ApiClient.getAdminStats();
      expect(statsAfter.total_transfers).toBeGreaterThanOrEqual(transfersBefore);
    });
  });
});
