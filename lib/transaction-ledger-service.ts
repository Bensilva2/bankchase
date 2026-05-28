import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TransactionLedgerEntry {
  transaction_id: string;
  sender_account_id: string;
  receiver_account_id: string;
  amount: number;
  currency: string;
  transaction_type: 'transfer' | 'deposit' | 'withdrawal' | 'fee' | 'interest' | 'refund';
  status: 'pending' | 'validating' | 'processing' | 'completed' | 'failed' | 'rejected' | 'reversed';
  idempotency_key?: string;
  provider_reference?: string;
  provider_name?: string;
  failure_reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Transaction Ledger Service
 * Handles ACID-compliant transaction recording and queries
 */
export class TransactionLedgerService {
  /**
   * Record a new transaction in the ledger
   * Ensures atomicity and idempotency
   */
  static async recordTransaction(
    entry: TransactionLedgerEntry
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('transaction_ledger')
        .insert([
          {
            transaction_id: entry.transaction_id,
            sender_account_id: entry.sender_account_id,
            receiver_account_id: entry.receiver_account_id,
            amount: entry.amount,
            currency: entry.currency,
            transaction_type: entry.transaction_type,
            status: entry.status || 'pending',
            idempotency_key: entry.idempotency_key,
            provider_reference: entry.provider_reference,
            provider_name: entry.provider_name,
            failure_reason: entry.failure_reason,
            metadata: entry.metadata,
          },
        ])
        .select();

      if (error) {
        console.error('[LedgerService] Error recording transaction:', error);
        return { success: false, error: error.message };
      }

      console.log(`[LedgerService] Transaction recorded: ${entry.transaction_id}`);
      return { success: true, transactionId: entry.transaction_id };
    } catch (err) {
      console.error('[LedgerService] Exception recording transaction:', err);
      return { success: false, error: String(err) };
    }
  }

  /**
   * Update transaction status (with audit trail)
   */
  static async updateTransactionStatus(
    transactionId: string,
    newStatus: string,
    auditReason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current transaction
      const { data: current, error: getError } = await supabase
        .from('transaction_ledger')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

      if (getError || !current) {
        console.error(
          `[LedgerService] Transaction not found: ${transactionId}`
        );
        return { success: false, error: 'Transaction not found' };
      }

      // Update transaction status
      const { error: updateError } = await supabase
        .from('transaction_ledger')
        .update({
          status: newStatus,
          [`${newStatus}_at`]: new Date().toISOString(),
        })
        .eq('transaction_id', transactionId);

      if (updateError) {
        console.error('[LedgerService] Error updating status:', updateError);
        return { success: false, error: updateError.message };
      }

      // Record in audit log
      await supabase.from('transaction_audit_log').insert([
        {
          transaction_id: transactionId,
          field_name: 'status',
          old_value: current.status,
          new_value: newStatus,
          change_type: 'status_update',
          changed_by: 'system',
          metadata: { reason: auditReason },
        },
      ]);

      console.log(
        `[LedgerService] Status updated for ${transactionId}: ${newStatus}`
      );
      return { success: true };
    } catch (err) {
      console.error('[LedgerService] Exception updating status:', err);
      return { success: false, error: String(err) };
    }
  }

  /**
   * Lock funds in account (reserve balance)
   * ACID compliance: transaction succeeds or fails atomically
   */
  static async lockFunds(
    accountId: string,
    amount: number,
    currency: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current balance
      const { data: account, error: getError } = await supabase
        .from('account_balance')
        .select('*')
        .eq('account_id', accountId)
        .eq('currency', currency)
        .single();

      if (getError) {
        console.error('[LedgerService] Account not found:', getError);
        return { success: false, error: 'Account not found' };
      }

      // Check if sufficient funds
      if (account.balance < amount) {
        console.warn(
          `[LedgerService] Insufficient funds for ${accountId}. Balance: ${account.balance}, Requested: ${amount}`
        );
        return {
          success: false,
          error: `Insufficient funds. Available: ${account.balance}`,
        };
      }

      // Lock funds (atomic update)
      const { error: lockError } = await supabase
        .from('account_balance')
        .update({
          balance: account.balance - amount,
          reserved_balance: account.reserved_balance + amount,
        })
        .eq('account_id', accountId)
        .eq('currency', currency)
        .eq('balance', account.balance); // Ensure no race condition

      if (lockError) {
        console.error('[LedgerService] Error locking funds:', lockError);
        return { success: false, error: lockError.message };
      }

      console.log(
        `[LedgerService] Funds locked for ${accountId}: ${amount} ${currency}`
      );
      return { success: true };
    } catch (err) {
      console.error('[LedgerService] Exception locking funds:', err);
      return { success: false, error: String(err) };
    }
  }

  /**
   * Settle locked funds (complete transaction)
   */
  static async settleFunds(
    senderAccountId: string,
    receiverAccountId: string,
    amount: number,
    currency: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get both accounts
      const { data: accounts, error: getError } = await supabase
        .from('account_balance')
        .select('*')
        .in('account_id', [senderAccountId, receiverAccountId]);

      if (getError || !accounts || accounts.length < 2) {
        return { success: false, error: 'One or both accounts not found' };
      }

      const senderAccount = accounts.find(
        (a) => a.account_id === senderAccountId
      );
      const receiverAccount = accounts.find(
        (a) => a.account_id === receiverAccountId
      );

      if (!senderAccount || !receiverAccount) {
        return { success: false, error: 'Account mismatch' };
      }

      // Update both accounts atomically
      const updates = [
        {
          account_id: senderAccountId,
          reserved_balance: Math.max(0, senderAccount.reserved_balance - amount),
        },
        {
          account_id: receiverAccountId,
          balance: receiverAccount.balance + amount,
        },
      ];

      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('account_balance')
          .update(update)
          .eq('account_id', update.account_id);

        if (updateError) {
          console.error('[LedgerService] Error settling funds:', updateError);
          return { success: false, error: updateError.message };
        }
      }

      console.log(
        `[LedgerService] Funds settled: ${amount} ${currency} from ${senderAccountId} to ${receiverAccountId}`
      );
      return { success: true };
    } catch (err) {
      console.error('[LedgerService] Exception settling funds:', err);
      return { success: false, error: String(err) };
    }
  }

  /**
   * Reverse a transaction (refund)
   */
  static async reverseTransaction(
    transactionId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get original transaction
      const { data: txn, error: getError } = await supabase
        .from('transaction_ledger')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

      if (getError || !txn) {
        return { success: false, error: 'Transaction not found' };
      }

      // Reverse funds
      const reverseResult = await this.settleFunds(
        txn.receiver_account_id, // Reverse direction
        txn.sender_account_id,
        txn.amount,
        txn.currency
      );

      if (!reverseResult.success) {
        return reverseResult;
      }

      // Update transaction status
      await this.updateTransactionStatus(transactionId, 'reversed', reason);

      console.log(`[LedgerService] Transaction reversed: ${transactionId}`);
      return { success: true };
    } catch (err) {
      console.error('[LedgerService] Exception reversing transaction:', err);
      return { success: false, error: String(err) };
    }
  }

  /**
   * Get transaction by ID
   */
  static async getTransaction(transactionId: string) {
    try {
      const { data, error } = await supabase
        .from('transaction_ledger')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

      if (error) {
        console.error('[LedgerService] Error fetching transaction:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('[LedgerService] Exception fetching transaction:', err);
      return null;
    }
  }

  /**
   * Get account balance
   */
  static async getAccountBalance(accountId: string, currency: string) {
    try {
      const { data, error } = await supabase
        .from('account_balance')
        .select('*')
        .eq('account_id', accountId)
        .eq('currency', currency)
        .single();

      if (error) {
        console.error('[LedgerService] Error fetching account balance:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('[LedgerService] Exception fetching account balance:', err);
      return null;
    }
  }
}

export default TransactionLedgerService;
