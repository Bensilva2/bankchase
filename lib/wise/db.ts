import { createClient } from '@supabase/supabase-js';

let supabase: any = null;

function getSupabaseClient() {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }

    supabase = createClient(url, key);
  }
  return supabase;
}

export interface WiseTransfer {
  id: string;
  created_at: string;
  updated_at: string;
  wise_transfer_id: string;
  wise_quote_uuid: string;
  user_id: string;
  from_account_id: string | null;
  source_currency: string;
  target_currency: string;
  source_amount: number;
  target_amount: number;
  exchange_rate: number;
  fee_amount: number | null;
  recipient_account_id: string;
  recipient_account_number: string | null;
  recipient_name: string | null;
  recipient_bank: string | null;
  status: string;
  previous_status: string | null;
  customer_transaction_id: string | null;
  funded_at: string | null;
  completed_at: string | null;
  error_code: string | null;
  error_message: string | null;
  last_error_details: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  webhook_events: Record<string, unknown>[] | null;
}

export interface WiseRecipient {
  id: string;
  created_at: string;
  user_id: string;
  wise_recipient_id: string;
  account_holder_name: string;
  currency: string;
  account_number: string | null;
  account_type: string | null;
  bank_code: string | null;
  bank_name: string | null;
  bank_details: Record<string, unknown>;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
}

// Transfer operations
export async function createTransfer(data: Omit<WiseTransfer, 'id' | 'created_at' | 'updated_at'>) {
  const supabaseClient = getSupabaseClient();
  const { data: transfer, error } = await supabaseClient
    .from('wise_transfers')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return transfer as WiseTransfer;
}

export async function updateTransfer(id: string, updates: Partial<WiseTransfer>) {
  const supabaseClient = getSupabaseClient();
  const { data: transfer, error } = await supabaseClient
    .from('wise_transfers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return transfer as WiseTransfer;
}

export async function getTransfer(id: string) {
  const supabaseClient = getSupabaseClient();
  const { data: transfer, error } = await supabaseClient
    .from('wise_transfers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return transfer as WiseTransfer;
}

export async function getTransferByWiseId(wiseTransferId: string) {
  const supabaseClient = getSupabaseClient();
  const { data: transfer, error } = await supabaseClient
    .from('wise_transfers')
    .select('*')
    .eq('wise_transfer_id', wiseTransferId)
    .single();

  if (error) throw error;
  return transfer as WiseTransfer;
}

export async function getUserTransfers(userId: string, limit = 10, offset = 0) {
  const supabaseClient = getSupabaseClient();
  const { data: transfers, error, count } = await supabaseClient
    .from('wise_transfers')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { transfers: transfers as WiseTransfer[], total: count || 0 };
}

// Recipient operations
export async function createRecipient(data: Omit<WiseRecipient, 'id' | 'created_at'>) {
  const supabaseClient = getSupabaseClient();
  const { data: recipient, error } = await supabaseClient
    .from('wise_recipients')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return recipient as WiseRecipient;
}

export async function getUserRecipients(userId: string, currency?: string) {
  const supabaseClient = getSupabaseClient();
  let query = supabaseClient
    .from('wise_recipients')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (currency) {
    query = query.eq('currency', currency);
  }

  const { data: recipients, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return recipients as WiseRecipient[];
}

export async function getRecipient(id: string) {
  const supabaseClient = getSupabaseClient();
  const { data: recipient, error } = await supabaseClient
    .from('wise_recipients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return recipient as WiseRecipient;
}

// Webhook operations
export async function createWebhookLog(data: {
  event_id: string;
  event_type: string;
  occurred_at: string | null;
  wise_transfer_id: string | null;
  user_id: string | null;
  event_data: Record<string, unknown>;
}) {
  const supabaseClient = getSupabaseClient();
  const { data: log, error } = await supabaseClient
    .from('wise_webhooks')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return log;
}

export async function updateWebhookLog(id: string, updates: {
  processed_at?: string;
  processing_error?: string;
}) {
  const supabaseClient = getSupabaseClient();
  const { data: log, error } = await supabaseClient
    .from('wise_webhooks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return log;
}

export async function getUnprocessedWebhooks(limit = 100) {
  const supabaseClient = getSupabaseClient();
  const { data: webhooks, error } = await supabaseClient
    .from('wise_webhooks')
    .select('*')
    .is('processed_at', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return webhooks;
}

// API logging
export async function logApiCall(data: {
  method: string;
  endpoint: string;
  request_body?: Record<string, unknown>;
  response_status?: number;
  response_body?: Record<string, unknown>;
  duration_ms: number;
  error_message?: string;
  user_id?: string;
  wise_transfer_id?: string;
}) {
  try {
    const supabaseClient = getSupabaseClient();
    const { error } = await supabaseClient
      .from('wise_api_logs')
      .insert([data]);

    if (error) {
      console.error('Failed to log API call:', error);
    }
  } catch (err) {
    console.error('Error logging API call:', err);
  }
}

export async function transferExists(wiseTransferId: string): Promise<boolean> {
  const supabaseClient = getSupabaseClient();
  const { data, error } = await supabaseClient
    .from('wise_transfers')
    .select('id')
    .eq('wise_transfer_id', wiseTransferId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return !!data;
}
