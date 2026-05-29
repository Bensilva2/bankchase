import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const PLAID_ENV = process.env.PLAID_ENV || 'production';
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const BASE_URL = PLAID_ENV === 'production'
  ? 'https://production.plaid.com'
  : 'https://sandbox.plaid.com';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

interface PlaidConfig {
  clientId: string;
  secret: string;
  clientName: string;
  user?: {
    clientUserId: string;
  };
  language?: string;
  countryCodes?: string[];
  accountSubtypes?: string[];
}

interface LinkTokenResponse {
  linkToken: string;
  expiration: string;
  requestId: string;
}

interface ExchangeTokenResponse {
  itemId: string;
  accessToken: string;
  requestId: string;
}

interface AccountsResponse {
  accounts: Array<{
    accountId: string;
    name: string;
    mask: string;
    type: string;
    subtype: string;
    balances: {
      available: number | null;
      current: number;
      limit: number | null;
      isoCourrencyCode: string | null;
    };
  }>;
  item: {
    itemId: string;
    institutionId: string;
  };
  requestId: string;
}

interface TransactionsResponse {
  accounts: Array<{
    accountId: string;
    name: string;
    mask: string;
    type: string;
  }>;
  transactions: Array<{
    transactionId: string;
    accountId: string;
    amount: number;
    isoCurrencyCode: string;
    date: string;
    name: string;
    merchantName?: string;
    category?: string[];
    personalFinanceCategory?: {
      primary: string;
      detailed: string;
    };
    direction?: string;
  }>;
  item: {
    itemId: string;
    institutionId: string;
  };
  requestId: string;
}

