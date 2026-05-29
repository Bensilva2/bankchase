import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { PlaidService } from './plaid-service';

const PLAID_ENV = process.env.PLAID_ENV || 'production';
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_DASHBOARD_TOKEN = process.env.PLAID_DASHBOARD_TOKEN;
const BASE_URL = PLAID_ENV === 'production'
  ? 'https://production.plaid.com'
  : 'https://sandbox.plaid.com';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

interface ItemHealthReport {
  item_id: string;
  institution_id: string;
  institution_name: string;
  status: 'healthy' | 'warning' | 'error';
  last_webhook_code?: string;
  last_webhook_timestamp?: string;
  error_summary?: string;
  recommendations?: string[];
}

interface ItemDebugInfo {
  item_id: string;
  institution_id: string;
  institution_name: string;
  accounts_count: number;
  last_successful_webhook?: string;
  webhook_failures_24h: number;
  transactions_synced: number;
  last_transaction_date?: string;
  consent_expiration?: string;
  requires_re_authentication: boolean;
  known_issues?: string[];
}

export class PlaidDebugService {
  /**
   * Get comprehensive item debug information
   * Equivalent to plaid_debug_item from Dashboard MCP
   */
  static async debugItem(accessToken: string): Promise<ItemDebugInfo> {
    try {
      const itemData = await PlaidService.getItem(accessToken);
      
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get item status from database
      const { data: statusData, error: statusError } = await supabase
        .from('plaid_item_status')
        .select('*')
        .eq('item_id', itemData.item.item_id)
        .single();

      if (statusError && statusError.code !== 'PGRST116') {
        throw statusError;
      }

      // Get transactions count
      const { data: transactions, error: txError } = await supabase
        .from('plaid_transactions')
        .select('created_at')
        .eq('item_id', itemData.item.item_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (txError && txError.code !== 'PGRST116') {
        throw txError;
      }

      const recommendations: string[] = [];

      // Check for common issues
      if (statusData?.item_login_required) {
        recommendations.push('User needs to re-authenticate via Plaid Link');
      }

      if (statusData?.error_code) {
        recommendations.push(`Item has error: ${statusData.error_code}`);
      }

      if (!statusData?.last_successful_webhook) {
        recommendations.push('No successful webhooks received');
      }

      if (statusData?.consent_expiration_time) {
        const expirationDate = new Date(statusData.consent_expiration_time);
        if (expirationDate < new Date()) {
          recommendations.push('User consent has expired');
        } else if ((expirationDate.getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000) {
          recommendations.push('User consent expiring within 7 days');
        }
      }

      return {
        item_id: itemData.item.item_id,
        institution_id: itemData.item.institution_id,
        institution_name: statusData?.institution_name || 'Unknown',
        accounts_count: itemData.accounts?.length || 0,
        last_successful_webhook: statusData?.last_successful_webhook,
        webhook_failures_24h: statusData?.webhook_failures_24h || 0,
        transactions_synced: transactions?.length || 0,
        last_transaction_date: transactions?.[0]?.created_at,
        consent_expiration: statusData?.consent_expiration_time,
        requires_re_authentication: statusData?.item_login_required || false,
        known_issues: statusData?.error_code ? [statusData.error_code] : [],
      };
    } catch (error: any) {
      console.error('[v0] Error debugging item:', error);
      throw error;
    }
  }

  /**
   * Get health report for an item
   */
  static async getItemHealthReport(itemId: string): Promise<ItemHealthReport> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data: statusData, error } = await supabase
        .from('plaid_item_status')
        .select('*')
        .eq('item_id', itemId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const recommendations: string[] = [];
      let status: 'healthy' | 'warning' | 'error' = 'healthy';

      if (statusData?.item_login_required) {
        status = 'error';
        recommendations.push('User must re-authenticate');
      }

      if (statusData?.error_code) {
        status = 'error';
        recommendations.push(`Error: ${statusData.error_code}`);
      }

      if ((statusData?.webhook_failures_24h || 0) > 5) {
        status = status === 'error' ? 'error' : 'warning';
        recommendations.push('Multiple webhook failures in last 24 hours');
      }

      if (!statusData?.last_successful_webhook) {
        status = status === 'error' ? 'error' : 'warning';
        recommendations.push('No successful webhooks received');
      }

      return {
        item_id: itemId,
        institution_id: statusData?.institution_id || '',
        institution_name: statusData?.institution_name || 'Unknown',
        status,
        last_webhook_code: statusData?.webhook_code,
        last_webhook_timestamp: statusData?.last_webhook_timestamp,
        error_summary: statusData?.error_message,
        recommendations,
      };
    } catch (error: any) {
      console.error('[v0] Error getting item health:', error);
      throw error;
    }
  }

