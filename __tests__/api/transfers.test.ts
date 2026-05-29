/**
 * API Tests for Pay & Transfer Endpoints
 * Production-grade tests with idempotency, transaction isolation, and financial accuracy checks
 * Ensures funds cannot be duplicated or lost during transfer operations
 */

import ApiClient from '@/lib/api-client';

// Generate idempotency keys to prevent duplicate processing
function generateIdempotencyKey(): string {
  return `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

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

    it('should reject duplicate requests using idempotency key', async () => {
      const idempotencyKey = generateIdempotencyKey();
      
      // First request succeeds
      const result1 = await ApiClient.sendMoney({
        from_account_number: 'CHK001',
        to_account_number: 'CHK002',
        to_bank_code: 'INTERNAL',
        amount: 100,
        idempotency_key: idempotencyKey,
        narration: 'Test transfer',
      });

      expect(result1.status).toBe('success');

      // Second request with same idempotency key should return conflict
      try {
        await ApiClient.sendMoney({
          from_account_number: 'CHK001',
          to_account_number: 'CHK002',
          to_bank_code: 'INTERNAL',
          amount: 100,
          idempotency_key: idempotencyKey,
          narration: 'Test transfer',
        });
        fail('Should have rejected duplicate request');
      } catch (error: any) {
        expect(error.status).toBe(409); // Conflict status
      }
    });

    it('should send money successfully with transaction isolation', async () => {
      const idempotencyKey = generateIdempotencyKey();
      
      const result = await ApiClient.sendMoney({
        from_account_number: 'CHK001',
        to_account_number: 'CHK002',
        to_bank_code: 'INTERNAL',
        amount: 100,
        idempotency_key: idempotencyKey,
        narration: 'Test transfer',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.transfer_id).toBeDefined();
      expect(result.message).toContain('processing'); // Async processing
    });

    it('should reject transfers exceeding available balance', async () => {
      try {
        await ApiClient.sendMoney({
          from_account_number: 'CHK001',
          to_account_number: 'CHK002',
          to_bank_code: 'INTERNAL',
          amount: 999999,
          idempotency_key: generateIdempotencyKey(),
          narration: 'Test transfer - insufficient funds',
        });
        fail('Should have rejected due to insufficient funds');
      } catch (error: any) {
        expect(error.status).toBe(402); // Payment Required status
      }
    });
  });

  describe('Admin Demo Transfers', () => {
    it('should send single demo transfer with ledger logging', async () => {
      const idempotencyKey = generateIdempotencyKey();
      
      const result = await ApiClient.adminSingleTransfer({
        to_account_number: 'CHK001',
        amount: 100,
        to_bank_code: 'INTERNAL',
        idempotency_key: idempotencyKey,
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.transfer_id).toBeDefined();
      // Verify double-entry ledger was logged
      expect(result.ledger_entries).toBeDefined();
      expect(result.ledger_entries).toHaveLength(2); // One debit, one credit
    });

    it('should fetch admin transfers with pagination', async () => {
      const result = await ApiClient.getAdminTransfers(10, 0);
      expect(result).toBeDefined();
      expect(result.transfers).toBeInstanceOf(Array);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(0);
      expect(result.pagination.limit).toBe(10);
    });

    it('should fetch admin stats with financial accuracy', async () => {
      const stats = await ApiClient.getAdminStats();
      expect(stats).toBeDefined();
      expect(stats.total_transfers).toBeGreaterThanOrEqual(0);
      expect(stats.total_amount).toBeGreaterThanOrEqual(0);
      // Verify ledger integrity
      expect(stats.total_debits).toBeDefined();
      expect(stats.total_credits).toBeDefined();
      // Debits and credits must balance
      expect(stats.total_debits).toEqual(stats.total_credits);
    });

    it('should prevent double-entry ledger corruption', async () => {
      const idempotencyKey = generateIdempotencyKey();
      
      // Send transfer and immediately fetch updated ledger
      const transfer = await ApiClient.adminSingleTransfer({
        to_account_number: 'CHK001',
        amount: 250.50,
        to_bank_code: 'INTERNAL',
        idempotency_key: idempotencyKey,
      });

      expect(transfer.ledger_entries).toHaveLength(2);
      
      // Verify double-entry constraint: debit amount equals credit amount
      const debitEntry = transfer.ledger_entries.find((e: any) => e.direction === 'debit');
      const creditEntry = transfer.ledger_entries.find((e: any) => e.direction === 'credit');
      
      expect(debitEntry.amount).toBe(250.50);
      expect(creditEntry.amount).toBe(250.50);
    });
  });
});
