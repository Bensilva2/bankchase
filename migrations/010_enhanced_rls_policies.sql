-- Enhanced Row-Level Security Policies
-- Comprehensive RLS for multi-role banking system
-- Run this in Supabase SQL editor

BEGIN;

-- Drop existing policies to replace with comprehensive ones
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT
    USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin');

-- Users can update their own profile
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admin can see all users
CREATE POLICY "admin_select_all_users" ON public.users
    FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

-- Admin can update user roles
CREATE POLICY "admin_update_users" ON public.users
    FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- ACCOUNTS TABLE POLICIES
-- ============================================

-- Users can view only their accounts
CREATE POLICY "accounts_select_own" ON public.accounts
    FOR SELECT
    USING (user_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'auditor'));

-- Users can only update their own accounts
CREATE POLICY "accounts_update_own" ON public.accounts
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can insert only their own accounts
CREATE POLICY "accounts_insert_own" ON public.accounts
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Admin can manage all accounts
CREATE POLICY "admin_accounts_all" ON public.accounts
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- TRANSACTIONS TABLE POLICIES
-- ============================================

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    amount NUMERIC(18, 4) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users see only their transactions
CREATE POLICY "transactions_select_own" ON public.transactions
    FOR SELECT
    USING (user_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'auditor'));

-- Users can only view transactions from their accounts
CREATE POLICY "transactions_view_own_accounts" ON public.transactions
    FOR SELECT
    USING (
        account_id IN (
            SELECT id FROM public.accounts 
            WHERE user_id = auth.uid()
        ) OR auth.jwt() ->> 'role' IN ('admin', 'auditor')
    );

-- ============================================
-- TRANSFERS TABLE POLICIES
-- ============================================

CREATE TABLE IF NOT EXISTS public.transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_account_id UUID NOT NULL REFERENCES public.accounts(id),
    to_account_id UUID NOT NULL REFERENCES public.accounts(id),
    from_user_id UUID NOT NULL REFERENCES public.users(id),
    to_user_id UUID NOT NULL REFERENCES public.users(id),
    amount NUMERIC(18, 4) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- Users can view transfers from/to their accounts
CREATE POLICY "transfers_select_own" ON public.transfers
    FOR SELECT
    USING (
        from_user_id = auth.uid() OR 
        to_user_id = auth.uid() OR 
        auth.jwt() ->> 'role' IN ('admin', 'auditor')
    );

-- Users can only create transfers from their accounts
CREATE POLICY "transfers_insert_own" ON public.transfers
    FOR INSERT
    WITH CHECK (from_user_id = auth.uid());

-- ============================================
-- AUDIT LOGS TABLE POLICIES
-- ============================================

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "audit_logs_admin_only" ON public.admin_audit_logs
    FOR SELECT
    USING (auth.jwt() ->> 'role' IN ('admin', 'auditor'));

-- Only admins can insert audit logs (automatic via triggers)
CREATE POLICY "audit_logs_admin_insert" ON public.admin_audit_logs
    FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR current_user = 'service_role');

-- ============================================
-- LOGIN HISTORY POLICIES
-- ============================================

ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own login history
CREATE POLICY "login_history_select_own" ON public.login_history
    FOR SELECT
    USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- Insert login records (via trigger/function)
CREATE POLICY "login_history_insert" ON public.login_history
    FOR INSERT
    WITH CHECK (true);

-- ============================================
-- COMPLIANCE ROLE & POLICIES
-- ============================================

-- Add compliance role if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('customer', 'admin', 'auditor', 'compliance');
    END IF;
END
$$;

-- Compliance role can view all data but not modify
CREATE POLICY "compliance_read_all" ON public.users
    FOR SELECT
    USING (auth.jwt() ->> 'role' = 'compliance');

CREATE POLICY "compliance_read_accounts" ON public.accounts
    FOR SELECT
    USING (auth.jwt() ->> 'role' = 'compliance');

CREATE POLICY "compliance_read_transfers" ON public.transfers
    FOR SELECT
    USING (auth.jwt() ->> 'role' = 'compliance');

-- ============================================
-- SECURITY FUNCTIONS
-- ============================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(auth.jwt() ->> 'role', 'customer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.jwt() ->> 'role' = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is auditor
CREATE OR REPLACE FUNCTION is_auditor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.jwt() ->> 'role' IN ('auditor', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
