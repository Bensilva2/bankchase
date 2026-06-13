-- RBAC and Enhanced Authentication Schema
-- Run this migration in Supabase SQL editor

BEGIN;

-- Create user roles enum
CREATE TYPE user_role AS ENUM ('customer', 'admin', 'auditor');

-- Create users table with RBAC
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15),
    role user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create customer accounts table (zero-balance on creation)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    routing_number VARCHAR(9) NOT NULL DEFAULT '123456789',
    account_type VARCHAR(50) NOT NULL DEFAULT 'checking',
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    balance NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create 2FA tokens table
CREATE TABLE IF NOT EXISTS public.two_factor_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS public.password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create admin audit logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    target_resource VARCHAR(255),
    target_user_id UUID REFERENCES public.users(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create login history table
CREATE TABLE IF NOT EXISTS public.login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_name VARCHAR(255),
    success BOOLEAN NOT NULL DEFAULT TRUE,
    failure_reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_number ON public.accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_2fa_user_id ON public.two_factor_codes(user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON public.password_resets(token_hash);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON public.admin_audit_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.admin_audit_logs(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON public.login_history(user_id, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read their own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for accounts table
CREATE POLICY "Users can read their own account" ON public.accounts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can read all accounts" ON public.accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for admin audit logs
CREATE POLICY "Admins can read audit logs" ON public.admin_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'auditor')
        )
    );

CREATE POLICY "Admins can insert audit logs" ON public.admin_audit_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for login history
CREATE POLICY "Users can read their own login history" ON public.login_history
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can read all login history" ON public.login_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
        )
    );

COMMIT;