export class PlaidService {
  /**
   * Create a link token for Plaid Link initialization
   */
  static async createLinkToken(userId: string, clientName: string = 'MyBank'): Promise<LinkTokenResponse> {
    try {
      const response = await axios.post(`${BASE_URL}/link/token/create`, {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        client_name: clientName,
        user: {
          client_user_id: userId,
        },
        client_metadata: {
          client_app_version: '1.0.0',
        },
        countryCodes: ['US'],
        language: 'en',
        products: ['auth', 'transactions'],
        account_subtypes: ['checking', 'savings', 'credit card'],
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/plaid/callback`,
      });

      console.log('[v0] Plaid link token created successfully');
      return response.data;
    } catch (error: any) {
      console.error('[v0] Error creating Plaid link token:', error.response?.data || error.message);
      throw new Error(`Failed to create link token: ${error.message}`);
    }
  }

  /**
   * Exchange public token for access token
   */
  static async exchangePublicToken(publicToken: string): Promise<ExchangeTokenResponse> {
    try {
      const response = await axios.post(`${BASE_URL}/item/public_token/exchange`, {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        public_token: publicToken,
      });

      console.log('[v0] Public token exchanged successfully');
      return response.data;
    } catch (error: any) {
      console.error('[v0] Error exchanging public token:', error.response?.data || error.message);
      throw new Error(`Failed to exchange token: ${error.message}`);
    }
  }

  /**
   * Get accounts and balances for a linked item
   */
  static async getAccounts(accessToken: string): Promise<AccountsResponse> {
    try {
      const response = await axios.post(`${BASE_URL}/accounts/get`, {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: accessToken,
      });

      console.log('[v0] Accounts retrieved successfully');
      return response.data;
    } catch (error: any) {
      console.error('[v0] Error fetching accounts:', error.response?.data || error.message);
      throw new Error(`Failed to get accounts: ${error.message}`);
    }
  }

  /**
   * Get transactions for an account
   */
  static async getTransactions(
    accessToken: string,
    startDate: string,
    endDate: string,
    options?: { accountIds?: string[] }
  ): Promise<TransactionsResponse> {
    try {
      const payload: any = {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
      };

      if (options?.accountIds) {
        payload.account_ids = options.accountIds;
      }

      const response = await axios.post(`${BASE_URL}/transactions/get`, payload);

      console.log('[v0] Transactions retrieved successfully');
      return response.data;
    } catch (error: any) {
      console.error('[v0] Error fetching transactions:', error.response?.data || error.message);
      throw new Error(`Failed to get transactions: ${error.message}`);
    }
  }

  /**
   * Sync transactions (for recurring syncs)
   */
  static async syncTransactions(accessToken: string, cursor?: string) {
    try {
      const payload: any = {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: accessToken,
      };

      if (cursor) {
        payload.cursor = cursor;
      }

      const response = await axios.post(`${BASE_URL}/transactions/sync`, payload);
      console.log('[v0] Transactions synced successfully');
      return response.data;
    } catch (error: any) {
      console.error('[v0] Error syncing transactions:', error.response?.data || error.message);
      throw new Error(`Failed to sync transactions: ${error.message}`);
    }
  }

  /**
   * Get item details for debugging
   */
  static async getItem(accessToken: string) {
    try {
      const response = await axios.post(`${BASE_URL}/item/get`, {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: accessToken,
      });

      console.log('[v0] Item details retrieved');
      return response.data;
    } catch (error: any) {
      console.error('[v0] Error fetching item:', error.response?.data || error.message);
      throw new Error(`Failed to get item: ${error.message}`);
    }
  }

  /**
   * Update webhook URL for an item
   */
  static async setWebhook(accessToken: string, webhookUrl: string) {
    try {
      const response = await axios.post(`${BASE_URL}/item/webhook/update`, {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: accessToken,
        webhook: webhookUrl,
      });

      console.log('[v0] Webhook updated');
      return response.data;
    } catch (error: any) {
      console.error('[v0] Error updating webhook:', error.response?.data || error.message);
      throw new Error(`Failed to update webhook: ${error.message}`);
    }
  }

  /**
   * Save account to database
   */
  static async saveAccount(
    userId: string,
    itemId: string,
    accessToken: string,
    institutionId: string,
    accountData: any
  ) {
    if (!supabase) throw new Error('Supabase client not initialized');

    try {
      const { error } = await supabase
        .from('plaid_accounts')
        .insert({
          user_id: userId,
          item_id: itemId,
          access_token: accessToken,
          institution_id: institutionId,
          institution_name: accountData.institutionName,
          account_id: accountData.accountId,
          account_name: accountData.name,
          account_type: accountData.type,
          account_subtype: accountData.subtype,
          account_mask: accountData.mask,
          balance_current: accountData.balances?.current,
          balance_available: accountData.balances?.available,
          balance_limit: accountData.balances?.limit,
          currency_code: accountData.balances?.isoCurrencyCode || 'USD',
          status: 'active',
        });

      if (error) throw error;
      console.log('[v0] Account saved to database');
    } catch (error: any) {
      console.error('[v0] Error saving account:', error);
      throw error;
    }
  }

  /**
   * Get user's linked accounts
   */
  static async getUserAccounts(userId: string) {
    if (!supabase) throw new Error('Supabase client not initialized');

    try {
      const { data, error } = await supabase
        .from('plaid_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('[v0] Error fetching user accounts:', error);
      throw error;
    }
  }

  /**
   * Save transactions to database
   */
  static async saveTransactions(userId: string, plaidAccountId: string, transactions: any[]) {
    if (!supabase) throw new Error('Supabase client not initialized');

    try {
      const transactionRecords = transactions.map(t => ({
        user_id: userId,
        plaid_account_id: plaidAccountId,
        transaction_id: t.transactionId,
        pending_transaction_id: t.pendingTransactionId,
        amount: t.amount,
        iso_currency_code: t.isoCurrencyCode,
        category_id: t.categoryId,
        categories: t.category || [],
        check_number: t.checkNumber,
        counterparty_id: t.counterpartyId,
        counterparty_name: t.counterpartyName,
        date: t.date,
        merchant_name: t.merchantName,
        name: t.name,
        original_description: t.originalDescription,
      }));

      const { error } = await supabase
        .from('plaid_transactions')
        .upsert(transactionRecords, { onConflict: 'transaction_id' });

      if (error) throw error;
      console.log(`[v0] Saved ${transactionRecords.length} transactions`);
    } catch (error: any) {
      console.error('[v0] Error saving transactions:', error);
      throw error;
    }
  }
}
