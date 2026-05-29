import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface DemoTransferRequest {
  toAccountNumber: string;
  amount: number;
  daysToRefund?: number;
  adminUserId: string;
}

export interface BulkDemoTransferRequest {
  amount: number;
  daysToRefund?: number;
  adminUserId: string;
}

export interface DemoTransfer {
  id: string;
  transfer_reference: string;
  admin_user_id: string;
  to_account_number: string;
  amount: number;
  status: 'pending' | 'completed' | 'refunded';
  transfer_type: 'internal' | 'external';
  created_at: string;
  expires_at?: string;
  refunded_at?: string;
}

/**
 * Send demo money to a single account
 * - If recipient is registered: instant credit (internal)
 * - If recipient is external: pending with auto-refund (external)
 */
export async function sendDemoTransfer(request: DemoTransferRequest): Promise<any> {
  try {
    const response = await axios.post(
      `${API_BASE}/api/admin/demo-transfer`,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('[v0] Demo transfer error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to send demo transfer');
  }
}

/**
 * Send demo money to all registered users
 * - Only available to SuperAdmin
 * - All transfers are instant (internal)
 */
export async function sendBulkDemoTransfer(request: BulkDemoTransferRequest): Promise<any> {
  try {
    const response = await axios.post(
      `${API_BASE}/api/admin/demo-transfer/bulk`,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('[v0] Bulk demo transfer error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to send bulk demo transfer');
  }
}

/**
 * Process expired demo transfers for auto-refund
 * - Called by scheduled job (daily)
 * - Returns funds to admin account if expires_at <= now
 */
export async function processExpiredTransfers(cronSecret: string): Promise<any> {
  try {
    const response = await axios.post(
      `${API_BASE}/api/admin/demo-transfer/process-refunds`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('[v0] Process refunds error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to process refunds');
  }
}

/**
 * Get demo transfer history for admin
 */
export async function getDemoTransferHistory(
  adminUserId: string,
  filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ transfers: DemoTransfer[]; total: number }> {
  try {
    const params = new URLSearchParams({
      adminUserId,
      ...(filters?.status && { status: filters.status }),
      limit: String(filters?.limit || 50),
      offset: String(filters?.offset || 0),
    });

    const response = await axios.get(
      `${API_BASE}/api/admin/demo-transfer/history?${params}`
    );

    return response.data;
  } catch (error: any) {
    console.error('[v0] Get transfer history error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to fetch transfer history');
  }
}

/**
 * Calculate days until refund for pending transfer
 */
export function getDaysUntilRefund(expiresAt: string): number {
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Format transfer for UI display
 */
export function formatTransferForDisplay(transfer: DemoTransfer) {
  const daysUntilRefund = transfer.status === 'pending' && transfer.expires_at
    ? getDaysUntilRefund(transfer.expires_at)
    : null;

  return {
    ...transfer,
    statusLabel: {
      pending: 'Pending Credit',
      completed: 'Completed',
      refunded: 'Refunded',
    }[transfer.status],
    typeLabel: {
      internal: 'Registered User',
      external: 'External Account',
    }[transfer.transfer_type],
    daysUntilRefund,
    refundNote: daysUntilRefund
      ? `Will auto-refund in ${daysUntilRefund} days`
      : null,
  };
}