  /**
   * Save item error for debugging
   */
  static async saveItemError(
    userId: string,
    itemId: string,
    institutionId: string,
    institutionName: string,
    webhookCode: string,
    webhookType: string,
    errorCode?: string,
    errorMessage?: string,
    requestId?: string
  ) {
    if (!supabase) throw new Error('Supabase client not initialized');

    try {
      const { error } = await supabase
        .from('plaid_item_status')
        .upsert({
          user_id: userId,
          item_id: itemId,
          institution_id: institutionId,
          institution_name: institutionName,
          webhook_code: webhookCode,
          webhook_type: webhookType,
          error_code: errorCode,
          error_message: errorMessage,
          last_webhook_timestamp: new Date().toISOString(),
          request_id: requestId,
        }, {
          onConflict: 'item_id,user_id',
        });

      if (error) throw error;
      console.log('[v0] Item error logged');
    } catch (error: any) {
      console.error('[v0] Error saving item error:', error);
    }
  }

  /**
   * Simulate webhook for testing
   */
  static async simulateWebhook(accessToken: string, webhookCode: string) {
    try {
      const response = await axios.post(`${BASE_URL}/sandbox/item/fire_webhook`, {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: accessToken,
        webhook_code: webhookCode,
      });

      console.log('[v0] Webhook simulated');
      return response.data;
    } catch (error: any) {
      console.error('[v0] Error simulating webhook:', error);
      throw error;
    }
  }

  /**
   * Force transaction sync
   */
  static async forceTransactionSync(accessToken: string) {
    try {
      const response = await axios.post(`${BASE_URL}/sandbox/transactions/refresh`, {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: accessToken,
      });

      console.log('[v0] Transaction sync forced');
      return response.data;
    } catch (error: any) {
      console.error('[v0] Error forcing sync:', error);
      throw error;
    }
  }

  /**
   * Get webhook history
   */
  static async getWebhookHistory(itemId: string, limit: number = 50) {
    if (!supabase) throw new Error('Supabase client not initialized');

    try {
      const { data, error } = await supabase
        .from('plaid_item_status')
        .select('*')
        .eq('item_id', itemId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('[v0] Error getting webhook history:', error);
      throw error;
    }
  }

  /**
   * Get error trends over time
   */
  static async getErrorTrends(userId: string, days: number = 30) {
    if (!supabase) throw new Error('Supabase client not initialized');

    try {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);

      const { data, error } = await supabase
        .from('plaid_item_status')
        .select('created_at, error_code')
        .eq('user_id', userId)
        .gte('created_at', sinceDate.toISOString())
        .not('error_code', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by day and error code
      const trends = new Map<string, Map<string, number>>();
      (data || []).forEach(record => {
        const date = new Date(record.created_at).toISOString().split('T')[0];
        if (!trends.has(date)) {
          trends.set(date, new Map());
        }
        const dayErrors = trends.get(date)!;
        const code = record.error_code || 'unknown';
        dayErrors.set(code, (dayErrors.get(code) || 0) + 1);
      });

      return Object.fromEntries(
        Array.from(trends.entries()).map(([date, errors]) => [
          date,
          Object.fromEntries(errors),
        ])
      );
    } catch (error: any) {
      console.error('[v0] Error getting error trends:', error);
      throw error;
    }
  }
}
