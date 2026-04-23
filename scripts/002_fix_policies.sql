-- Fix: Drop and recreate all RLS policies
-- Tables already exist from 001, just need policies fixed

-- USERS policies
DROP POLICY IF EXISTS "users_read_own" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_read_own" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (true);

-- ACCOUNTS policies
DROP POLICY IF EXISTS "accounts_read" ON public.accounts;
DROP POLICY IF EXISTS "accounts_insert" ON public.accounts;
DROP POLICY IF EXISTS "accounts_update" ON public.accounts;
DROP POLICY IF EXISTS "accounts_delete" ON public.accounts;
CREATE POLICY "accounts_read" ON public.accounts FOR SELECT USING (true);
CREATE POLICY "accounts_insert" ON public.accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "accounts_update" ON public.accounts FOR UPDATE USING (true);
CREATE POLICY "accounts_delete" ON public.accounts FOR DELETE USING (true);

-- TRANSACTIONS policies
DROP POLICY IF EXISTS "transactions_read" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update" ON public.transactions;
CREATE POLICY "transactions_read" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE USING (true);

-- NOTIFICATIONS policies
DROP POLICY IF EXISTS "notifications_read" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;
CREATE POLICY "notifications_read" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE USING (true);

-- CREDIT SCORES policies
DROP POLICY IF EXISTS "credit_scores_read" ON public.credit_scores;
DROP POLICY IF EXISTS "credit_scores_insert" ON public.credit_scores;
DROP POLICY IF EXISTS "credit_scores_update" ON public.credit_scores;
CREATE POLICY "credit_scores_read" ON public.credit_scores FOR SELECT USING (true);
CREATE POLICY "credit_scores_insert" ON public.credit_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "credit_scores_update" ON public.credit_scores FOR UPDATE USING (true);

-- WIRE TRANSFERS policies
DROP POLICY IF EXISTS "wire_transfers_read" ON public.wire_transfers;
DROP POLICY IF EXISTS "wire_transfers_insert" ON public.wire_transfers;
DROP POLICY IF EXISTS "wire_transfers_update" ON public.wire_transfers;
CREATE POLICY "wire_transfers_read" ON public.wire_transfers FOR SELECT USING (true);
CREATE POLICY "wire_transfers_insert" ON public.wire_transfers FOR INSERT WITH CHECK (true);
CREATE POLICY "wire_transfers_update" ON public.wire_transfers FOR UPDATE USING (true);

-- ZELLE TRANSFERS policies
DROP POLICY IF EXISTS "zelle_transfers_read" ON public.zelle_transfers;
DROP POLICY IF EXISTS "zelle_transfers_insert" ON public.zelle_transfers;
DROP POLICY IF EXISTS "zelle_transfers_update" ON public.zelle_transfers;
CREATE POLICY "zelle_transfers_read" ON public.zelle_transfers FOR SELECT USING (true);
CREATE POLICY "zelle_transfers_insert" ON public.zelle_transfers FOR INSERT WITH CHECK (true);
CREATE POLICY "zelle_transfers_update" ON public.zelle_transfers FOR UPDATE USING (true);

-- BILL PAYMENTS policies
DROP POLICY IF EXISTS "bill_payments_read" ON public.bill_payments;
DROP POLICY IF EXISTS "bill_payments_insert" ON public.bill_payments;
DROP POLICY IF EXISTS "bill_payments_update" ON public.bill_payments;
CREATE POLICY "bill_payments_read" ON public.bill_payments FOR SELECT USING (true);
CREATE POLICY "bill_payments_insert" ON public.bill_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "bill_payments_update" ON public.bill_payments FOR UPDATE USING (true);

-- NOTIFICATION PREFERENCES policies
DROP POLICY IF EXISTS "notification_prefs_read" ON public.notification_preferences;
DROP POLICY IF EXISTS "notification_prefs_insert" ON public.notification_preferences;
DROP POLICY IF EXISTS "notification_prefs_update" ON public.notification_preferences;
CREATE POLICY "notification_prefs_read" ON public.notification_preferences FOR SELECT USING (true);
CREATE POLICY "notification_prefs_insert" ON public.notification_preferences FOR INSERT WITH CHECK (true);
CREATE POLICY "notification_prefs_update" ON public.notification_preferences FOR UPDATE USING (true);

-- LOGIN HISTORY policies
DROP POLICY IF EXISTS "login_history_read" ON public.login_history;
DROP POLICY IF EXISTS "login_history_insert" ON public.login_history;
CREATE POLICY "login_history_read" ON public.login_history FOR SELECT USING (true);
CREATE POLICY "login_history_insert" ON public.login_history FOR INSERT WITH CHECK (true);

-- USER SETTINGS policies
DROP POLICY IF EXISTS "user_settings_read" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_insert" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_update" ON public.user_settings;
CREATE POLICY "user_settings_read" ON public.user_settings FOR SELECT USING (true);
CREATE POLICY "user_settings_insert" ON public.user_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "user_settings_update" ON public.user_settings FOR UPDATE USING (true);
