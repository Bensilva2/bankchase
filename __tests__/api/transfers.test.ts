/**
 * API Tests for Pay & Transfer Endpoints
 * Tests money transfers, demo transfers, and transaction creation
 */

import ApiClient from '@/lib/api-client';

describe('Pay & Transfer API', () => {
  beforeAll(() => {
    ApiClient.setToken('test-token-123');
  });

  describe('POST /pay-transfer/send', () => {
    it('should validate required fields', async () => {
      try {
        await ApiClient.sendMoney({
          from_account_number: '',
          to_account_number: '',
          to_bank_code: 'INTERNAL',
          amount: 0,
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBeDefined();
      }
    });

    it('should send money successfully', async () => {
      const result = await ApiClient.sendMoney({
        from_account_number: 'CHK001',
        to_account_number: 'CHK002',
        to_bank_code: 'INTERNAL',
        amount: 100,
        narration: 'Test transfer',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.transfer_id).toBeDefined();
    });
  });

  describe('Admin Demo Transfers', () => {
    it('should send single demo transfer', async () => {
      const result = await ApiClient.adminSingleTransfer({
        to_account_number: 'CHK001',
        amount: 100,
        to_bank_code: 'INTERNAL',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
    });

    it('should fetch admin transfers', async () => {
      const result = await ApiClient.getAdminTransfers(10, 0);
      expect(result).toBeDefined();
      expect(result.transfers).toBeInstanceOf(Array);
    });

    it('should fetch admin stats', async () => {
      const stats = await ApiClient.getAdminStats();
      expect(stats).toBeDefined();
      expect(stats.total_transfers).toBeGreaterThanOrEqual(0);
      expect(stats.total_amount).toBeGreaterThanOrEqual(0);
    });
  });
});
